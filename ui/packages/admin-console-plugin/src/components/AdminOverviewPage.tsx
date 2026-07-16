import * as React from 'react';
import { PageSection, Title, Card, CardTitle, CardBody } from '@patternfly/react-core';
import { EntityTopology, PageHeader, HealthStrip } from '@hybridsovereign/shared';
import '@hybridsovereign/shared/styles/openshift.css';

const AdminOverviewPage: React.FC = () => (
  <PageSection className="sc-console-page">
    <div className="sc-page">
      <PageHeader
        title="Sovereign Cloud Overview"
        subtitle="Platform health and live CR topology — OpenShift Console native"
        breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Overview' }]}
      />
      <HealthStrip
        tiles={[
          { label: 'Perspective', value: 'Sovereign', hint: 'Top-level like ACM Fleet' },
          { label: 'Scope', value: 'Cluster', hint: 'Services cluster CRs' },
          { label: 'API', value: 'v1alpha1', hint: 'hybridsovereign.redhat' },
        ]}
      />
      <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
        Platform entry points
      </Title>
      <div className="sc-card-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { title: 'Entities', href: '/hybridsovereign/entities', body: 'Tenant onboarding' },
          { title: 'Personas', href: '/hybridsovereign/personas', body: 'Cross-entity personas' },
          { title: 'Service URLs', href: '/hybridsovereign/services', body: 'Route health' },
          { title: 'Operators', href: '/hybridsovereign/operators', body: 'CSV / RBAC health' },
        ].map((c) => (
          <a key={c.href} href={c.href} className="sc-card-link">
            <Card isFullHeight isSelectable>
              <CardTitle>{c.title}</CardTitle>
              <CardBody>{c.body}</CardBody>
            </Card>
          </a>
        ))}
      </div>
      <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
        Live platform topology
      </Title>
      <EntityTopology filterByPermissions={false} />
    </div>
  </PageSection>
);

export default AdminOverviewPage;
