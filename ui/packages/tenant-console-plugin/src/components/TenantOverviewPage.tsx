import * as React from 'react';
import { PageSection, Title, Card, CardBody } from '@patternfly/react-core';
import {
  EntityTopology,
  PageHeader,
  NamespaceContextBar,
  InventoryCard,
  useK8sResourceList,
  useEntityNamespace,
  K8sResource,
  configureK8sClient,
} from '@hybridsovereign/shared';
import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk';
import '@hybridsovereign/shared/styles/openshift.css';

configureK8sClient({
  baseUrl: '/api/kubernetes',
  fetchFn: consoleFetch as unknown as typeof fetch,
  apiStyle: 'raw',
});

const TenantOverviewPage: React.FC = () => {
  const { namespace, entities, selectEntity, entity } = useEntityNamespace();

  const teams = useK8sResourceList<K8sResource>('Team', { namespace });
  const projects = useK8sResourceList<K8sResource>('Project', { namespace });
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', { namespace });
  const assignments = useK8sResourceList<K8sResource>('Assignment', { namespace });
  const ready = (items: K8sResource[]) => items.filter((i) => i.status?.ready).length;

  return (
    <PageSection className="sc-console-page">
      <div className="sc-page">
        <NamespaceContextBar
          namespace={namespace}
          entityName={entity?.metadata.name}
          billingId={(entity?.spec as { billingID?: string } | undefined)?.billingID}
          entities={entities}
          onSelectEntity={selectEntity}
        />
        <PageHeader
          title="Entity Overview"
          subtitle="Tenant-scoped health and live topology"
          breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Tenancy' }, { label: 'Overview' }]}
        />
        <div className="sc-inventory-grid sc-mb">
          <InventoryCard
            title="Teams"
            count={teams.items.length}
            hint={`${ready(teams.items)} ready`}
            kind="Team"
            href="/hybridsovereign/tenant/teams"
          />
          <InventoryCard
            title="Projects"
            count={projects.items.length}
            hint={`${ready(projects.items)} ready`}
            kind="Project"
            href="/hybridsovereign/tenant/projects"
          />
          <InventoryCard
            title="Platforms"
            count={platforms.items.length}
            hint={`${ready(platforms.items)} ready`}
            kind="PlatformOpenshift"
            href="/hybridsovereign/tenant/platforms"
          />
          <InventoryCard
            title="Assignments"
            count={assignments.items.length}
            hint={`${ready(assignments.items)} ready`}
            kind="Assignment"
            href="/hybridsovereign/tenant/assignments"
          />
        </div>
        <Title headingLevel="h2" size="lg" className="sc-section-title">
          Live entity topology
        </Title>
        <Card isCompact className="sc-panel">
          <CardBody>
            <EntityTopology entityNamespace={namespace} />
          </CardBody>
        </Card>
      </div>
    </PageSection>
  );
};

export default TenantOverviewPage;
