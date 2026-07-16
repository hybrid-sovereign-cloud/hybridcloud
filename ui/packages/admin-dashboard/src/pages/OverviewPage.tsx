import React from 'react';
import { Title, Card, CardTitle, CardBody } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import {
  EntityTopology,
  PageHeader,
  HealthStrip,
  useK8sResourceList,
  K8sResource,
} from '@hybridsovereign/shared';

const LINKS = [
  { title: 'Entities', description: 'Top-level tenants and namespaces', path: '/entities' },
  { title: 'Personas', description: 'Cross-entity persona templates', path: '/personas' },
  { title: 'Service URLs', description: 'Route health across clusters', path: '/services' },
  { title: 'Operators', description: 'RBAC and plugin operator status', path: '/operators' },
  { title: 'Platforms', description: 'Managed OpenShift clusters', path: '/platforms' },
  { title: 'Assignments', description: 'Team-to-platform bindings', path: '/assignments' },
];

export function OverviewPage(): React.ReactElement {
  const entities = useK8sResourceList<K8sResource>('Entity', { pollIntervalMs: 30000 });
  const teams = useK8sResourceList<K8sResource>('Team', { pollIntervalMs: 30000 });
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', { pollIntervalMs: 30000 });
  const assignments = useK8sResourceList<K8sResource>('Assignment', { pollIntervalMs: 30000 });

  const readyCount = (items: K8sResource[]) => items.filter((i) => i.status?.ready).length;

  return (
    <>
      <PageHeader
        title="Platform Overview"
        subtitle="Cluster-wide health, live topology, and tenancy entry points"
        breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Overview' }]}
      />

      <HealthStrip
        tiles={[
          {
            label: 'Entities',
            value: entities.items.length,
            hint: `${readyCount(entities.items)} ready`,
            href: '/entities',
          },
          {
            label: 'Teams',
            value: teams.items.length,
            hint: `${readyCount(teams.items)} ready`,
            href: '/teams',
          },
          {
            label: 'Platforms',
            value: platforms.items.length,
            hint: `${readyCount(platforms.items)} ready`,
            href: '/platforms',
          },
          {
            label: 'Assignments',
            value: assignments.items.length,
            hint: `${readyCount(assignments.items)} ready`,
            href: '/assignments',
          },
        ]}
      />

      <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
        Quick links
      </Title>
      <div className="sc-card-grid" style={{ marginBottom: '2rem' }}>
        {LINKS.map((card) => (
          <Link key={card.path} to={card.path} className="sc-card-link">
            <Card isFullHeight isSelectable>
              <CardTitle>{card.title}</CardTitle>
              <CardBody>{card.description}</CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
        Live platform topology
      </Title>
      <EntityTopology filterByPermissions={false} />
    </>
  );
}
