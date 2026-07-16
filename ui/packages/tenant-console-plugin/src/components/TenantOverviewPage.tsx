import * as React from 'react';
import { PageSection, Title, Card, CardTitle, CardBody } from '@patternfly/react-core';
import {
  EntityTopology,
  PageHeader,
  NamespaceContextBar,
  HealthStrip,
  useK8sResourceList,
  K8sResource,
  configureK8sClient,
} from '@hybridsovereign/shared';
import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk';
import '@hybridsovereign/shared/styles/openshift.css';

configureK8sClient({
  baseUrl: '/api/kubernetes',
  fetchFn: consoleFetch as unknown as typeof fetch,
});

const TenantOverviewPage: React.FC = () => {
  const ns =
    (typeof window !== 'undefined' &&
      (sessionStorage.getItem('hybridsovereign-entity-ns') || '')) ||
    'entity-acme-corp';

  const teams = useK8sResourceList<K8sResource>('Team', { namespace: ns, pollIntervalMs: 30000 });
  const projects = useK8sResourceList<K8sResource>('Project', {
    namespace: ns,
    pollIntervalMs: 30000,
  });
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', {
    namespace: ns,
    pollIntervalMs: 30000,
  });
  const assignments = useK8sResourceList<K8sResource>('Assignment', {
    namespace: ns,
    pollIntervalMs: 30000,
  });
  const ready = (items: K8sResource[]) => items.filter((i) => i.status?.ready).length;

  return (
    <PageSection className="sc-console-page">
      <div className="sc-page">
        <PageHeader
          title="Entity Overview"
          subtitle="Tenant-scoped health and live topology"
          breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Tenancy' }, { label: 'Overview' }]}
        />
        <NamespaceContextBar namespace={ns} />
        <HealthStrip
          tiles={[
            {
              label: 'Teams',
              value: teams.items.length,
              hint: `${ready(teams.items)} ready`,
              href: '/hybridsovereign/tenant/teams',
            },
            {
              label: 'Projects',
              value: projects.items.length,
              hint: `${ready(projects.items)} ready`,
              href: '/hybridsovereign/tenant/projects',
            },
            {
              label: 'Platforms',
              value: platforms.items.length,
              hint: `${ready(platforms.items)} ready`,
              href: '/hybridsovereign/tenant/platforms',
            },
            {
              label: 'Assignments',
              value: assignments.items.length,
              hint: `${ready(assignments.items)} ready`,
              href: '/hybridsovereign/tenant/assignments',
            },
          ]}
        />
        <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
          Live entity topology
        </Title>
        <EntityTopology entityNamespace={ns} filterByPermissions={false} />
        <Title headingLevel="h2" size="lg" style={{ margin: '1.5rem 0 1rem' }}>
          Tenancy entry points
        </Title>
        <div className="sc-card-grid">
          {[
            { title: 'Teams', href: '/hybridsovereign/tenant/teams' },
            { title: 'Projects', href: '/hybridsovereign/tenant/projects' },
            { title: 'Platform Openshift', href: '/hybridsovereign/tenant/platforms' },
            { title: 'Assignments', href: '/hybridsovereign/tenant/assignments' },
          ].map((c) => (
            <a key={c.href} href={c.href} className="sc-card-link">
              <Card isFullHeight isSelectable>
                <CardTitle>{c.title}</CardTitle>
                <CardBody>Open {c.title.toLowerCase()} list</CardBody>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </PageSection>
  );
};

export default TenantOverviewPage;
