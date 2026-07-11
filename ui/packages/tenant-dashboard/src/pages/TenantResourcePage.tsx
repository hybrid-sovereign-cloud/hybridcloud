import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Title,
  Spinner,
  Alert,
  Label,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { PlusCircleIcon, SyncIcon } from '@patternfly/react-icons';
import {
  HybridSovereignKind,
  useK8sResourceList,
  useCanI,
  K8sResource,
  KIND_PLURALS,
} from '@hybridsovereign/shared';

type FormType = 'team' | 'project' | 'assignment' | 'cloudoso' | 'cloudaws';

interface TenantResourcePageProps {
  kind: HybridSovereignKind;
  title: string;
  namespace: string;
  formType?: FormType;
}

export function TenantResourcePage({
  kind,
  title,
  namespace,
  formType,
}: TenantResourcePageProps): React.ReactElement {
  const navigate = useNavigate();
  const plural = KIND_PLURALS[kind].replace(/s$/, '') + 's';
  const { allowed: canCreate } = useCanI(namespace, plural, 'create');
  const { items, loading, error, refresh } = useK8sResourceList<K8sResource>(kind, {
    namespace,
    pollIntervalMs: 30000,
  });

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <Title headingLevel="h2" size="xl">{title}</Title>
          </ToolbarItem>
          <ToolbarItem align={{ default: 'alignEnd' }}>
            <Button variant="secondary" icon={<SyncIcon />} onClick={refresh}>
              Refresh
            </Button>
            {formType && canCreate && (
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() => navigate(`/create/${formType}`)}
                style={{ marginLeft: '0.5rem' }}
              >
                Create
              </Button>
            )}
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      {error && (
        <Alert variant="warning" title="K8s proxy unavailable" isInline style={{ marginBottom: '1rem' }}>
          {error.message}
        </Alert>
      )}
      {loading && items.length === 0 ? (
        <Spinner aria-label={`Loading ${kind}`} />
      ) : (
        <Table aria-label={`${kind} table`} variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Last Reconciled</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.length === 0 ? (
              <Tr>
                <Td colSpan={3}>No resources in {namespace}</Td>
              </Tr>
            ) : (
              items.map((item) => (
                <Tr key={item.metadata.name}>
                  <Td>{item.metadata.name}</Td>
                  <Td>
                    <Label color={item.status?.status === 'ready' ? 'green' : 'orange'}>
                      {item.status?.status ?? 'pending'}
                    </Label>
                  </Td>
                  <Td>{item.status?.lastReconciledAt ?? '—'}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      )}
    </>
  );
}
