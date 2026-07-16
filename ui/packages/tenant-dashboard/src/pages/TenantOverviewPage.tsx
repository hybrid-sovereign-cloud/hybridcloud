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
  Progress,
  ProgressSize,
} from '@patternfly/react-core';
import {
  SyncIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  CubesIcon,
  ClusterIcon,
  ProjectDiagramIcon,
  CloudIcon,
  TopologyIcon,
} from '@patternfly/react-icons';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Link, useNavigate } from 'react-router-dom';
import {
  EntityTopology,
  PageHeader,
  HealthDonut,
  InventoryCard,
  StatusBadge,
  normalizeHealth,
  useK8sResourceList,
  K8sResource,
} from '@hybridsovereign/shared';

interface TenantOverviewPageProps {
  namespace: string;
}

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

export function TenantOverviewPage({ namespace }: TenantOverviewPageProps): React.ReactElement {
  const navigate = useNavigate();
  const opts = { namespace, pollIntervalMs: 60000 as const };
  const teams = useK8sResourceList<K8sResource>('Team', opts);
  const projects = useK8sResourceList<K8sResource>('Project', opts);
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', opts);
  const assignments = useK8sResourceList<K8sResource>('Assignment', opts);
  const cloudoso = useK8sResourceList<K8sResource>('CloudOSO', opts);
  const cloudaws = useK8sResourceList<K8sResource>('CloudAWS', opts);

  const lists: Record<string, K8sResource[]> = {
    Team: teams.items,
    Project: projects.items,
    PlatformOpenshift: platforms.items,
    Assignment: assignments.items,
    CloudOSO: cloudoso.items,
    CloudAWS: cloudaws.items,
  };

  const all = useMemo(
    () => Object.values(lists).flat(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teams.items, projects.items, platforms.items, assignments.items, cloudoso.items, cloudaws.items],
  );
  const overall = bucket(all);
  const loading =
    teams.loading ||
    projects.loading ||
    platforms.loading ||
    assignments.loading ||
    cloudoso.loading ||
    cloudaws.loading;
  const firstError =
    teams.error || projects.error || platforms.error || assignments.error || cloudoso.error || cloudaws.error;
  const failedItems = all
    .filter((i) => normalizeHealth(i.status?.ready, i.status?.status) === 'failed')
    .slice(0, 8);

  const refreshAll = () => {
    teams.refresh();
    projects.refresh();
    platforms.refresh();
    assignments.refresh();
    cloudoso.refresh();
    cloudaws.refresh();
  };

  const kindRows = [
    { kind: 'Team', label: 'Teams', path: '/teams', icon: <UsersIcon /> },
    { kind: 'Project', label: 'Projects', path: '/projects', icon: <CubesIcon /> },
    { kind: 'PlatformOpenshift', label: 'Platforms', path: '/platforms', icon: <ClusterIcon /> },
    { kind: 'Assignment', label: 'Assignments', path: '/assignments', icon: <ProjectDiagramIcon /> },
    { kind: 'CloudOSO', label: 'Cloud OSO', path: '/cloudoso', icon: <CloudIcon /> },
    { kind: 'CloudAWS', label: 'Cloud AWS', path: '/cloudaws', icon: <CloudIcon /> },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`Entity namespace ${namespace}`}
        actions={
          <Button variant="secondary" icon={<SyncIcon />} onClick={refreshAll}>
            Refresh
          </Button>
        }
      />

      {firstError && (
        <Alert variant="warning" isInline title="Some resources failed to load" className="sc-mb">
          {firstError.message}
        </Alert>
      )}

      {loading && all.length === 0 ? (
        <Spinner />
      ) : (
        <>
          <div className="sc-overview-top">
            <Card className="sc-panel">
              <CardTitle>Health summary</CardTitle>
              <CardBody>
                <HealthDonut ready={overall.ready} failed={overall.failed} pending={overall.pending} />
              </CardBody>
            </Card>
            <div className="sc-inventory-grid">
              <InventoryCard
                title="Teams"
                count={teams.items.length}
                hint={`${bucket(teams.items).ready} ready`}
                icon={<UsersIcon />}
                href="/teams"
              />
              <InventoryCard
                title="Platforms"
                count={platforms.items.length}
                hint={`${bucket(platforms.items).ready} ready`}
                icon={<ClusterIcon />}
                href="/platforms"
              />
              <InventoryCard
                title="Assignments"
                count={assignments.items.length}
                hint={`${bucket(assignments.items).ready} ready`}
                icon={<ProjectDiagramIcon />}
                href="/assignments"
              />
              <InventoryCard
                title="Projects"
                count={projects.items.length}
                hint={`${bucket(projects.items).ready} ready`}
                icon={<CubesIcon />}
                href="/projects"
              />
            </div>
          </div>

          <Title headingLevel="h2" size="lg" className="sc-section-title">
            Quick actions
          </Title>
          <div className="sc-card-grid sc-mb">
            {[
              { label: 'Create Team', path: '/create/team' },
              { label: 'Create Project', path: '/create/project' },
              { label: 'Request CloudOSO', path: '/create/cloudoso' },
              { label: 'Request Cloud AWS', path: '/create/cloudaws' },
              { label: 'Create Assignment', path: '/create/assignment' },
            ].map((a) => (
              <Card
                key={a.path}
                isSelectable
                isCompact
                className="sc-action-card"
                onClick={() => navigate(a.path)}
              >
                <CardTitle>
                  <PlusCircleIcon className="sc-inline-icon" />
                  {a.label}
                </CardTitle>
              </Card>
            ))}
          </div>

          {failedItems.length > 0 && (
            <Card className="sc-failed-panel sc-mb">
              <CardHeader>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <ExclamationTriangleIcon className="sc-failed-panel__icon" />
                  </FlexItem>
                  <FlexItem>
                    <CardTitle component="span">
                      Issues <Label color="orange">{failedItems.length}</Label>
                    </CardTitle>
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
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {failedItems.map((item) => (
                        <Tr key={`${item.kind}/${item.metadata.name}`}>
                          <Td>{item.kind}</Td>
                          <Td>{item.metadata.name}</Td>
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

          <Title headingLevel="h2" size="lg" className="sc-section-title">
            Tenancy resources
          </Title>
          <div className="sc-table-wrap sc-mb">
            <Table variant="compact" aria-label="Tenancy kind status">
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
                {kindRows.map((row) => {
                  const b = bucket(lists[row.kind] ?? []);
                  const health = b.total === 0 ? 0 : Math.round((b.ready / b.total) * 100);
                  return (
                    <Tr key={row.kind}>
                      <Td>
                        <span className="sc-kind-cell">
                          {row.icon}
                          {row.label}
                        </span>
                      </Td>
                      <Td>{b.total}</Td>
                      <Td>
                        <span className="sc-text-success">{b.ready}</span>
                      </Td>
                      <Td>
                        <span className={b.failed ? 'sc-text-danger' : undefined}>{b.failed}</span>
                      </Td>
                      <Td>
                        <Progress value={health} size={ProgressSize.sm} aria-label={`${row.label} health`} />
                      </Td>
                      <Td>
                        <Link to={row.path}>View</Link>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>

          <Title headingLevel="h2" size="lg" className="sc-section-title">
            <TopologyIcon className="sc-inline-icon" /> Live entity topology
          </Title>
          <Card className="sc-panel">
            <CardBody>
              <div className="sc-topo-legend">
                <span>
                  <i className="sc-dot sc-dot--ready" /> Healthy
                </span>
                <span>
                  <i className="sc-dot sc-dot--failed" /> Failed
                </span>
                <span>
                  <i className="sc-dot sc-dot--pending" /> Pending
                </span>
              </div>
              <EntityTopology entityNamespace={namespace} filterByPermissions={false} />
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
