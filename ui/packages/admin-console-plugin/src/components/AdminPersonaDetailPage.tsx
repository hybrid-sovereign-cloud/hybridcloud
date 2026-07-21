import * as React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';
import { HybridSovereignKind, ResourceDetail,
  useTranslation,
} from '@hybridsovereign/shared';
import '@hybridsovereign/shared/styles/openshift.css';

function makeNamespacedDetailPage(
  kind: HybridSovereignKind,
  title: string,
  listPath: string,
): React.FC {
  const Page: React.FC = () => {
    const history = useHistory();
    const { namespace, name } = useParams<{ namespace: string; name: string }>();
    const resourceName = name ? decodeURIComponent(name) : '';
    const ns = namespace ? decodeURIComponent(namespace) : '';

    return (
      <PageSection className="sc-console-page">
        <div className="sc-page">
          <ResourceDetail
            kind={kind}
            name={resourceName}
            namespace={ns}
            parentTitle={title}
            parentPath={listPath}
            onBack={() => history.push(listPath)}
            onDeleted={() => history.push(listPath)}
          />
        </div>
      </PageSection>
    );
  };
  Page.displayName = `Admin${kind}DetailPage`;
  return Page;
}

export const AdminPersonaDetailPage = makeNamespacedDetailPage(
  'Persona',
  'Personas',
  '/hybridsovereign/personas',
);
export const AdminServiceDetailPage = makeNamespacedDetailPage(
  'AAPConfig',
  'Service URLs',
  '/hybridsovereign/services',
);
export const AdminOperatorDetailPage = makeNamespacedDetailPage(
  'RbacConfig',
  'Operators',
  '/hybridsovereign/operators',
);

export default AdminPersonaDetailPage;
