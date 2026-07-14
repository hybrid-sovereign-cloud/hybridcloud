import * as React from 'react';
import { Title, PageSection } from '@patternfly/react-core';
import { EntityTopology } from '@hybridsovereign/shared';

const AdminOverviewPage: React.FC = () => (
  <PageSection>
    <Title headingLevel="h1" size="2xl">Hybrid Sovereign Overview</Title>
    <EntityTopology filterByPermissions={false} />
  </PageSection>
);

export default AdminOverviewPage;
