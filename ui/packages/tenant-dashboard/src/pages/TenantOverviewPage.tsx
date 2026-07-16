import React from 'react';
import { Title, Card, CardTitle, CardBody } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { EntityTopology, PageHeader, HealthStrip, useK8sResourceList, K8sResource } from '@hybridsovereign/shared';

interface TenantOverviewPageProps {
  namespace: string;
}

const SELF_SERVICE = [
  { label: 'Create Team', path: '/create/team', hint: 'Team CR' },
  { label: 'Create Project', path: '/create/project', hint: 'Project CR' },
  { label: 'Request CloudOSO', path: '/create/cloudoso', hint: 'OpenStack env' },
  { label: 'Request Cloud AWS', path: '/create/cloudaws', hint: 'AWS env' },
  { label: 'Create Assignment', path: '/create/assignment', hint: 'Bind stack' },
];

export function TenantOverviewPage({ namespace }: TenantOverviewPageProps): React.ReactElement {
  const teams = useK8sResourceList<K8sResource>('Team', { namespace, pollIntervalMs: 30000 });
  const projects = useK8sResourceList<K8sResource>('Project', { namespace, pollIntervalMs: 30000 });
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', {
    namespace,
    pollIntervalMs: 30000,
  });
  const assignments = useK8sResourceList<K8sResource>('Assignment', {
    namespace,
    pollIntervalMs: 30000,
  });

  const ready = (items: K8sResource[]) => items.filter((i) => i.status?.ready).length;

  return (
    <>
      <PageHeader
        title="Entity Overview"
        subtitle={`Live topology and health for ${namespace}`}
        breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Overview' }]}
      />

      <HealthStrip
        tiles={[
          { label: 'Teams', value: teams.items.length, hint: `${ready(teams.items)} ready`, href: '/teams' },
          {
            label: 'Projects',
            value: projects.items.length,
            hint: `${ready(projects.items)} ready`,
            href: '/projects',
          },
          {
            label: 'Platforms',
            value: platforms.items.length,
            hint: `${ready(platforms.items)} ready`,
            href: '/platforms',
          },
          {
            label: 'Assignments',
            value: assignments.items.length,
            hint: `${ready(assignments.items)} ready`,
            href: '/assignments',
          },
        ]}
      />

      <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
        Quick actions
      </Title>
      <div className="sc-card-grid" style={{ marginBottom: '2rem' }}>
        {SELF_SERVICE.map((action) => (
          <Link key={action.path} to={action.path} className="sc-card-link">
            <Card isFullHeight isSelectable>
              <CardTitle>{action.label}</CardTitle>
              <CardBody>{action.hint}</CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
        Live entity topology
      </Title>
      <EntityTopology entityNamespace={namespace} filterByPermissions />
    </>
  );
}
