import * as React from 'react';
import { Title, PageSection } from '@patternfly/react-core';
import { EntityTopology, useEntityNamespace } from '@hybridsovereign/shared';

const TenantOverviewPage: React.FC = () => {
  const { namespace } = useEntityNamespace({
    userGroups: ['acme-corp-platform-engineering-admins'],
  });

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl">My Sovereign Cloud</Title>
      <EntityTopology entityNamespace={namespace} filterByPermissions />
    </PageSection>
  );
};

export default TenantOverviewPage;
