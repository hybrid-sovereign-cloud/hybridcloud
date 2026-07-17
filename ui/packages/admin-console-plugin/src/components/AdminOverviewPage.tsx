import * as React from 'react';
import { PageSection, Title, Card, CardTitle, CardBody } from '@patternfly/react-core';
import { useAccessReview } from '@openshift-console/dynamic-plugin-sdk';
import {
  API_GROUP,
  EntityTopology,
  PageHeader,
  HealthStrip,
  KindIcon,
  KIND_PLURALS,
  HybridSovereignKind,
} from '@hybridsovereign/shared';
import '@hybridsovereign/shared/styles/openshift.css';

const ENTRIES: {
  title: string;
  href: string;
  body: string;
  kind: HybridSovereignKind;
  namespace?: string;
}[] = [
  {
    title: 'Entities',
    href: '/hybridsovereign/entities',
    body: 'Tenant onboarding',
    kind: 'Entity',
    namespace: 'sovereign-cloud',
  },
  { title: 'Personas', href: '/hybridsovereign/personas', body: 'Cross-entity personas', kind: 'Persona' },
  { title: 'Service URLs', href: '/hybridsovereign/services', body: 'Route health', kind: 'AAPConfig' },
  { title: 'Operators', href: '/hybridsovereign/operators', body: 'CSV / RBAC health', kind: 'RbacConfig' },
];

function EntryCard({
  title,
  href,
  body,
  kind,
  namespace,
}: (typeof ENTRIES)[number]): React.ReactElement | null {
  const [allowed] = useAccessReview({
    group: API_GROUP,
    resource: KIND_PLURALS[kind],
    verb: 'list',
    ...(namespace ? { namespace } : {}),
  });
  if (!allowed) return null;
  return (
    <a href={href} className="sc-card-link">
      <Card isFullHeight isSelectable className="sc-entry-card">
        <CardTitle>
          <KindIcon kind={kind} size="md" />
          {title}
        </CardTitle>
        <CardBody>
          <div className="sc-entry-card__body">{body}</div>
        </CardBody>
      </Card>
    </a>
  );
}

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
        {ENTRIES.map((c) => (
          <EntryCard key={c.href} {...c} />
        ))}
      </div>
      <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
        Live platform topology
      </Title>
      <EntityTopology filterByPermissions />
    </div>
  </PageSection>
);

export default AdminOverviewPage;
