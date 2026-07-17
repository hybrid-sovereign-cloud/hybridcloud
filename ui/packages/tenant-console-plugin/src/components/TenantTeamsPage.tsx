import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { PageSection, Spinner, Alert, Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  PageHeader,
  StatusBadge,
  FilterToolbar,
  StatusFilter,
  normalizeHealth,
  useK8sResourceList,
  useEntityNamespace,
  NamespaceContextBar,
  K8sResource,
  HybridSovereignKind,
  KindIcon,
  configureK8sClient,
  SelfServiceFormType,
} from '@hybridsovereign/shared';
import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk';
import '@hybridsovereign/shared/styles/openshift.css';

configureK8sClient({
  baseUrl: '/api/kubernetes',
  fetchFn: consoleFetch as unknown as typeof fetch,
  apiStyle: 'raw',
});

const KIND_META: Partial<
  Record<HybridSovereignKind, { path: string; form?: SelfServiceFormType }>
> = {
  Team: { path: 'teams', form: 'team' },
  Project: { path: 'projects', form: 'project' },
  PlatformOpenshift: { path: 'platforms' },
  CloudOSO: { path: 'cloudoso', form: 'cloudoso' },
  CloudAWS: { path: 'cloudaws', form: 'cloudaws' },
  OpenStackMigration: { path: 'migrations', form: 'migration' },
  Assignment: { path: 'assignments', form: 'assignment' },
  Vault: { path: 'vaults', form: 'vault' },
  VaultKV: { path: 'vaultkvs', form: 'vaultkv' },
  AAPOrg: { path: 'aaporgs', form: 'aaporg' },
  QuayOrg: { path: 'quayorgs', form: 'quayorg' },
  Persona: { path: 'personas', form: 'persona' },
  Rbac: { path: 'rbac', form: 'rbac' },
};

export function makeTenantKindPage(kind: HybridSovereignKind, title: string): React.FC {
  const meta = KIND_META[kind] ?? { path: kind.toLowerCase() };
  const listPath = `/hybridsovereign/tenant/${meta.path}`;

  const Page: React.FC = () => {
    const history = useHistory();
    const { namespace, entities, selectEntity, entity } = useEntityNamespace();
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
    const { items, loading, error, refresh } = useK8sResourceList<K8sResource>(kind, {
      namespace,
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
          <NamespaceContextBar
            namespace={namespace}
            entityName={entity?.metadata.name}
            entities={entities}
            onSelectEntity={selectEntity}
          />
          <PageHeader
            title={title}
            subtitle={`${kind} in ${namespace || '—'}`}
            breadcrumbs={[
              { label: 'Sovereign Cloud' },
              { label: 'Tenancy' },
              { label: title },
            ]}
            actions={
              meta.form && namespace ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusCircleIcon />}
                  onClick={() => history.push(`/hybridsovereign/tenant/create/${meta.form}`)}
                >
                  Create
                </Button>
              ) : undefined
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
                      <Td>
                        <a
                          className="sc-resource-link"
                          href={`${listPath}/${encodeURIComponent(item.metadata.name)}`}
                        >
                          <KindIcon kind={kind} size="sm" />
                          {item.metadata.name}
                        </a>
                      </Td>
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
