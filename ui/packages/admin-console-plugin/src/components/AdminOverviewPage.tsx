import * as React from 'react';
import { PageSection, Title, Card, CardTitle, CardBody } from '@patternfly/react-core';
import {
  EntityTopology,
  PageHeader,
  HealthStrip,
  KindIcon,
  HybridSovereignKind,
  useTranslation,
} from '@hybridsovereign/shared';
import '@hybridsovereign/shared/styles/openshift.css';

const ENTRIES: {
  title: string;
  href: string;
  body: string;
  kind: HybridSovereignKind;
}[] = [
  {
    title: 'Entities',
    href: '/hybridsovereign/entities',
    body: 'Tenant onboarding',
    kind: 'Entity',
  },
  { title: 'Personas', href: '/hybridsovereign/personas', body: 'Cross-entity personas', kind: 'Persona' },
  { title: 'Service URLs', href: '/hybridsovereign/services', body: 'Route health', kind: 'AAPConfig' },
  { title: 'Operators', href: '/hybridsovereign/operators', body: 'CSV / RBAC health', kind: 'RbacConfig' },
];

const AdminOverviewPage: React.FC = () => (
  <PageSection className="sc-console-page">
    <div className="sc-page">
      <PageHeader
        title="Sovereign Cloud Overview"
        subtitle="Platform health and CR topology — OpenShift Console native"
        breadcrumbs={[{ label: t('nav.sovereignCloud') }, { label: t('pages.overviewTitle') }]}
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
        {ENTRIES.map((c) => (
          <a key={c.href} href={c.href} className="sc-card-link">
            <Card isFullHeight isSelectable className="sc-entry-card">
              <CardTitle>
                <KindIcon kind={c.kind} size="md" />
                {c.title}
              </CardTitle>
              <CardBody>
                <div className="sc-entry-card__body">{c.body}</div>
              </CardBody>
            </Card>
          </a>
        ))}
      </div>
      <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
        Platform topology
      </Title>
      <EntityTopology />
    </div>
  </PageSection>
);

export default AdminOverviewPage;
