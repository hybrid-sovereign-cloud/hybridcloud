import * as React from 'react';
import {
  Title,
  PageSection,
  Form,
  FormGroup,
  TextInput,
  Button,
  ActionGroup,
} from '@patternfly/react-core';
import { useK8sResourceList, type Team } from '@hybridsovereign/shared';

const TENANT_NAMESPACE = 'entity-acme-corp';

const TenantTeamsPage: React.FC = () => {
  const { items, loading } = useK8sResourceList<Team>('Team', { namespace: TENANT_NAMESPACE });
  const [teamName, setTeamName] = React.useState('');

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl">My Teams</Title>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {items.map((t) => (
            <li key={t.metadata.name}>{t.metadata.name}</li>
          ))}
        </ul>
      )}
      <Form style={{ marginTop: '2rem', maxWidth: '24rem' }}>
        <FormGroup label="New team name" fieldId="team-name">
          <TextInput id="team-name" value={teamName} onChange={(_e, v) => setTeamName(v)} />
        </FormGroup>
        <ActionGroup>
          <Button variant="primary" isDisabled>
            Create Team (scaffold)
          </Button>
        </ActionGroup>
      </Form>
    </PageSection>
  );
};

export default TenantTeamsPage;
