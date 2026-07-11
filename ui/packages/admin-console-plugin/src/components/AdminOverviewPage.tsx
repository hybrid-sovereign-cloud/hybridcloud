import * as React from 'react';
import { Title, PageSection, EmptyState, EmptyStateBody } from '@patternfly/react-core';

const AdminOverviewPage: React.FC = () => (
  <PageSection>
    <Title headingLevel="h1" size="2xl">Hybrid Sovereign Overview</Title>
    <EmptyState>
      <EmptyStateBody>
        Platform operator console plugin scaffold. Connect to the services cluster API
        to list entities, teams, and platform resources.
      </EmptyStateBody>
    </EmptyState>
  </PageSection>
);

export default AdminOverviewPage;
