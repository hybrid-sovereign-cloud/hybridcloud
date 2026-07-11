import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  API_VERSION_FULL,
  HybridSovereignKind,
  KIND_PLURALS,
  K8sResource,
} from '../types';

export interface K8sClientConfig {
  /** Base URL for the dashboard K8s proxy (e.g. /api/k8s) */
  baseUrl?: string;
  /** Bearer token for SubjectAccessReview-authenticated requests */
  token?: string;
}

export interface UseK8sResourceListOptions {
  namespace?: string;
  labelSelector?: string;
  fieldSelector?: string;
  pollIntervalMs?: number;
  enabled?: boolean;
}

export interface UseK8sResourceListResult<T extends K8sResource> {
  items: T[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export interface UseK8sResourceOptions {
  namespace?: string;
  pollIntervalMs?: number;
  enabled?: boolean;
}

export interface UseK8sResourceResult<T extends K8sResource> {
  resource: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

let globalK8sConfig: K8sClientConfig = { baseUrl: '/api/k8s' };

/** Configure the K8s proxy client used by all hooks */
export function configureK8sClient(config: K8sClientConfig): void {
  globalK8sConfig = { ...globalK8sConfig, ...config };
}

function buildListUrl(kind: HybridSovereignKind, options: UseK8sResourceListOptions): string {
  const plural = KIND_PLURALS[kind];
  const base = globalK8sConfig.baseUrl ?? '/api/k8s';
  const params = new URLSearchParams();
  if (options.labelSelector) params.set('labelSelector', options.labelSelector);
  if (options.fieldSelector) params.set('fieldSelector', options.fieldSelector);
  const query = params.toString() ? `?${params.toString()}` : '';

  if (options.namespace) {
    return `${base}/apis/${API_VERSION_FULL}/namespaces/${options.namespace}/${plural}${query}`;
  }
  return `${base}/apis/${API_VERSION_FULL}/${plural}${query}`;
}

function buildResourceUrl(
  kind: HybridSovereignKind,
  name: string,
  namespace?: string,
): string {
  const plural = KIND_PLURALS[kind];
  const base = globalK8sConfig.baseUrl ?? '/api/k8s';
  if (namespace) {
    return `${base}/apis/${API_VERSION_FULL}/namespaces/${namespace}/${plural}/${name}`;
  }
  return `${base}/apis/${API_VERSION_FULL}/${plural}/${name}`;
}

async function k8sFetch<T>(url: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (globalK8sConfig.token) {
    headers.Authorization = `Bearer ${globalK8sConfig.token}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`K8s API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/** List Hybrid Sovereign CRs of a given kind */
export function useK8sResourceList<T extends K8sResource>(
  kind: HybridSovereignKind,
  options: UseK8sResourceListOptions = {},
): UseK8sResourceListResult<T> {
  const { namespace, pollIntervalMs, enabled = true } = options;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const url = useMemo(() => buildListUrl(kind, options), [kind, namespace, options.labelSelector, options.fieldSelector]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    k8sFetch<{ items: T[] }>(url)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [url, enabled, tick]);

  useEffect(() => {
    if (!pollIntervalMs || !enabled) return;
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs, enabled, refresh]);

  return { items, loading, error, refresh };
}

/** Fetch a single Hybrid Sovereign CR by name */
export function useK8sResource<T extends K8sResource>(
  kind: HybridSovereignKind,
  name: string,
  options: UseK8sResourceOptions = {},
): UseK8sResourceResult<T> {
  const { namespace, pollIntervalMs, enabled = true } = options;
  const [resource, setResource] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const url = useMemo(
    () => buildResourceUrl(kind, name, namespace),
    [kind, name, namespace],
  );

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled || !name) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    k8sFetch<T>(url)
      .then((data) => {
        if (!cancelled) {
          setResource(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [url, enabled, name, tick]);

  useEffect(() => {
    if (!pollIntervalMs || !enabled) return;
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs, enabled, refresh]);

  return { resource, loading, error, refresh };
}

/** Check if the current user can perform a verb on a resource (SubjectAccessReview) */
export function useCanI(
  namespace: string,
  resource: string,
  verb: 'create' | 'get' | 'list' | 'update' | 'patch' | 'delete',
): { allowed: boolean; loading: boolean } {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = globalK8sConfig.baseUrl ?? '/api/k8s';
    const url = `${base}/can-i/${namespace}/${resource}/${verb}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (globalK8sConfig.token) {
      headers.Authorization = `Bearer ${globalK8sConfig.token}`;
    }

    fetch(url, { headers })
      .then((r) => r.json())
      .then((data: { allowed?: boolean }) => setAllowed(!!data.allowed))
      .catch(() => setAllowed(false))
      .finally(() => setLoading(false));
  }, [namespace, resource, verb]);

  return { allowed, loading };
}
