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
import { SyncIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Link, useNavigate } from 'react-router-dom';
import {
  EntityTopology,
  PageHeader,
  HealthDonut,
  HealthStrip,
  StatusBadge,
  normalizeHealth,
  useK8sResourceList,
  K8sResource,
} from '@hybridsovereign/shared';

interface TenantOverviewPageProps {
  namespace: string;
}

const KIND_ROWS: { kind: 'Team' | 'Project' | 'PlatformOpenshift' | 'Assignment' | 'CloudOSO' | 'CloudAWS'; path: string; label: string; form?: string }[] = [
  { kind: 'Team', path: '/teams', label: 'Teams', form: 'team' },
  { kind: 'Project', path: '/projects', label: 'Projects', form: 'project' },
  { kind: 'PlatformOpenshift', path: '/platforms', label: 'Platforms' },
  { kind: 'Assignment', path: '/assignments', label: 'Assignments', form: 'assignment' },
  { kind: 'CloudOSO', path: '/cloudoso', label: 'Cloud OSO', form: 'cloudoso' },
  { kind: 'CloudAWS', path: '/cloudaws', label: 'Cloud AWS', form: 'cloudaws' },
];

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

  return (
    <>
      <PageHeader
        title="Entity Overview"
        subtitle={`Live topology and health for ${namespace}`}
        breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Overview' }]}
        actions={
          <Button variant="secondary" icon={<SyncIcon />} onClick={refreshAll}>
            Refresh
          </Button>
        }
      />

      {firstError && (
        <Alert variant="warning" isInline title="Some resources failed to load" style={{ marginBottom: '1rem' }}>
          {firstError.message}
        </Alert>
      )}

      {loading && all.length === 0 ? (
        <Spinner />
      ) : (
        <>
          <div className="sc-overview-grid">
            <Card className="sc-overview-card">
              <CardTitle>Health summary</CardTitle>
              <CardBody>
                <HealthDonut ready={overall.ready} failed={overall.failed} pending={overall.pending} />
              </CardBody>
            </Card>
            <Card className="sc-overview-card">
              <CardTitle>Resource counts</CardTitle>
              <CardBody>
                <HealthStrip
                  tiles={[
                    {
                      label: 'Teams',
                      value: teams.items.length,
                      hint: `${bucket(teams.items).ready} ready`,
                      href: '/teams',
                    },
                    {
                      label: 'Projects',
                      value: projects.items.length,
                      hint: `${bucket(projects.items).ready} ready`,
                      href: '/projects',
                    },
                    {
                      label: 'Platforms',
                      value: platforms.items.length,
                      hint: `${bucket(platforms.items).ready} ready`,
                      href: '/platforms',
                    },
                    {
                      label: 'Assignments',
                      value: assignments.items.length,
                      hint: `${bucket(assignments.items).ready} ready`,
                      href: '/assignments',
                    },
                  ]}
                />
              </CardBody>
            </Card>
          </div>

          <Title headingLevel="h2" size="lg" style={{ margin: '0 0 0.75rem' }}>
            Quick actions
          </Title>
          <div className="sc-card-grid" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Create Team', path: '/create/team', hint: 'Team CR' },
              { label: 'Create Project', path: '/create/project', hint: 'Project CR' },
              { label: 'Request CloudOSO', path: '/create/cloudoso', hint: 'OpenStack env' },
              { label: 'Request Cloud AWS', path: '/create/cloudaws', hint: 'AWS env' },
              { label: 'Create Assignment', path: '/create/assignment', hint: 'Bind stack' },
            ].map((action) => (
              <Card key={action.path} isSelectable onClick={() => navigate(action.path)} className="sc-action-card">
                <CardTitle>
                  <PlusCircleIcon style={{ marginRight: '0.5rem' }} />
                  {action.label}
                </CardTitle>
                <CardBody>{action.hint}</CardBody>
              </Card>
            ))}
          </div>

          {failedItems.length > 0 && (
            <Card className="sc-overview-card sc-overview-card--alert" style={{ marginBottom: '1.5rem' }}>
              <CardTitle>Issues ({failedItems.length})</CardTitle>
              <CardBody>
                <div className="sc-table-wrap">
                  <Table variant="compact" aria-label="Failed tenant resources">
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

          <Title headingLevel="h2" size="lg" style={{ marginBottom: '0.75rem' }}>
            Tenancy resources
          </Title>
          <div className="sc-table-wrap" style={{ marginBottom: '1.5rem' }}>
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
                {KIND_ROWS.map((row) => {
                  const b = bucket(lists[row.kind] ?? []);
                  const health = b.total === 0 ? 0 : Math.round((b.ready / b.total) * 100);
                  return (
                    <Tr key={row.kind}>
                      <Td>{row.label}</Td>
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

          <Title headingLevel="h2" size="lg" style={{ marginBottom: '0.75rem' }}>
            Live entity topology
          </Title>
          <Card>
            <CardBody>
              <EntityTopology entityNamespace={namespace} filterByPermissions={false} />
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
