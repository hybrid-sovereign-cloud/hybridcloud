import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '@patternfly/react-core';
import { HybridSovereignKind, ResourceDetail,
  useTranslation,
} from '@hybridsovereign/shared';

interface TenantResourceDetailPageProps {
  kind: HybridSovereignKind;
  title: string;
  listPath: string;
  namespace: string;
}

export function TenantResourceDetailPage({
  kind,
  title,
  listPath,
  namespace,
}: TenantResourceDetailPageProps): React.ReactElement {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const resourceName = name ? decodeURIComponent(name) : '';

  if (!namespace) {
    return (
      <Alert variant="info" title="Select an entity" isInline>
        Choose an entity namespace from the context bar to view this resource.
      </Alert>
    );
  }

  if (!resourceName) {
    return (
      <Alert variant="warning" title="Missing resource name" isInline>
        No resource name in the URL.
      </Alert>
    );
  }

  return (
    <ResourceDetail
      kind={kind}
      name={resourceName}
      namespace={namespace}
      parentTitle={title}
      parentPath={listPath}
      onBack={() => navigate(listPath)}
      onDeleted={() => navigate(listPath)}
    />
  );
}
