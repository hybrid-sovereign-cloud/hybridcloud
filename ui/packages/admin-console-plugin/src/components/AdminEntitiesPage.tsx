import * as React from 'react';
import { PageSection, Spinner, Alert } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  PageHeader,
  StatusBadge,
  FilterToolbar,
  StatusFilter,
  normalizeHealth,
  useK8sResourceList,
  K8sResource,
  HybridSovereignKind,
} from '@hybridsovereign/shared';
import '@hybridsovereign/shared/styles/openshift.css';

const AdminEntitiesPage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const { items, loading, error, refresh } = useK8sResourceList<K8sResource>('Entity', {
    pollIntervalMs: 30000,
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.metadata.name.toLowerCase().includes(q)) return false;
      if (statusFilter === 'all') return true;
      return normalizeHealth(item.status?.ready, item.status?.status) === statusFilter;
    });
  }, [items, search, statusFilter]);

  return (
    <PageSection className="sc-console-page">
      <div className="sc-page">
        <PageHeader
          title="Entities"
          subtitle="Top-level tenants — create and monitor entity namespaces"
          breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Entities' }]}
        />
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onRefresh={refresh}
        />
        {error && (
          <Alert variant="warning" isInline title="Unable to list Entities">
            {error.message}
          </Alert>
        )}
        {loading && items.length === 0 ? (
          <Spinner />
        ) : (
          <div className="sc-table-wrap">
            <Table variant="compact" aria-label="Entities">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Last Reconciled</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((item) => (
                  <Tr key={item.metadata.name}>
                    <Td>{item.metadata.name}</Td>
                    <Td>
                      <StatusBadge status={item.status?.status} ready={item.status?.ready} />
                    </Td>
                    <Td>{item.status?.lastReconciledAt ?? '—'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </div>
    </PageSection>
  );
};

export default AdminEntitiesPage;

/** Reusable list page for other admin kinds */
export const makeKindListPage = (kind: HybridSovereignKind, title: string): React.FC => {
  const Page: React.FC = () => {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
    const { items, loading, error, refresh } = useK8sResourceList<K8sResource>(kind, {
      pollIntervalMs: 30000,
    });
    const filtered = React.useMemo(() => {
      const q = search.trim().toLowerCase();
      return items.filter((item) => {
        if (q && !item.metadata.name.toLowerCase().includes(q)) return false;
        if (statusFilter === 'all') return true;
        return normalizeHealth(item.status?.ready, item.status?.status) === statusFilter;
      });
    }, [items, search, statusFilter]);

    return (
      <PageSection className="sc-console-page">
        <div className="sc-page">
          <PageHeader
            title={title}
            breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: title }]}
          />
          <FilterToolbar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onRefresh={refresh}
          />
          {error && (
            <Alert variant="warning" isInline title={`Unable to list ${kind}`}>
              {error.message}
            </Alert>
          )}
          {loading && items.length === 0 ? (
            <Spinner />
          ) : (
            <div className="sc-table-wrap">
              <Table variant="compact" aria-label={title}>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Namespace</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.map((item) => (
                    <Tr key={`${item.metadata.namespace}/${item.metadata.name}`}>
                      <Td>{item.metadata.name}</Td>
                      <Td>{item.metadata.namespace ?? '—'}</Td>
                      <Td>
                        <StatusBadge status={item.status?.status} ready={item.status?.ready} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )}
        </div>
      </PageSection>
    );
  };
  Page.displayName = `Admin${kind}Page`;
  return Page;
};
