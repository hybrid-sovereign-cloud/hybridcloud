import React from 'react';
import {
  Title,
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { EntityTopology } from '@hybridsovereign/shared';

interface TenantOverviewPageProps {
  namespace: string;
}

const SELF_SERVICE = [
  { label: 'Create Team', path: '/create/team' },
  { label: 'Create Project', path: '/create/project' },
  { label: 'Request CloudOSO', path: '/create/cloudoso' },
  { label: 'Request Cloud AWS', path: '/create/cloudaws' },
  { label: 'Create Assignment', path: '/create/assignment' },
];

export function TenantOverviewPage({ namespace }: TenantOverviewPageProps): React.ReactElement {
  return (
    <>
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem' }}>
        My Entity
      </Title>
      <DescriptionList isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>Namespace</DescriptionListTerm>
          <DescriptionListDescription>{namespace}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Scope</DescriptionListTerm>
          <DescriptionListDescription>Tenant self-service</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      <Title headingLevel="h3" size="lg" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        Quick Actions
      </Title>
      <Grid hasGutter>
        {SELF_SERVICE.map((action) => (
          <GridItem key={action.path} sm={6} md={4}>
            <Card isSelectable isClickable component="a" href={action.path}>
              <CardTitle>{action.label}</CardTitle>
              <CardBody>Self-service CR creation form</CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>
      <Title headingLevel="h3" size="lg" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        Entity Topology
      </Title>
      <EntityTopology entityNamespace={namespace} filterByPermissions />
    </>
  );
}
