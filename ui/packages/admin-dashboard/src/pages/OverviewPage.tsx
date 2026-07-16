import React, { useMemo } from 'react';
import {
  Title,
  Card,
  CardTitle,
  CardBody,
  Button,
  Spinner,
  Alert,
  Progress,
  ProgressSize,
} from '@patternfly/react-core';
import { SyncIcon } from '@patternfly/react-icons';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Link } from 'react-router-dom';
import {
  EntityTopology,
  PageHeader,
  HealthDonut,
  HealthStrip,
  StatusBadge,
  normalizeHealth,
  useOverviewCRs,
  K8sResource,
} from '@hybridsovereign/shared';

function bucket(items: K8sResource[]) {
  let ready = 0;
  let failed = 0;
  let pending = 0;
  for (const i of items) {
    const h = normalizeHealth(i.status?.ready, i.status?.status);
    if (h === 'ready') ready += 1;
    else if (h === 'failed') failed += 1;
    else pending += 1;
  }
  return { ready, failed, pending, total: items.length };
}

const KIND_LINKS: { kind: string; path: string; label: string }[] = [
  { kind: 'Entity', path: '/entities', label: 'Entities' },
  { kind: 'Team', path: '/teams', label: 'Teams' },
  { kind: 'Project', path: '/projects', label: 'Projects' },
  { kind: 'PlatformOpenshift', path: '/platforms', label: 'Platforms' },
  { kind: 'Assignment', path: '/assignments', label: 'Assignments' },
  { kind: 'CloudOSO', path: '/clouds', label: 'Cloud OSO' },
  { kind: 'CloudAWS', path: '/clouds', label: 'Cloud AWS' },
  { kind: 'Persona', path: '/personas', label: 'Personas' },
];

export function OverviewPage(): React.ReactElement {
  const { items, loading, error, refresh } = useOverviewCRs(60000);

  const byKind = useMemo(() => {
    const map = new Map<string, K8sResource[]>();
    for (const item of items) {
      const k = item.kind || 'Unknown';
      const list = map.get(k) ?? [];
      list.push(item);
      map.set(k, list);
    }
    return map;
  }, [items]);

  const overall = useMemo(() => bucket(items), [items]);
  const failedItems = useMemo(
    () =>
      items
        .filter((i) => normalizeHealth(i.status?.ready, i.status?.status) === 'failed')
        .slice(0, 8),
    [items],
  );

  const kindRows = KIND_LINKS.map((row) => {
    const list = byKind.get(row.kind) ?? [];
    const b = bucket(list);
    const health = b.total === 0 ? 0 : Math.round((b.ready / b.total) * 100);
    return { ...row, ...b, health };
  }).filter((r) => r.total > 0 || ['Entity', 'Team', 'Assignment'].includes(r.kind));

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Platform health, failed resources, and live CR topology"
        breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Overview' }]}
        actions={
          <Button variant="secondary" icon={<SyncIcon />} onClick={refresh}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert variant="warning" isInline title="Unable to load overview" style={{ marginBottom: '1rem' }}>
          {error.message}
        </Alert>
      )}

      {loading && items.length === 0 ? (
        <Spinner />
      ) : (
        <>
          <div className="sc-overview-grid">
            <Card className="sc-overview-card">
              <CardTitle>Platform health</CardTitle>
              <CardBody>
                <HealthDonut ready={overall.ready} failed={overall.failed} pending={overall.pending} />
              </CardBody>
            </Card>
            <Card className="sc-overview-card">
              <CardTitle>Resource summary</CardTitle>
              <CardBody>
                <HealthStrip
                  tiles={[
                    {
                      label: 'Entities',
                      value: (byKind.get('Entity') ?? []).length,
                      hint: `${bucket(byKind.get('Entity') ?? []).ready} ready`,
                      href: '/entities',
                    },
                    {
                      label: 'Teams',
                      value: (byKind.get('Team') ?? []).length,
                      hint: `${bucket(byKind.get('Team') ?? []).ready} ready`,
                      href: '/teams',
                    },
                    {
                      label: 'Platforms',
                      value: (byKind.get('PlatformOpenshift') ?? []).length,
                      hint: `${bucket(byKind.get('PlatformOpenshift') ?? []).ready} ready`,
                      href: '/platforms',
                    },
                    {
                      label: 'Assignments',
                      value: (byKind.get('Assignment') ?? []).length,
                      hint: `${bucket(byKind.get('Assignment') ?? []).ready} ready`,
                      href: '/assignments',
                    },
                  ]}
                />
              </CardBody>
            </Card>
          </div>

          {failedItems.length > 0 && (
            <Card className="sc-overview-card sc-overview-card--alert" style={{ marginBottom: '1.5rem' }}>
              <CardTitle>
                Failed custom resources ({failedItems.length}
                {overall.failed > failedItems.length ? ` of ${overall.failed}` : ''})
              </CardTitle>
              <CardBody>
                <div className="sc-table-wrap">
                  <Table variant="compact" aria-label="Failed resources">
                    <Thead>
                      <Tr>
                        <Th>Kind</Th>
                        <Th>Name</Th>
                        <Th>Namespace</Th>
                        <Th>Message</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {failedItems.map((item) => (
                        <Tr key={`${item.kind}/${item.metadata.namespace}/${item.metadata.name}`}>
                          <Td>{item.kind}</Td>
                          <Td>{item.metadata.name}</Td>
                          <Td>{item.metadata.namespace ?? '—'}</Td>
                          <Td>
                            <StatusBadge
                              status={item.status?.status}
                              ready={item.status?.ready}
                              message={item.status?.message}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          )}

          <Title headingLevel="h2" size="lg" style={{ marginBottom: '0.75rem' }}>
            Kind status
          </Title>
          <div className="sc-table-wrap" style={{ marginBottom: '1.5rem' }}>
            <Table variant="compact" aria-label="Kind status">
              <Thead>
                <Tr>
                  <Th>Kind</Th>
                  <Th>Total</Th>
                  <Th>Ready</Th>
                  <Th>Failed</Th>
                  <Th>Health</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {kindRows.map((row) => (
                  <Tr key={row.kind}>
                    <Td>{row.label}</Td>
                    <Td>{row.total}</Td>
                    <Td>
                      <span className="sc-text-success">{row.ready}</span>
                    </Td>
                    <Td>
                      <span className={row.failed ? 'sc-text-danger' : undefined}>{row.failed}</span>
                    </Td>
                    <Td>
                      <Progress value={row.health} size={ProgressSize.sm} aria-label={`${row.label} health`} />
                    </Td>
                    <Td>
                      <Link to={row.path}>View</Link>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>

          <Title headingLevel="h2" size="lg" style={{ marginBottom: '0.75rem' }}>
            Live platform topology
          </Title>
          <Card>
            <CardBody>
              <EntityTopology filterByPermissions={false} />
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
