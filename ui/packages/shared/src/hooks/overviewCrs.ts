import { useCallback, useEffect, useState } from 'react';
import { K8sResource } from '../types';
import { getK8sClientConfig } from './k8s';

export interface OverviewCRsResult {
  items: K8sResource[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/** Single aggregated CR fetch for admin Overview (/api/overview/crs) */
export function useOverviewCRs(pollIntervalMs = 60000): OverviewCRsResult {
  const [items, setItems] = useState<K8sResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const cfg = getK8sClientConfig();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;

    (cfg.fetchFn ?? fetch)('/api/overview/crs', { headers })
      .then(async (r) => {
        if (!r.ok) throw new Error(`K8s API error ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? (data as K8sResource[]) : []);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    if (!pollIntervalMs) return;
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs, refresh]);

  return { items, loading, error, refresh };
}
