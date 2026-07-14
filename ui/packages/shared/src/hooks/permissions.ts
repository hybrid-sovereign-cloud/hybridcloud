import { useEffect, useMemo, useState } from 'react';
import { HybridSovereignKind, KIND_PLURALS } from '../types';

export type K8sVerb = 'create' | 'get' | 'list' | 'update' | 'patch' | 'delete';

export interface PermissionCheck {
  resource: string;
  verb: K8sVerb;
}

export interface UsePermissionsResult {
  /** Map of `${resource}/${verb}` → allowed */
  permissions: Record<string, boolean>;
  loading: boolean;
  can: (resource: string, verb: K8sVerb) => boolean;
}

let permissionsBaseUrl = '/api/k8s';

export function configurePermissionsClient(baseUrl: string): void {
  permissionsBaseUrl = baseUrl;
}

async function fetchCanI(
  namespace: string,
  resource: string,
  verb: K8sVerb,
  token?: string,
): Promise<boolean> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${permissionsBaseUrl}/can-i/${namespace}/${resource}/${verb}`;
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return false;
    const data = (await response.json()) as { allowed?: boolean };
    return !!data.allowed;
  } catch {
    return false;
  }
}

/** Batch SubjectAccessReview checks for a namespace */
export function usePermissions(
  namespace: string,
  checks: PermissionCheck[],
  options: { token?: string; enabled?: boolean } = {},
): UsePermissionsResult {
  const { token, enabled = true } = options;
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(enabled);

  const checkKey = useMemo(
    () => checks.map((c) => `${c.resource}/${c.verb}`).join(','),
    [checks],
  );

  useEffect(() => {
    if (!enabled || !namespace || checks.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      checks.map(async (check) => {
        const allowed = await fetchCanI(namespace, check.resource, check.verb, token);
        return [`${check.resource}/${check.verb}`, allowed] as const;
      }),
    )
      .then((entries) => {
        if (!cancelled) {
          setPermissions(Object.fromEntries(entries));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [namespace, checkKey, enabled, token, checks]);

  const can = (resource: string, verb: K8sVerb): boolean =>
    permissions[`${resource}/${verb}`] ?? false;

  return { permissions, loading, can };
}

/** Convenience: check list permission for a Hybrid Sovereign kind in a namespace */
export function useCanListKind(
  namespace: string,
  kind: HybridSovereignKind,
  options: { token?: string; enabled?: boolean } = {},
): { allowed: boolean; loading: boolean } {
  const plural = KIND_PLURALS[kind];
  const { can, loading } = usePermissions(
    namespace,
    [{ resource: plural, verb: 'list' }],
    options,
  );
  return { allowed: can(plural, 'list'), loading };
}
