import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  HybridSovereignKind,
  useK8sResourceList,
  K8sResource,
  PageHeader,
  StatusBadge,
  FilterToolbar,
  StatusFilter,
  normalizeHealth,
  KindIcon,
} from '@hybridsovereign/shared';

interface ResourceListPageProps {
  kind: HybridSovereignKind;
  title: string;
  subtitle?: string;
  secondaryKind?: HybridSovereignKind;
  /** Base path for primary kind detail links (e.g. /teams) */
  listPath: string;
  /** Base path for secondary kind detail links */
  secondaryListPath?: string;
  createPath?: string;
  /** When false, skip the API fetch (e.g. inactive service tab) */
  enabled?: boolean;
  /** Hide page header when embedded in a parent tab strip */
  hideHeader?: boolean;
}

function matchesFilter(item: K8sResource, search: string, statusFilter: StatusFilter): boolean {
  const name = item.metadata.name.toLowerCase();
  const ns = (item.metadata.namespace ?? '').toLowerCase();
  const q = search.trim().toLowerCase();
  if (q && !name.includes(q) && !ns.includes(q)) return false;
  if (statusFilter === 'all') return true;
  return normalizeHealth(item.status?.ready, item.status?.status) === statusFilter;
}

/** Build detail URL — Entity uses /entities/:name; other kinds use /path/:namespace/:name */
export function adminDetailHref(
  listPath: string,
  kind: HybridSovereignKind,
  item: K8sResource,
): string {
  const name = encodeURIComponent(item.metadata.name);
  if (kind === 'Entity') {
    return `${listPath}/${name}`;
  }
  const ns = encodeURIComponent(item.metadata.namespace ?? 'default');
  return `${listPath}/${ns}/${name}`;
}

function ResourceTable({
  kind,
  items,
  loading,
  error,
  listPath,
}: {
  kind: HybridSovereignKind;
  items: K8sResource[];
  loading: boolean;
  error: Error | null;
  listPath: string;
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
      <div className="sc-table-wrap">
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
                <Td colSpan={4}>No {kind} resources match the current filters</Td>
              </Tr>
            ) : (
              items.map((item) => (
                <Tr key={`${item.metadata.namespace}/${item.metadata.name}`}>
                  <Td dataLabel="Name">
                    <Link
                      className="sc-resource-link"
                      to={adminDetailHref(listPath, kind, item)}
                    >
                      <KindIcon kind={kind} size="sm" />
                      {item.metadata.name}
                    </Link>
                  </Td>
                  <Td dataLabel="Namespace">{item.metadata.namespace ?? '—'}</Td>
                  <Td dataLabel="Status">
                    <StatusBadge
                      status={item.status?.status}
                      ready={item.status?.ready}
                      message={item.status?.message}
                      lastTransition={item.status?.lastReconciledAt}
                    />
                  </Td>
                  <Td dataLabel="Last Reconciled">{item.status?.lastReconciledAt ?? '—'}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>
    </>
  );
}

export function ResourceListPage({
  kind,
  title,
  subtitle,
  secondaryKind,
  listPath,
  secondaryListPath,
  createPath,
  enabled = true,
  hideHeader = false,
}: ResourceListPageProps): React.ReactElement {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const primary = useK8sResourceList<K8sResource>(kind, { enabled });
  const secondary = useK8sResourceList<K8sResource>(secondaryKind ?? kind, {
    enabled: enabled && !!secondaryKind,
  });

  const primaryFiltered = useMemo(
    () => primary.items.filter((i) => matchesFilter(i, search, statusFilter)),
    [primary.items, search, statusFilter],
  );
  const secondaryFiltered = useMemo(
    () => (secondaryKind ? secondary.items.filter((i) => matchesFilter(i, search, statusFilter)) : []),
    [secondary.items, secondaryKind, search, statusFilter],
  );

  const refresh = () => {
    primary.refresh();
    if (secondaryKind) secondary.refresh();
  };

  const secondaryPath = secondaryListPath ?? listPath;

  return (
    <>
      {!hideHeader && (
        <PageHeader
          title={title}
          subtitle={subtitle ?? `${kind} resources across the platform`}
          breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: title }]}
          actions={
            createPath ? (
              <Button variant="primary" icon={<PlusCircleIcon />} onClick={() => navigate(createPath)}>
                Create
              </Button>
            ) : undefined
          }
        />
      )}
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={refresh}
      />
      <ResourceTable
        kind={kind}
        items={primaryFiltered}
        loading={primary.loading}
        error={primary.error}
        listPath={listPath}
      />
      {secondaryKind && (
        <div style={{ marginTop: '1rem' }}>
          <PageHeader title={secondaryKind} subtitle={`Secondary kind list`} />
          <ResourceTable
            kind={secondaryKind}
            items={secondaryFiltered}
            loading={secondary.loading}
            error={secondary.error}
            listPath={secondaryPath}
          />
        </div>
      )}
    </>
  );
}
