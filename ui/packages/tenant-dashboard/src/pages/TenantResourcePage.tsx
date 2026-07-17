import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button } from '@patternfly/react-core';
import { PlusCircleIcon, SyncIcon } from '@patternfly/react-icons';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  HybridSovereignKind,
  useK8sResourceList,
  useCanI,
  K8sResource,
  KIND_PLURALS,
  PageHeader,
  StatusBadge,
  FilterToolbar,
  StatusFilter,
  normalizeHealth,
} from '@hybridsovereign/shared';

type FormType =
  | 'team'
  | 'project'
  | 'assignment'
  | 'cloudoso'
  | 'cloudaws'
  | 'migration'
  | 'persona'
  | 'rbac'
  | 'vault'
  | 'vaultkv'
  | 'aaporg'
  | 'quayorg';

interface TenantResourcePageProps {
  kind: HybridSovereignKind;
  title: string;
  namespace: string;
  listPath: string;
  formType?: FormType;
}

export function TenantResourcePage({
  kind,
  title,
  namespace,
  listPath,
  formType,
}: TenantResourcePageProps): React.ReactElement {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const plural = KIND_PLURALS[kind];
  const { allowed: canCreate } = useCanI(namespace, plural, 'create');
  const { items, loading, error, refresh } = useK8sResourceList<K8sResource>(kind, {
    namespace,
    pollIntervalMs: 30000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.metadata.name.toLowerCase().includes(q)) return false;
      if (statusFilter === 'all') return true;
      return normalizeHealth(item.status?.ready, item.status?.status) === statusFilter;
    });
  }, [items, search, statusFilter]);

  return (
    <>
      <PageHeader
        title={title}
        subtitle={`Namespaced ${kind} resources in ${namespace}`}
        breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Tenancy' }, { label: title }]}
        actions={
          <>
            <Button variant="secondary" icon={<SyncIcon />} onClick={refresh}>
              Refresh
            </Button>
            {formType && canCreate && (
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() => navigate(`/create/${formType}`)}
              >
                Create
              </Button>
            )}
          </>
        }
      />
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={refresh}
      />
      {error && (
        <Alert variant="warning" title="K8s proxy unavailable" isInline style={{ marginBottom: '1rem' }}>
          {error.message}
        </Alert>
      )}
      {loading && items.length === 0 ? (
        <Spinner aria-label={`Loading ${kind}`} />
      ) : (
        <div className="sc-table-wrap">
          <Table aria-label={`${kind} table`} variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Last Reconciled</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.length === 0 ? (
                <Tr>
                  <Td colSpan={3}>No {kind} resources match the current filters</Td>
                </Tr>
              ) : (
                filtered.map((item) => (
                  <Tr key={item.metadata.name}>
                    <Td>
                      <Link
                        className="sc-resource-link"
                        to={`${listPath}/${encodeURIComponent(item.metadata.name)}`}
                      >
                        {item.metadata.name}
                      </Link>
                    </Td>
                    <Td>
                      <StatusBadge
                        status={item.status?.status}
                        ready={item.status?.ready}
                        message={item.status?.message}
                        lastTransition={item.status?.lastReconciledAt}
                      />
                    </Td>
                    <Td>{item.status?.lastReconciledAt ?? '—'}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </div>
      )}
    </>
  );
}
