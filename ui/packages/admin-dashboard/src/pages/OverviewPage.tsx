import React, { useMemo } from 'react';
import {
  Title,
  Card,
  CardTitle,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Alert,
  Label,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  SyncIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ExternalLinkAltIcon,
  TopologyIcon,
} from '@patternfly/react-icons';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Link } from 'react-router-dom';
import {
  EntityTopology,
  PageHeader,
  HealthDonut,
  InventoryCard,
  StatusBadge,
  KindIcon,
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
  const platforms = byKind.get('PlatformOpenshift') ?? [];
  const failedItems = useMemo(
    () =>
      items
        .filter((i) => normalizeHealth(i.status?.ready, i.status?.status) === 'failed')
        .slice(0, 10),
    [items],
  );

  return (
    <>
      <PageHeader
        title="Overview"
        actions={
          <Button variant="secondary" icon={<SyncIcon />} onClick={refresh}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert variant="warning" isInline title="Unable to load overview" className="sc-mb">
          {error.message}
        </Alert>
      )}

      {loading && items.length === 0 ? (
        <Spinner />
      ) : (
        <>
          <div className="sc-overview-top">
            <Card className="sc-panel">
              <CardTitle>Platform health</CardTitle>
              <CardBody>
                <HealthDonut
                  ready={overall.ready}
                  failed={overall.failed}
                  pending={overall.pending}
                  title="Platform"
                />
              </CardBody>
            </Card>

            <div className="sc-inventory-grid">
              <InventoryCard
                title="Entities"
                count={(byKind.get('Entity') ?? []).length}
                hint={`${bucket(byKind.get('Entity') ?? []).ready} ready`}
                kind="Entity"
                href="/entities"
                status="success"
              />
              <InventoryCard
                title="Teams"
                count={(byKind.get('Team') ?? []).length}
                hint={`${bucket(byKind.get('Team') ?? []).ready} ready`}
                kind="Team"
                href="/teams"
              />
              <InventoryCard
                title="Platforms"
                count={platforms.length}
                hint={`${bucket(platforms).ready} ready`}
                kind="PlatformOpenshift"
                href="/platforms"
                status={bucket(platforms).failed ? 'danger' : 'default'}
              />
              <InventoryCard
                title="Assignments"
                count={(byKind.get('Assignment') ?? []).length}
                hint={`${bucket(byKind.get('Assignment') ?? []).ready} ready`}
                kind="Assignment"
                href="/assignments"
                status={bucket(byKind.get('Assignment') ?? []).failed ? 'danger' : 'default'}
              />
            </div>
          </div>

          {platforms.length > 0 && (
            <>
              <Title headingLevel="h2" size="lg" className="sc-section-title">
                OpenShift clusters
              </Title>
              <div className="sc-cluster-grid sc-mb">
                {platforms.slice(0, 6).map((p) => {
                  const healthy = normalizeHealth(p.status?.ready, p.status?.status) === 'ready';
                  return (
                    <Card key={p.metadata.name} className="sc-cluster-card" isCompact>
                      <CardHeader>
                        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <KindIcon kind="PlatformOpenshift" size="sm" />
                          </FlexItem>
                          <FlexItem>
                            <Link to="/platforms" className="sc-cluster-card__name">
                              {p.metadata.name} <ExternalLinkAltIcon />
                            </Link>
                          </FlexItem>
                          <FlexItem align={{ default: 'alignRight' }}>
                            <Label color={healthy ? 'green' : 'red'} icon={healthy ? <CheckCircleIcon /> : undefined}>
                              {healthy ? 'Healthy' : 'Degraded'}
                            </Label>
                          </FlexItem>
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <dl className="sc-meta-list">
                          <div>
                            <dt>Namespace</dt>
                            <dd>{p.metadata.namespace ?? '—'}</dd>
                          </div>
                          <div>
                            <dt>Status</dt>
                            <dd>{p.status?.status ?? (healthy ? 'ready' : 'unknown')}</dd>
                          </div>
                        </dl>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {failedItems.length > 0 && (
            <Card className="sc-failed-panel sc-mb">
              <CardHeader>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <ExclamationTriangleIcon className="sc-failed-panel__icon" />
                  </FlexItem>
                  <FlexItem>
                    <CardTitle component="span">
                      Failed custom resources{' '}
                      <Label color="orange">{overall.failed}</Label>
                    </CardTitle>
                  </FlexItem>
                  <FlexItem align={{ default: 'alignRight' }}>
                    <Link to="/operators">View all</Link>
                  </FlexItem>
                </Flex>
              </CardHeader>
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
                          <Td dataLabel="Kind">{item.kind}</Td>
                          <Td dataLabel="Name">{item.metadata.name}</Td>
                          <Td dataLabel="Namespace">{item.metadata.namespace ?? '—'}</Td>
                          <Td dataLabel="Message">
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

          <Flex alignItems={{ default: 'alignItemsCenter' }} className="sc-section-title">
            <FlexItem>
              <Title headingLevel="h2" size="lg">
                <TopologyIcon className="sc-inline-icon" /> Live topology
              </Title>
            </FlexItem>
          </Flex>
          <Card className="sc-panel">
            <CardBody>
              <EntityTopology filterByPermissions={false} />
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
