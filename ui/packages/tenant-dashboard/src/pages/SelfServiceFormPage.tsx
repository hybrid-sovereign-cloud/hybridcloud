import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Title,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Button,
  ActionGroup,
  Alert,
  Switch,
} from '@patternfly/react-core';
import { API_VERSION_FULL } from '@hybridsovereign/shared';

type FormType = 'team' | 'project' | 'assignment' | 'cloudoso' | 'cloudaws';

interface SelfServiceFormPageProps {
  namespace: string;
}

const FORM_TITLES: Record<FormType, string> = {
  team: 'Create Team',
  project: 'Create Project',
  assignment: 'Create Assignment',
  cloudoso: 'Request CloudOSO Environment',
  cloudaws: 'Request Cloud AWS Account',
};

const FORM_KINDS: Record<FormType, string> = {
  team: 'Team',
  project: 'Project',
  assignment: 'Assignment',
  cloudoso: 'CloudOSO',
  cloudaws: 'CloudAWS',
};

export function SelfServiceFormPage({ namespace }: SelfServiceFormPageProps): React.ReactElement {
  const { formType } = useParams<{ formType: FormType }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamRef, setTeamRef] = useState('');
  const [argoEnabled, setArgoEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const type = formType ?? 'team';
  const title = FORM_TITLES[type] ?? 'Create Resource';

  const buildSpec = (): Record<string, unknown> => {
    switch (type) {
      case 'team':
        return { rbacConfig: 'rhbk-services', features: { argo: argoEnabled, istio: false }, teamAdmin: [] };
      case 'project':
        return { description };
      case 'assignment':
        return { team: teamRef, projects: [], openshift: '' };
      case 'cloudoso':
        return { vaultPath: 'oso/accounts/shc_admin', baseDomain: 'lab.example.com' };
      case 'cloudaws':
        return { account: '', vaultPath: '', baseDomain: '' };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const body = {
      apiVersion: API_VERSION_FULL,
      kind: FORM_KINDS[type],
      metadata: { name, namespace },
      spec: buildSpec(),
    };

    try {
      const response = await fetch(`/api/k8s/apis/${API_VERSION_FULL}/namespaces/${namespace}/${type === 'cloudoso' ? 'cloudosos' : type === 'cloudaws' ? 'cloudawses' : type + 's'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      setResult({ ok: true, message: `${FORM_KINDS[type]} "${name}" submitted.` });
      setTimeout(() => navigate(`/${type === 'cloudoso' ? 'cloudoso' : type === 'cloudaws' ? 'cloudaws' : type + 's'}`), 1500);
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Submit failed — K8s proxy may be offline.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1.5rem' }}>
        {title}
      </Title>
      {result && (
        <Alert
          variant={result.ok ? 'success' : 'warning'}
          title={result.ok ? 'Submitted' : 'Submission failed'}
          isInline
          style={{ marginBottom: '1rem' }}
        >
          {result.message}
        </Alert>
      )}
      <Form onSubmit={handleSubmit} style={{ maxWidth: '36rem' }}>
        <FormGroup label="Name" isRequired fieldId="name">
          <TextInput id="name" value={name} onChange={(_e, v) => setName(v)} isRequired />
        </FormGroup>
        {(type === 'project') && (
          <FormGroup label="Description" fieldId="description">
            <TextArea id="description" value={description} onChange={(_e, v) => setDescription(v)} />
          </FormGroup>
        )}
        {type === 'assignment' && (
          <FormGroup label="Team" isRequired fieldId="team">
            <TextInput id="team" value={teamRef} onChange={(_e, v) => setTeamRef(v)} isRequired />
          </FormGroup>
        )}
        {type === 'team' && (
          <FormGroup label="Enable Argo CD" fieldId="argo">
            <Switch id="argo" isChecked={argoEnabled} onChange={(_e, checked) => setArgoEnabled(checked)} />
          </FormGroup>
        )}
        <ActionGroup>
          <Button variant="primary" type="submit" isLoading={submitting}>
            Submit
          </Button>
          <Button variant="link" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </ActionGroup>
      </Form>
    </>
  );
}
