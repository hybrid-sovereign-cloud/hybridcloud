import * as React from 'react';
import { Title, PageSection, EmptyState, EmptyStateBody } from '@patternfly/react-core';

const TenantOverviewPage: React.FC = () => (
  <PageSection>
    <Title headingLevel="h1" size="2xl">My Sovereign Cloud</Title>
    <EmptyState>
      <EmptyStateBody>
        Tenant-scoped console plugin scaffold. Resources are filtered to your entity namespace.
      </EmptyStateBody>
    </EmptyState>
  </PageSection>
);

export default TenantOverviewPage;
