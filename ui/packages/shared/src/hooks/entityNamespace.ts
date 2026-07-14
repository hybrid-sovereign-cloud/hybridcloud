import { useEffect, useState } from 'react';
import { K8sResource } from '../types';
import { useK8sResourceList } from './k8s';

const ENTITY_LABEL = 'hybridsovereign.redhat/entity';
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
}

/**
 * Derive the tenant entity namespace from OIDC group membership or Entity CR labels.
 * Matches group prefix `<entity-slug>-*` to Entity metadata.name.
 */
export function useEntityNamespace(
  options: UseEntityNamespaceOptions = {},
): UseEntityNamespaceResult {
  const { userGroups = [], fallbackNamespace = DEFAULT_NAMESPACE } = options;
  const { items: entities, loading: entitiesLoading } = useK8sResourceList<K8sResource>('Entity');
  const [namespace, setNamespace] = useState(fallbackNamespace);
  const [entity, setEntity] = useState<K8sResource | null>(null);

  useEffect(() => {
    if (entitiesLoading) return;

    if (userGroups.length > 0 && entities.length > 0) {
      for (const ent of entities) {
        const slug = ent.metadata.name;
        const prefix = `${slug}-`;
        if (userGroups.some((g) => g.startsWith(prefix) || g === `${slug}-entity-admin`)) {
          setNamespace(`entity-${slug}`);
          setEntity(ent);
          return;
        }
      }
    }

    if (entities.length === 1) {
      const ent = entities[0];
      setNamespace(`entity-${ent.metadata.name}`);
      setEntity(ent);
      return;
    }

    const labeled = entities.find(
      (ent) => ent.metadata.labels?.[ENTITY_LABEL] === 'true',
    );
    if (labeled) {
      setNamespace(labeled.metadata.namespace ?? `entity-${labeled.metadata.name}`);
      setEntity(labeled);
      return;
    }

    setNamespace(fallbackNamespace);
    setEntity(null);
  }, [entities, entitiesLoading, userGroups, fallbackNamespace]);

  return { namespace, loading: entitiesLoading, entity };
}
