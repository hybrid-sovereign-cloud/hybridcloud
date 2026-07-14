import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { EntityTopology } from '@hybridsovereign/shared';

const SUMMARY_CARDS = [
  { title: 'Entities', description: 'Top-level tenants', path: '/entities' },
  { title: 'Teams', description: 'Entity-scoped teams', path: '/teams' },
  { title: 'Assignments', description: 'Team-to-platform bindings', path: '/assignments' },
  { title: 'Platforms', description: 'Managed OpenShift clusters', path: '/platforms' },
  { title: 'Clouds', description: 'CloudOSO and CloudAWS environments', path: '/clouds' },
  { title: 'Services', description: 'AAP, Quay, Vault plugins', path: '/services' },
];

export function OverviewPage(): React.ReactElement {
  return (
    <>
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1.5rem' }}>
        Platform Overview
      </Title>
      <DescriptionList isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>API Group</DescriptionListTerm>
          <DescriptionListDescription>hybridsovereign.redhat/v1alpha1</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Scope</DescriptionListTerm>
          <DescriptionListDescription>Platform-wide operator view</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      <Grid hasGutter style={{ marginTop: '1.5rem' }}>
        {SUMMARY_CARDS.map((card) => (
          <GridItem key={card.path} sm={6} md={4} lg={3}>
            <Card isFullHeight>
              <CardTitle>{card.title}</CardTitle>
              <CardBody>{card.description}</CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>
      <Title headingLevel="h3" size="lg" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        Platform Topology
      </Title>
      <EntityTopology filterByPermissions={false} />
    </>
  );
}
