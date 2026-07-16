import React, { useMemo, useRef, useState } from 'react';
import { Spinner, Alert, Button } from '@patternfly/react-core';
import {
  ExpandIcon,
  SearchPlusIcon,
  SearchMinusIcon,
  CompressAltIcon,
} from '@patternfly/react-icons';
import { HybridSovereignKind, K8sResource } from '../types';
import { useK8sResourceList } from '../hooks/k8s';
import { useCanListKind } from '../hooks/permissions';
import { normalizeHealth } from './StatusBadge';

export interface TopologyNode {
  id: string;
  label: string;
  kind: HybridSovereignKind | 'Group';
  status: 'ready' | 'pending' | 'failed' | 'reconciling' | 'unknown';
  namespace?: string;
  x?: number;
  y?: number;
}

export interface TopologyEdge {
  id: string;
  from: string;
  to: string;
  failed?: boolean;
}

export interface EntityTopologyProps {
  entityNamespace?: string;
  filterByPermissions?: boolean;
}

const COL_GAP = 200;
const ROW_GAP = 64;
const NODE_W = 148;
const NODE_H = 44;
const PAD_X = 24;
const PAD_Y = 36;

function statusFromReady(ready?: boolean, status?: string): TopologyNode['status'] {
  return normalizeHealth(ready, status);
}

function statusColor(status: TopologyNode['status']): string {
  if (status === 'ready') return 'var(--sc-success, #3e8635)';
  if (status === 'failed') return 'var(--sc-danger, #c9190b)';
  if (status === 'pending' || status === 'reconciling') return 'var(--sc-warning, #f0ab00)';
  return 'var(--sc-text-muted, #6a6e73)';
}

function layoutColumns(columns: TopologyNode[][]): {
  nodes: TopologyNode[];
  width: number;
  height: number;
} {
  const placed: TopologyNode[] = [];
  let maxH = 0;
  columns.forEach((col, ci) => {
    col.forEach((node, ri) => {
      placed.push({
        ...node,
        x: PAD_X + ci * COL_GAP,
        y: PAD_Y + ri * ROW_GAP,
      });
    });
    maxH = Math.max(maxH, col.length);
  });
  return {
    nodes: placed,
    width: PAD_X * 2 + Math.max(columns.length - 1, 0) * COL_GAP + NODE_W,
    height: PAD_Y * 2 + Math.max(maxH - 1, 0) * ROW_GAP + NODE_H,
  };
}

function edgePath(
  from: TopologyNode,
  to: TopologyNode,
): string {
  const x1 = (from.x ?? 0) + NODE_W;
  const y1 = (from.y ?? 0) + NODE_H / 2;
  const x2 = to.x ?? 0;
  const y2 = (to.y ?? 0) + NODE_H / 2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

/** Live entity topology — layered SVG graph matching design-assets */
export function EntityTopology({
  entityNamespace,
  filterByPermissions = false,
}: EntityTopologyProps): React.ReactElement {
  const ns = entityNamespace ?? '';
  const listOpts = useMemo(
    () => (entityNamespace ? { namespace: entityNamespace, pollIntervalMs: 60000 } : { pollIntervalMs: 60000 }),
    [entityNamespace],
  );

  const entities = useK8sResourceList<K8sResource>('Entity', {
    enabled: !entityNamespace,
    pollIntervalMs: 60000,
  });
  const teams = useK8sResourceList<K8sResource>('Team', listOpts);
  const projects = useK8sResourceList<K8sResource>('Project', listOpts);
  const assignments = useK8sResourceList<K8sResource>('Assignment', listOpts);
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', listOpts);
  const cloudOso = useK8sResourceList<K8sResource>('CloudOSO', listOpts);
  const cloudAws = useK8sResourceList<K8sResource>('CloudAWS', listOpts);

  const teamPerm = useCanListKind(ns || 'default', 'Team', { enabled: filterByPermissions && !!ns });
  const projectPerm = useCanListKind(ns || 'default', 'Project', { enabled: filterByPermissions && !!ns });
  const assignmentPerm = useCanListKind(ns || 'default', 'Assignment', {
    enabled: filterByPermissions && !!ns,
  });
  const platformPerm = useCanListKind(ns || 'default', 'PlatformOpenshift', {
    enabled: filterByPermissions && !!ns,
  });
  const cloudOsoPerm = useCanListKind(ns || 'default', 'CloudOSO', {
    enabled: filterByPermissions && !!ns,
  });
  const cloudAwsPerm = useCanListKind(ns || 'default', 'CloudAWS', {
    enabled: filterByPermissions && !!ns,
  });

  const [zoom, setZoom] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const graph = useMemo(() => {
    const allow = (ok: boolean) => !filterByPermissions || ok;
    const toNode = (item: K8sResource, kind: HybridSovereignKind): TopologyNode => ({
      id: `${kind}/${item.metadata.namespace ?? ''}/${item.metadata.name}`,
      label: item.metadata.name,
      kind,
      namespace: item.metadata.namespace,
      status: statusFromReady(item.status?.ready, item.status?.status),
    });

    const entityNodes: TopologyNode[] = entityNamespace
      ? [
          {
            id: `Entity/${entityNamespace}`,
            label: entityNamespace.replace(/^entity-/, ''),
            kind: 'Entity',
            status: 'ready',
            namespace: entityNamespace,
          },
        ]
      : entities.items.map((e) => toNode(e, 'Entity'));

    const teamNodes = allow(teamPerm.allowed) ? teams.items.map((i) => toNode(i, 'Team')) : [];
    const projectNodes = allow(projectPerm.allowed)
      ? projects.items.map((i) => toNode(i, 'Project'))
      : [];
    const assignmentNodes = allow(assignmentPerm.allowed)
      ? assignments.items.map((i) => toNode(i, 'Assignment'))
      : [];
    const platformNodes = allow(platformPerm.allowed)
      ? platforms.items.map((i) => toNode(i, 'PlatformOpenshift'))
      : [];
    const cloudNodes = [
      ...(allow(cloudOsoPerm.allowed) ? cloudOso.items.map((i) => toNode(i, 'CloudOSO')) : []),
      ...(allow(cloudAwsPerm.allowed) ? cloudAws.items.map((i) => toNode(i, 'CloudAWS')) : []),
    ];

    // Tenant view: Entity → Teams → Projects → Assignments (+ clouds linked)
    // Admin view: Entities → Platforms → Assignments
    const columns: TopologyNode[][] = entityNamespace
      ? [entityNodes, teamNodes, projectNodes, assignmentNodes, cloudNodes.length ? cloudNodes : platformNodes]
      : [entityNodes, platformNodes, assignmentNodes];

    const { nodes, width, height } = layoutColumns(columns.filter((c) => c.length > 0));
    const byKey = new Map(nodes.map((n) => [n.id, n]));
    const byKindName = new Map(nodes.map((n) => [`${n.kind}:${n.label}`, n]));

    const edges: TopologyEdge[] = [];
    const link = (fromId: string, toId: string, failed?: boolean) => {
      if (byKey.has(fromId) && byKey.has(toId)) {
        edges.push({ id: `${fromId}->${toId}`, from: fromId, to: toId, failed });
      }
    };

    if (entityNamespace && entityNodes[0]) {
      for (const t of teamNodes) link(entityNodes[0].id, t.id, t.status === 'failed');
      for (const t of teamNodes) {
        // heuristic: projects share prefix or all under entity
        for (const p of projectNodes.slice(0, 8)) {
          link(t.id, p.id, p.status === 'failed');
        }
      }
    }

    for (const a of assignments.items) {
      const aNode = byKindName.get(`Assignment:${a.metadata.name}`);
      if (!aNode) continue;
      const spec = (a.spec || {}) as {
        team?: string;
        projects?: string[];
        openshift?: string;
        aws?: string;
      };
      if (spec.team) {
        const t = byKindName.get(`Team:${spec.team}`);
        if (t) link(t.id, aNode.id, aNode.status === 'failed');
      }
      for (const pName of spec.projects ?? []) {
        const p = byKindName.get(`Project:${pName}`);
        if (p) link(p.id, aNode.id, aNode.status === 'failed');
      }
      if (spec.openshift) {
        const p = byKindName.get(`PlatformOpenshift:${spec.openshift}`);
        if (p) link(p.id, aNode.id, aNode.status === 'failed');
      }
      if (spec.aws) {
        const c = byKindName.get(`CloudAWS:${spec.aws}`);
        if (c) link(c.id, aNode.id, aNode.status === 'failed');
      }
    }

    // Admin: entity → platform heuristic (same namespace entity-*)
    if (!entityNamespace) {
      for (const e of entityNodes) {
        for (const p of platformNodes) {
          if (p.namespace === `entity-${e.label}` || p.label.includes(e.label)) {
            link(e.id, p.id, p.status === 'failed');
          }
        }
      }
      for (const p of platformNodes) {
        for (const a of assignmentNodes) {
          if (a.namespace === p.namespace) link(p.id, a.id, a.status === 'failed');
        }
      }
    }

    return { nodes, edges, width: Math.max(width, 640), height: Math.max(height, 200) };
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

  const loading =
    entities.loading ||
    teams.loading ||
    projects.loading ||
    assignments.loading ||
    platforms.loading ||
    cloudOso.loading ||
    cloudAws.loading;

  if (loading && graph.nodes.length === 0) {
    return <Spinner aria-label="Loading topology" />;
  }

  if (graph.nodes.length === 0) {
    return (
      <Alert variant="info" title="No topology data" isInline>
        No authorized resources found for{' '}
        {entityNamespace ? `namespace ${entityNamespace}` : 'the platform'}.
      </Alert>
    );
  }

  const fit = () => {
    const el = wrapRef.current;
    if (!el) return;
    const scale = Math.min(1, (el.clientWidth - 16) / graph.width);
    setZoom(Math.max(0.5, scale));
  };

  return (
    <div className="sc-topology-graph" aria-label="Entity topology">
      <div className="sc-topology-graph__toolbar">
        <div className="sc-topo-legend">
          <span>
            <i className="sc-dot sc-dot--ready" /> Healthy
          </span>
          <span>
            <i className="sc-dot sc-dot--failed" /> Failed
          </span>
          <span>
            <i className="sc-dot sc-dot--pending" /> Pending
          </span>
        </div>
        <div className="sc-topology-graph__controls">
          <Button variant="plain" size="sm" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>
            <SearchPlusIcon />
          </Button>
          <Button variant="plain" size="sm" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
            <SearchMinusIcon />
          </Button>
          <Button variant="secondary" size="sm" icon={<CompressAltIcon />} onClick={fit}>
            Fit to view
          </Button>
          <Button
            variant="plain"
            size="sm"
            aria-label="Fullscreen"
            onClick={() => wrapRef.current?.requestFullscreen?.()}
          >
            <ExpandIcon />
          </Button>
        </div>
      </div>
      <div className="sc-topology-graph__viewport" ref={wrapRef}>
        <svg
          width={graph.width * zoom}
          height={graph.height * zoom}
          viewBox={`0 0 ${graph.width} ${graph.height}`}
          className="sc-topology-svg"
        >
          <defs>
            <marker
              id="sc-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6a6e73" />
            </marker>
            <marker
              id="sc-arrow-failed"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#c9190b" />
            </marker>
          </defs>
          {graph.edges.map((e) => {
            const from = graph.nodes.find((n) => n.id === e.from);
            const to = graph.nodes.find((n) => n.id === e.to);
            if (!from || !to) return null;
            return (
              <path
                key={e.id}
                d={edgePath(from, to)}
                className={e.failed ? 'sc-topology-edge sc-topology-edge--failed' : 'sc-topology-edge'}
                markerEnd={e.failed ? 'url(#sc-arrow-failed)' : 'url(#sc-arrow)'}
              />
            );
          })}
          {graph.nodes.map((n) => (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`} className={`sc-topology-node sc-topology-node--${n.status}`}>
              <rect width={NODE_W} height={NODE_H} rx={3} ry={3} />
              <circle cx={12} cy={NODE_H / 2} r={4} fill={statusColor(n.status)} />
              <text x={22} y={18} className="sc-topology-node__kind">
                {n.kind}
              </text>
              <text x={22} y={34} className="sc-topology-node__name">
                {n.label.length > 16 ? `${n.label.slice(0, 15)}…` : n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
