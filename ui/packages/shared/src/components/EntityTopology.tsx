import React, { useMemo } from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  Spinner,
  Alert,
  Label,
} from '@patternfly/react-core';
import {
  HybridSovereignKind,
  KIND_PLURALS,
  K8sResource,
  OperatorStatus,
} from '../types';
import { useK8sResourceList } from '../hooks/k8s';
import { useCanListKind } from '../hooks/permissions';

export interface TopologyNode {
  id: string;
  label: string;
  kind: HybridSovereignKind | 'Group';
  status: 'ready' | 'pending' | 'failed' | 'reconciling' | 'unknown';
  namespace?: string;
}

export interface EntityTopologyProps {
  /** Entity namespace to scope tenant view; omit for platform-wide admin view */
  entityNamespace?: string;
  /** Hide kinds the user cannot list (RBAC-safe topology) */
  filterByPermissions?: boolean;
}

function statusFromReady(ready?: boolean, status?: string): TopologyNode['status'] {
  if (ready) return 'ready';
  if (status === 'failed') return 'failed';
  if (status === 'reconciling') return 'reconciling';
  if (status === 'pending') return 'pending';
  return 'unknown';
}

function statusColor(status: TopologyNode['status']): 'green' | 'orange' | 'red' | 'blue' | 'grey' {
  const map: Record<TopologyNode['status'], 'green' | 'orange' | 'red' | 'blue' | 'grey'> = {
    ready: 'green',
    pending: 'orange',
    failed: 'red',
    reconciling: 'blue',
    unknown: 'grey',
  };
  return map[status];
}

function TopologySection({
  title,
  nodes,
}: {
  title: string;
  nodes: TopologyNode[];
}): React.ReactElement | null {
  if (nodes.length === 0) return null;
  return (
    <Card isCompact style={{ marginBottom: '1rem' }}>
      <CardTitle>{title}</CardTitle>
      <CardBody>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {nodes.map((node) => (
            <Label key={node.id} color={statusColor(node.status)}>
              {node.label}
              {node.namespace ? ` (${node.namespace})` : ''}
            </Label>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

/** RBAC-aware entity → clouds → platforms → teams → projects → assignments topology */
export function EntityTopology({
  entityNamespace,
  filterByPermissions = true,
}: EntityTopologyProps): React.ReactElement {
  const ns = entityNamespace ?? '';
  const listOpts = entityNamespace ? { namespace: entityNamespace } : {};

  const entities = useK8sResourceList<K8sResource>('Entity', { enabled: !entityNamespace });
  const teams = useK8sResourceList<K8sResource>('Team', listOpts);
  const projects = useK8sResourceList<K8sResource>('Project', listOpts);
  const assignments = useK8sResourceList<K8sResource>('Assignment', listOpts);
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', listOpts);
  const cloudOso = useK8sResourceList<K8sResource>('CloudOSO', listOpts);
  const cloudAws = useK8sResourceList<K8sResource>('CloudAWS', listOpts);

  const teamPerm = useCanListKind(ns || 'default', 'Team', { enabled: filterByPermissions && !!ns });
  const projectPerm = useCanListKind(ns || 'default', 'Project', { enabled: filterByPermissions && !!ns });
  const assignmentPerm = useCanListKind(ns || 'default', 'Assignment', { enabled: filterByPermissions && !!ns });
  const platformPerm = useCanListKind(ns || 'default', 'PlatformOpenshift', { enabled: filterByPermissions && !!ns });
  const cloudOsoPerm = useCanListKind(ns || 'default', 'CloudOSO', { enabled: filterByPermissions && !!ns });
  const cloudAwsPerm = useCanListKind(ns || 'default', 'CloudAWS', { enabled: filterByPermissions && !!ns });

  const loading =
    entities.loading ||
    teams.loading ||
    projects.loading ||
    assignments.loading ||
    platforms.loading ||
    cloudOso.loading ||
    cloudAws.loading;

  const nodes = useMemo(() => {
    const entityNodes: TopologyNode[] = entityNamespace
      ? [{ id: entityNamespace, label: entityNamespace.replace(/^entity-/, ''), kind: 'Entity', status: 'ready', namespace: entityNamespace }]
      : entities.items.map((e) => ({
          id: e.metadata.uid ?? e.metadata.name,
          label: e.metadata.name,
          kind: 'Entity' as const,
          status: statusFromReady(e.status?.ready, e.status?.status),
        }));

    const toNodes = (
      items: K8sResource[],
      kind: HybridSovereignKind,
      allowed: boolean,
    ): TopologyNode[] =>
      !filterByPermissions || allowed
        ? items.map((item) => ({
            id: item.metadata.uid ?? `${item.metadata.namespace}/${item.metadata.name}`,
            label: item.metadata.name,
            kind,
            namespace: item.metadata.namespace,
            status: statusFromReady(item.status?.ready, item.status?.status),
          }))
        : [];

    return {
      entities: entityNodes,
      clouds: [
        ...toNodes(cloudOso.items, 'CloudOSO', cloudOsoPerm.allowed),
        ...toNodes(cloudAws.items, 'CloudAWS', cloudAwsPerm.allowed),
      ],
      platforms: toNodes(platforms.items, 'PlatformOpenshift', platformPerm.allowed),
      teams: toNodes(teams.items, 'Team', teamPerm.allowed),
      projects: toNodes(projects.items, 'Project', projectPerm.allowed),
      assignments: toNodes(assignments.items, 'Assignment', assignmentPerm.allowed),
    };
  }, [
    entityNamespace,
    entities.items,
    teams.items,
    projects.items,
    assignments.items,
    platforms.items,
    cloudOso.items,
    cloudAws.items,
    filterByPermissions,
    teamPerm.allowed,
    projectPerm.allowed,
    assignmentPerm.allowed,
    platformPerm.allowed,
    cloudOsoPerm.allowed,
    cloudAwsPerm.allowed,
  ]);

  if (loading) {
    return <Spinner aria-label="Loading topology" />;
  }

  const hasData = Object.values(nodes).some((n) => n.length > 0);
  if (!hasData) {
    return (
      <Alert variant="info" title="No topology data" isInline>
        No authorized resources found for{' '}
        {entityNamespace ? `namespace ${entityNamespace}` : 'the platform'}.
      </Alert>
    );
  }

  return (
    <div aria-label="Entity topology">
      <TopologySection title="Entities" nodes={nodes.entities} />
      <TopologySection title="Cloud Environments" nodes={nodes.clouds} />
      <TopologySection title="Platforms" nodes={nodes.platforms} />
      <TopologySection title="Teams" nodes={nodes.teams} />
      <TopologySection title="Projects" nodes={nodes.projects} />
      <TopologySection title="Assignments" nodes={nodes.assignments} />
      <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
        API resources: {Object.entries(KIND_PLURALS).slice(0, 5).map(([, p]) => p).join(', ')}…
      </p>
    </div>
  );
}
