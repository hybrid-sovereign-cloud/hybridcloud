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
  OperatorStatus,
  HybridSovereignKind,
  KIND_PLURALS,
  KindIcon,
  useK8sResourceList,
  K8sResource,
  configureK8sClient,
  useTranslation,
} from '@hybridsovereign/shared';
import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk';
import '@hybridsovereign/shared/styles/openshift.css';

configureK8sClient({
  baseUrl: '/api/kubernetes',
  fetchFn: consoleFetch as unknown as typeof fetch,
  apiStyle: 'raw',
});

type SovereignResource = K8sResource & {
  status?: OperatorStatus;
};

const ENTITY_NS = 'sovereign-cloud';

const AdminEntitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const { items, loading, error, refresh } = useK8sResourceList<SovereignResource>('Entity', {
    namespace: ENTITY_NS,
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.metadata?.name?.toLowerCase().includes(q)) return false;
      if (statusFilter === 'all') return true;
      return normalizeHealth(item.status?.ready, item.status?.status) === statusFilter;
    });
  }, [items, search, statusFilter]);

  return (
    <PageSection className="sc-console-page">
      <div className="sc-page">
        <PageHeader
          title={t('nav.entities')}
          subtitle={t('pages.entitiesSubtitle')}
          breadcrumbs={[{ label: t('nav.sovereignCloud') }, { label: t('nav.entities') }]}
          actions={
            <Button
              variant="primary"
              icon={<PlusCircleIcon />}
              onClick={() => history.push('/hybridsovereign/create/entity')}
            >
              {t('common.create')}
            </Button>
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
          <Alert variant="warning" isInline title={t('common.unableToList', { kind: t('nav.entities') })}>
            {error.message}
          </Alert>
        )}
        {loading && items.length === 0 ? (
          <Spinner />
        ) : (
          <div className="sc-table-wrap">
            <Table variant="compact" aria-label={t('nav.entities')}>
              <Thead>
                <Tr>
                  <Th>{t('common.name')}</Th>
                  <Th>{t('common.status')}</Th>
                  <Th>{t('common.lastReconciled')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.length === 0 ? (
                  <Tr>
                    <Td colSpan={3}>{t('pages.noMatch', { kind: 'Entity' })}</Td>
                  </Tr>
                ) : (
                  filtered.map((item) => (
                    <Tr key={item.metadata?.uid ?? item.metadata?.name}>
                      <Td>
                        <a
                          className="sc-resource-link"
                          href={`/hybridsovereign/entities/${encodeURIComponent(item.metadata?.name ?? '')}`}
                        >
                          <KindIcon kind="Entity" size="sm" />
                          {item.metadata?.name}
                        </a>
                      </Td>
                      <Td>
                        <StatusBadge status={item.status?.status} ready={item.status?.ready} />
                      </Td>
                      <Td>{item.status?.lastReconciledAt ?? '—'}</Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </div>
        )}
      </div>
    </PageSection>
  );
};

export default AdminEntitiesPage;

/** Reusable list page for other admin kinds — one-shot fetch, manual refresh only */
export const makeKindListPage = (
  kind: HybridSovereignKind,
  title: string,
  opts?: { createKind?: string; listPath?: string },
): React.FC => {
  const listPath = opts?.listPath ?? `/hybridsovereign/${KIND_PLURALS[kind] ?? kind.toLowerCase()}`;
  const Page: React.FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
    const { items, loading, error, refresh } = useK8sResourceList<SovereignResource>(kind, {
      ...(kind === 'Entity' ? { namespace: ENTITY_NS } : {}),
    });
    const kindTitle = t(`kinds.${kind}`, { defaultValue: title });

    const filtered = React.useMemo(() => {
      const q = search.trim().toLowerCase();
      return items.filter((item) => {
        if (q && !item.metadata?.name?.toLowerCase().includes(q)) return false;
        if (statusFilter === 'all') return true;
        return normalizeHealth(item.status?.ready, item.status?.status) === statusFilter;
      });
    }, [items, search, statusFilter]);

    const detailHref = (item: SovereignResource) => {
      const n = item.metadata?.name ?? '';
      const ns = item.metadata?.namespace ?? '';
      if (kind === 'Entity') {
        return `/hybridsovereign/entities/${encodeURIComponent(n)}`;
      }
      return `${listPath}/${encodeURIComponent(ns)}/${encodeURIComponent(n)}`;
    };

    return (
      <PageSection className="sc-console-page">
        <div className="sc-page">
          <PageHeader
            title={kindTitle}
            breadcrumbs={[{ label: t('nav.sovereignCloud') }, { label: kindTitle }]}
            actions={
              opts?.createKind ? (
                <Button
                  variant="primary"
                  icon={<PlusCircleIcon />}
                  onClick={() => history.push(`/hybridsovereign/create/${opts.createKind}`)}
                >
                  {t('common.create')}
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
            <Alert
              variant="warning"
              isInline
              title={t('common.unableToList', { kind: kindTitle })}
            >
              {error.message}
            </Alert>
          )}
          {loading && items.length === 0 ? (
            <Spinner aria-label={t('common.loading')} />
          ) : (
            <div className="sc-table-wrap">
              <Table variant="compact" aria-label={kindTitle}>
                <Thead>
                  <Tr>
                    <Th>{t('common.name')}</Th>
                    <Th>{t('common.namespace')}</Th>
                    <Th>{t('common.status')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.length === 0 ? (
                    <Tr>
                      <Td colSpan={3}>{t('pages.noMatch', { kind })}</Td>
                    </Tr>
                  ) : (
                    filtered.map((item) => (
                      <Tr key={item.metadata?.uid ?? `${item.metadata?.namespace}/${item.metadata?.name}`}>
                        <Td>
                          <a className="sc-resource-link" href={detailHref(item)}>
                            <KindIcon kind={kind} size="sm" />
                            {item.metadata?.name}
                          </a>
                        </Td>
                        <Td>{item.metadata?.namespace ?? '—'}</Td>
                        <Td>
                          <StatusBadge status={item.status?.status} ready={item.status?.ready} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </div>
          )}
        </div>
      </PageSection>
    );
  };
  return Page;
};
