import { useCallback, useEffect, useState } from 'react';
import { K8sResource } from '../types';
import { useK8sResourceList } from './k8s';

const ENTITY_LABEL = 'hybridsovereign.redhat/entity';
const STORAGE_KEY = 'hybridsovereign-entity-ns';
const DEFAULT_NAMESPACE = 'entity-acme-corp';

export interface UseEntityNamespaceOptions {
  /** OIDC groups from the authenticated user (e.g. acme-corp-platform-engineering-admins) */
  userGroups?: string[];
  /** Fallback when groups cannot be resolved */
  fallbackNamespace?: string;
}

export interface UseEntityNamespaceResult {
  namespace: string;
  loading: boolean;
  entity: K8sResource | null;
  /** All Entity CRs the user can see (for switcher) */
  entities: K8sResource[];
  setNamespace: (ns: string) => void;
  selectEntity: (entityName: string) => void;
}

function nsFromEntityName(name: string): string {
  return name.startsWith('entity-') ? name : `entity-${name}`;
}

/**
 * Derive the tenant entity namespace from OIDC group membership or Entity CR labels.
 * Supports explicit switching with sessionStorage persistence.
 */
export function useEntityNamespace(
  options: UseEntityNamespaceOptions = {},
): UseEntityNamespaceResult {
  const { userGroups = [], fallbackNamespace = DEFAULT_NAMESPACE } = options;
  const { items: entities, loading: entitiesLoading } = useK8sResourceList<K8sResource>('Entity');
  const [namespace, setNamespaceState] = useState(() => {
    if (typeof window === 'undefined') return fallbackNamespace;
    return sessionStorage.getItem(STORAGE_KEY) || fallbackNamespace;
  });
  const [entity, setEntity] = useState<K8sResource | null>(null);
  const [userPicked, setUserPicked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem(STORAGE_KEY);
  });

  const setNamespace = useCallback((ns: string) => {
    const finalNs = ns.startsWith('entity-') ? ns : `entity-${ns}`;
    setNamespaceState(finalNs);
    setUserPicked(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, finalNs);
    }
  }, []);

  const selectEntity = useCallback(
    (entityName: string) => {
      setNamespace(nsFromEntityName(entityName));
    },
    [setNamespace],
  );

  useEffect(() => {
    if (entitiesLoading) return;

    const matchEntity = (ns: string): K8sResource | null => {
      const slug = ns.replace(/^entity-/, '');
      return entities.find((e) => e.metadata.name === slug) ?? null;
    };

    if (userPicked) {
      setEntity(matchEntity(namespace));
      return;
    }

    if (userGroups.length > 0 && entities.length > 0) {
      for (const ent of entities) {
        const slug = ent.metadata.name;
        const prefix = `${slug}-`;
        if (userGroups.some((g) => g.startsWith(prefix) || g === `${slug}-entity-admin`)) {
          const ns = `entity-${slug}`;
          setNamespaceState(ns);
          setEntity(ent);
          if (typeof window !== 'undefined') sessionStorage.setItem(STORAGE_KEY, ns);
          return;
        }
      }
    }

    if (entities.length === 1) {
      const ent = entities[0];
      const ns = `entity-${ent.metadata.name}`;
      setNamespaceState(ns);
      setEntity(ent);
      if (typeof window !== 'undefined') sessionStorage.setItem(STORAGE_KEY, ns);
      return;
    }

    const labeled = entities.find((ent) => ent.metadata.labels?.[ENTITY_LABEL] === 'true');
    if (labeled) {
      const ns = labeled.metadata.namespace ?? `entity-${labeled.metadata.name}`;
      setNamespaceState(ns);
      setEntity(labeled);
      if (typeof window !== 'undefined') sessionStorage.setItem(STORAGE_KEY, ns);
      return;
    }

    // Keep stored / fallback; sync entity object if possible
    setEntity(matchEntity(namespace));
  }, [entities, entitiesLoading, userGroups, fallbackNamespace, userPicked, namespace]);

  return {
    namespace,
    loading: entitiesLoading,
    entity,
    entities,
    setNamespace,
    selectEntity,
  };
}
