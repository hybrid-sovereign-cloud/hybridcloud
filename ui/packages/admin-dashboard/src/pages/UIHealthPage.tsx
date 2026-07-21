import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Label,
  Spinner,
} from '@patternfly/react-core';
import { PlusCircleIcon, SyncIcon } from '@patternfly/react-icons';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Link, useNavigate } from 'react-router-dom';
import {
  K8sResource,
  PageHeader,
  StatusBadge,
  useK8sResourceList,
  useTranslation,
} from '@hybridsovereign/shared';

type ProbeResult = {
  status: 'live' | 'unreachable' | 'pending';
  httpStatus?: number;
  error?: string;
  checkedAt?: string;
};

async function probeUrl(url: string, timeoutSeconds = 10): Promise<ProbeResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  const checkedAt = new Date().toISOString();
  try {
    const resp = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal,
      redirect: 'follow',
    });
    return { status: 'live', httpStatus: resp.status, checkedAt };
  } catch (err) {
    return {
      status: 'unreachable',
      error: err instanceof Error ? err.message : 'unreachable',
      checkedAt,
    };
  } finally {
    window.clearTimeout(timer);
  }
}

export function UIHealthPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, loading, error, refresh } = useK8sResourceList<K8sResource>('UIHealthChecker', {
    namespace: 'sovereign-cloud',
  });
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [running, setRunning] = useState(false);

  const runChecks = useCallback(async () => {
    setRunning(true);
    const next: Record<string, ProbeResult> = {};
    await Promise.all(
      items.map(async (item) => {
        const spec = (item.spec ?? {}) as {
          url?: string;
          timeoutSeconds?: number;
        };
        const key = item.metadata.name;
        if (!spec.url) {
          next[key] = { status: 'unreachable', error: 'missing url' };
          return;
        }
        next[key] = await probeUrl(spec.url, spec.timeoutSeconds ?? 10);
      }),
    );
    setResults(next);
    setRunning(false);
  }, [items]);

  const summary = useMemo(() => {
    const values = Object.values(results);
    return {
      live: values.filter((v) => v.status === 'live').length,
      unreachable: values.filter((v) => v.status === 'unreachable').length,
    };
  }, [results]);

  return (
    <>
      <PageHeader
        title={t('nav.uiHealth')}
        subtitle={t('pages.uiHealthSubtitle')}
        breadcrumbs={[{ label: t('nav.sovereignAdmin') }, { label: t('nav.uiHealth') }]}
        actions={
          <>
            <Button variant="secondary" icon={<SyncIcon />} onClick={refresh} isDisabled={loading}>
              {t('common.refresh')}
            </Button>
            <Button variant="primary" onClick={runChecks} isDisabled={running || items.length === 0}>
              {running ? t('pages.uiHealthRunning') : t('pages.uiHealthRun')}
            </Button>
            <Button
              variant="secondary"
              icon={<PlusCircleIcon />}
              onClick={() => navigate('/create/uihealthchecker')}
            >
              {t('common.create')}
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="warning" isInline title={t('common.k8sUnavailable')} className="sc-mb">
          {error.message}
        </Alert>
      )}

      <Alert variant="info" isInline title={t('pages.uiHealthBrowserNote')} className="sc-mb">
        {t('pages.uiHealthBrowserNoteBody')}
      </Alert>

      {(Object.keys(results).length > 0) && (
        <p className="sc-mb">
          {t('pages.uiHealthSummary', {
            live: summary.live,
            unreachable: summary.unreachable,
          })}
        </p>
      )}

      {loading && items.length === 0 ? (
        <Spinner />
      ) : (
        <div className="sc-table-wrap">
          <Table aria-label={t('nav.uiHealth')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('common.name')}</Th>
                <Th>{t('fields.group')}</Th>
                <Th>{t('fields.url')}</Th>
                <Th>{t('common.status')}</Th>
                <Th>{t('pages.uiHealthLive')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.length === 0 ? (
                <Tr>
                  <Td colSpan={5}>{t('pages.uiHealthEmpty')}</Td>
                </Tr>
              ) : (
                items.map((item) => {
                  const spec = (item.spec ?? {}) as {
                    url?: string;
                    group?: string;
                    displayName?: string;
                  };
                  const probe = results[item.metadata.name];
                  return (
                    <Tr key={item.metadata.name}>
                      <Td>
                        <Link to={`/networking/uihealth/${item.metadata.name}`}>
                          {spec.displayName || item.metadata.name}
                        </Link>
                      </Td>
                      <Td>{spec.group || '—'}</Td>
                      <Td>
                        {spec.url ? (
                          <a href={spec.url} target="_blank" rel="noopener noreferrer">
                            {spec.url}
                          </a>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td>
                        <StatusBadge ready={item.status?.ready} status={item.status?.status} />
                      </Td>
                      <Td>
                        {!probe ? (
                          <Label color="grey">{t('pages.uiHealthNotRun')}</Label>
                        ) : probe.status === 'live' ? (
                          <Label color="green">
                            {t('pages.uiHealthLive')}
                            {probe.httpStatus ? ` (${probe.httpStatus})` : ''}
                          </Label>
                        ) : (
                          <Label color="red" title={probe.error}>
                            {t('pages.uiHealthUnreachable')}
                          </Label>
                        )}
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </div>
      )}
    </>
  );
}
