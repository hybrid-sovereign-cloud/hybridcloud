import * as React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';
import { ResourceDetail } from '@hybridsovereign/shared';
import '@hybridsovereign/shared/styles/openshift.css';

const ENTITY_NS = 'sovereign-cloud';

const AdminEntityDetailPage: React.FC = () => {
  const history = useHistory();
  const { name } = useParams<{ name: string }>();
  const resourceName = name ? decodeURIComponent(name) : '';
  const listPath = '/hybridsovereign/entities';

  return (
    <PageSection className="sc-console-page">
      <div className="sc-page">
        <ResourceDetail
          kind="Entity"
          name={resourceName}
          namespace={ENTITY_NS}
          parentTitle="Entities"
          parentPath={listPath}
          onBack={() => history.push(listPath)}
          onDeleted={() => history.push(listPath)}
        />
      </div>
    </PageSection>
  );
};

export default AdminEntityDetailPage;
