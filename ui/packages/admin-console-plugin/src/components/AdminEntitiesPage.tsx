import * as React from 'react';
import { PageSection, Spinner, Alert } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  K8sResourceCommon,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  PageHeader,
  StatusBadge,
  FilterToolbar,
  StatusFilter,
  normalizeHealth,
  OperatorStatus,
  HybridSovereignKind,
  KIND_PLURALS,
  API_GROUP,
  API_VERSION,
} from '@hybridsovereign/shared';
import '@hybridsovereign/shared/styles/openshift.css';

type SovereignResource = K8sResourceCommon & {
  status?: OperatorStatus;
};

const ENTITY_NS = 'sovereign-cloud';

const AdminEntitiesPage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [items, loaded, loadError] = useK8sWatchResource<SovereignResource[]>({
    groupVersionKind: {
      group: API_GROUP,
      version: API_VERSION,
      kind: 'Entity',
    },
    isList: true,
    namespace: ENTITY_NS,
  });

  const list = React.useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((item) => {
      if (q && !item.metadata?.name?.toLowerCase().includes(q)) return false;
      if (statusFilter === 'all') return true;
      return normalizeHealth(item.status?.ready, item.status?.status) === statusFilter;
    });
  }, [list, search, statusFilter]);

  const errorMessage =
    loadError instanceof Error
      ? loadError.message
      : loadError
        ? String(loadError)
        : null;

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
        />
        {errorMessage && (
          <Alert variant="warning" isInline title="Unable to list Entities">
            {errorMessage}
          </Alert>
        )}
        {!loaded && list.length === 0 ? (
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
                  <Tr key={item.metadata?.uid ?? item.metadata?.name}>
                    <Td>{item.metadata?.name}</Td>
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

/** Reusable list page for other admin kinds (cluster-wide or all-namespaces list) */
export const makeKindListPage = (kind: HybridSovereignKind, title: string): React.FC => {
  const Page: React.FC = () => {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
    const [items, loaded, loadError] = useK8sWatchResource<SovereignResource[]>({
      groupVersionKind: {
        group: API_GROUP,
        version: API_VERSION,
        kind,
      },
      isList: true,
      ...(kind === 'Entity' ? { namespace: ENTITY_NS } : {}),
    });

    const list = React.useMemo(() => (Array.isArray(items) ? items : []), [items]);
    const filtered = React.useMemo(() => {
      const q = search.trim().toLowerCase();
      return list.filter((item) => {
        if (q && !item.metadata?.name?.toLowerCase().includes(q)) return false;
        if (statusFilter === 'all') return true;
        return normalizeHealth(item.status?.ready, item.status?.status) === statusFilter;
      });
    }, [list, search, statusFilter]);

    const errorMessage =
      loadError instanceof Error
        ? loadError.message
        : loadError
          ? String(loadError)
          : null;

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
          />
          {errorMessage && (
            <Alert variant="warning" isInline title={`Unable to list ${KIND_PLURALS[kind] ?? kind}`}>
              {errorMessage}
            </Alert>
          )}
          {!loaded && list.length === 0 ? (
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
                    <Tr key={item.metadata?.uid ?? `${item.metadata?.namespace}/${item.metadata?.name}`}>
                      <Td>{item.metadata?.name}</Td>
                      <Td>{item.metadata?.namespace ?? '—'}</Td>
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
