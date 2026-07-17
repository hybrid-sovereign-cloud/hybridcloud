import * as React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Alert, PageSection } from '@patternfly/react-core';
import { CreateResourceForm, SelfServiceFormType } from '@hybridsovereign/shared';
import '@hybridsovereign/shared/styles/openshift.css';

const LIST_PATH: Record<string, string> = {
  entity: '/hybridsovereign/entities',
  persona: '/hybridsovereign/personas',
};

const AdminCreatePage: React.FC = () => {
  const history = useHistory();
  const { kind } = useParams<{ kind: string }>();
  const formType = (kind ?? 'entity') as SelfServiceFormType;
  const listPath = LIST_PATH[formType] ?? '/hybridsovereign/overview';

  if (formType !== 'entity' && formType !== 'persona') {
    return (
      <PageSection className="sc-console-page">
        <Alert variant="warning" title="Unsupported create form" isInline>
          Unknown kind: {kind}
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection className="sc-console-page">
      <div className="sc-page">
        <CreateResourceForm
          formType={formType}
          namespace={formType === 'entity' ? 'sovereign-cloud' : ''}
          listPath={listPath}
          onSuccess={(path) => history.push(path)}
          onCancel={() => history.push(listPath)}
        />
      </div>
    </PageSection>
  );
};

export default AdminCreatePage;
