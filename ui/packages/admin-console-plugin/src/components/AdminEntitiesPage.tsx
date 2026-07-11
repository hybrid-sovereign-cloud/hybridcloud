import * as React from 'react';
import { Title, PageSection } from '@patternfly/react-core';
import { useK8sResourceList, type Entity } from '@hybridsovereign/shared';

const AdminEntitiesPage: React.FC = () => {
  const { items, loading, error } = useK8sResourceList<Entity>('Entity');

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl">Entities</Title>
      {error && <p>API unavailable: {error.message}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {items.map((e) => (
            <li key={e.metadata.name}>{e.metadata.name}</li>
          ))}
          {items.length === 0 && <li>No entities</li>}
        </ul>
      )}
    </PageSection>
  );
};

export default AdminEntitiesPage;
