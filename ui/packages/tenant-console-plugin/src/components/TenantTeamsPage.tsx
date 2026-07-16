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
  configureK8sClient,
} from '@hybridsovereign/shared';
import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk';
import '@hybridsovereign/shared/styles/openshift.css';

configureK8sClient({
  baseUrl: '/api/kubernetes',
  fetchFn: consoleFetch as unknown as typeof fetch,
});

function useTenantNs(): string {
  return (
    (typeof window !== 'undefined' && sessionStorage.getItem('hybridsovereign-entity-ns')) ||
    'entity-acme-corp'
  );
}

export function makeTenantKindPage(kind: HybridSovereignKind, title: string): React.FC {
  const Page: React.FC = () => {
    const namespace = useTenantNs();
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
    const { items, loading, error, refresh } = useK8sResourceList<K8sResource>(kind, {
      namespace,
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
            subtitle={`${kind} in ${namespace}`}
            breadcrumbs={[
              { label: 'Sovereign Cloud' },
              { label: 'Tenancy' },
              { label: title },
            ]}
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
  Page.displayName = `Tenant${kind}Page`;
  return Page;
}

const TenantTeamsPage = makeTenantKindPage('Team', 'Teams');
export default TenantTeamsPage;
