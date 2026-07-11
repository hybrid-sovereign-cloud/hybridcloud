import React from 'react';
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
import { SyncIcon } from '@patternfly/react-icons';
import {
  HybridSovereignKind,
  useK8sResourceList,
  K8sResource,
  OperatorStatus,
} from '@hybridsovereign/shared';

interface ResourceListPageProps {
  kind: HybridSovereignKind;
  title: string;
  subtitle?: string;
  secondaryKind?: HybridSovereignKind;
}

function statusLabel(status?: OperatorStatus): React.ReactNode {
  const value = status?.status ?? 'pending';
  const colors: Record<string, 'green' | 'orange' | 'red' | 'grey' | 'blue'> = {
    ready: 'green',
    reconciling: 'blue',
    failed: 'red',
    pending: 'orange',
  };
  return <Label color={colors[value] ?? 'grey'}>{value}</Label>;
}

function ResourceTable({
  kind,
  items,
  loading,
  error,
  onRefresh,
}: {
  kind: HybridSovereignKind;
  items: K8sResource[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
}): React.ReactElement {
  if (loading && items.length === 0) {
    return <Spinner aria-label={`Loading ${kind} resources`} />;
  }

  return (
    <>
      {error && (
        <Alert variant="warning" title="K8s proxy unavailable" isInline style={{ marginBottom: '1rem' }}>
          {error.message}. Showing scaffold UI — connect the K8s proxy to load live data.
        </Alert>
      )}
      <Table aria-label={`${kind} table`} variant="compact">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Namespace</Th>
            <Th>Status</Th>
            <Th>Last Reconciled</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.length === 0 ? (
            <Tr>
              <Td colSpan={4}>No {kind} resources found</Td>
            </Tr>
          ) : (
            items.map((item) => (
              <Tr key={`${item.metadata.namespace}/${item.metadata.name}`}>
                <Td>{item.metadata.name}</Td>
                <Td>{item.metadata.namespace ?? '—'}</Td>
                <Td>{statusLabel(item.status)}</Td>
                <Td>{item.status?.lastReconciledAt ?? '—'}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </>
  );
}

export function ResourceListPage({
  kind,
  title,
  subtitle,
  secondaryKind,
}: ResourceListPageProps): React.ReactElement {
  const primary = useK8sResourceList<K8sResource>(kind, { pollIntervalMs: 30000 });
  const secondary = useK8sResourceList<K8sResource>(
    secondaryKind ?? kind,
    { enabled: !!secondaryKind, pollIntervalMs: 30000 },
  );

  const refresh = () => {
    primary.refresh();
    if (secondaryKind) secondary.refresh();
  };

  const allItems = secondaryKind
    ? [...primary.items, ...secondary.items]
    : primary.items;
  const loading = primary.loading || (secondaryKind ? secondary.loading : false);
  const error = primary.error ?? secondary.error;

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
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      {subtitle && <p style={{ marginBottom: '1rem', opacity: 0.8 }}>{subtitle}</p>}
      <ResourceTable
        kind={kind}
        items={allItems}
        loading={loading}
        error={error}
        onRefresh={refresh}
      />
    </>
  );
}
