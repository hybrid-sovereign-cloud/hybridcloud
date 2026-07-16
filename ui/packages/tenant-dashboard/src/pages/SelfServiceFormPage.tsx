import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Button,
  ActionGroup,
  Alert,
  Switch,
  Card,
  CardBody,
  Title,
} from '@patternfly/react-core';
import {
  API_VERSION_FULL,
  HybridSovereignKind,
  createDashboardResource,
  PageHeader,
  useK8sResourceList,
  K8sResource,
} from '@hybridsovereign/shared';

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

const FORM_KINDS: Record<FormType, HybridSovereignKind> = {
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
  const [projectRef, setProjectRef] = useState('');
  const [platformRef, setPlatformRef] = useState('');
  const [argoEnabled, setArgoEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const type = (formType ?? 'team') as FormType;
  const title = FORM_TITLES[type] ?? 'Create Resource';
  const kind = FORM_KINDS[type];

  const teams = useK8sResourceList<K8sResource>('Team', {
    namespace,
    enabled: type === 'assignment',
  });
  const projects = useK8sResourceList<K8sResource>('Project', {
    namespace,
    enabled: type === 'assignment',
  });
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', {
    namespace,
    enabled: type === 'assignment',
  });

  const buildSpec = (): Record<string, unknown> => {
    switch (type) {
      case 'team':
        return {
          rbacConfig: 'rhbk-services',
          features: { argo: argoEnabled, istio: false },
          teamAdmin: [],
        };
      case 'project':
        return { description };
      case 'assignment':
        return {
          team: teamRef,
          projects: projectRef ? [projectRef] : [],
          openshift: platformRef || undefined,
        };
      case 'cloudoso':
        return { vaultPath: 'oso/accounts/shc_admin', baseDomain: 'lab.example.com' };
      case 'cloudaws':
        return { account: '', vaultPath: '', baseDomain: 'lab.example.com' };
      default:
        return {};
    }
  };

  const listPath = useMemo(() => {
    if (type === 'cloudoso') return '/cloudoso';
    if (type === 'cloudaws') return '/cloudaws';
    return `/${type}s`;
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      await createDashboardResource(
        kind,
        { name, namespace, spec: buildSpec() },
        namespace,
      );
      setResult({ ok: true, message: `${kind} "${name}" submitted.` });
      setTimeout(() => navigate(listPath), 1200);
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Submit failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        subtitle={`Namespace ${namespace}`}
        breadcrumbs={[
          { label: 'Sovereign Cloud' },
          { label: type === 'assignment' ? 'Assignments' : title, to: listPath },
          { label: 'Create' },
        ]}
      />
      {result && (
        <Alert
          variant={result.ok ? 'success' : 'danger'}
          title={result.ok ? 'Submitted' : 'Submission failed'}
          isInline
          style={{ marginBottom: '1rem' }}
        >
          {result.message}
        </Alert>
      )}
      <div className="sc-form-layout">
        <Card>
          <CardBody>
            <Form onSubmit={handleSubmit}>
              <Title headingLevel="h3" size="md" style={{ marginBottom: '1rem' }}>
                {type === 'assignment' ? '1 · Context' : 'Identity'}
              </Title>
              <FormGroup label="Name" isRequired fieldId="name">
                <TextInput id="name" value={name} onChange={(_e, v) => setName(v)} isRequired />
              </FormGroup>
              {type === 'project' && (
                <FormGroup label="Description" fieldId="description">
                  <TextArea id="description" value={description} onChange={(_e, v) => setDescription(v)} />
                </FormGroup>
              )}
              {type === 'team' && (
                <FormGroup label="Enable Argo CD" fieldId="argo">
                  <Switch
                    id="argo"
                    isChecked={argoEnabled}
                    onChange={(_e, checked) => setArgoEnabled(checked)}
                  />
                </FormGroup>
              )}

              {type === 'assignment' && (
                <>
                  <Title headingLevel="h3" size="md" style={{ margin: '1.5rem 0 1rem' }}>
                    2 · Bind resources
                  </Title>
                  <FormGroup label="Team" isRequired fieldId="team">
                    <TextInput
                      id="team"
                      list="team-options"
                      value={teamRef}
                      onChange={(_e, v) => setTeamRef(v)}
                      isRequired
                    />
                    <datalist id="team-options">
                      {teams.items.map((t) => (
                        <option key={t.metadata.name} value={t.metadata.name} />
                      ))}
                    </datalist>
                  </FormGroup>
                  <FormGroup label="Project" fieldId="project">
                    <TextInput
                      id="project"
                      list="project-options"
                      value={projectRef}
                      onChange={(_e, v) => setProjectRef(v)}
                    />
                    <datalist id="project-options">
                      {projects.items.map((t) => (
                        <option key={t.metadata.name} value={t.metadata.name} />
                      ))}
                    </datalist>
                  </FormGroup>
                  <FormGroup label="Platform Openshift" fieldId="platform">
                    <TextInput
                      id="platform"
                      list="platform-options"
                      value={platformRef}
                      onChange={(_e, v) => setPlatformRef(v)}
                    />
                    <datalist id="platform-options">
                      {platforms.items.map((t) => (
                        <option key={t.metadata.name} value={t.metadata.name} />
                      ))}
                    </datalist>
                  </FormGroup>
                  {teamRef && (
                    <Alert variant="success" isInline title="Dependencies selected">
                      Binding team <strong>{teamRef}</strong>
                      {projectRef ? ` · project ${projectRef}` : ''}
                      {platformRef ? ` · platform ${platformRef}` : ''}.
                    </Alert>
                  )}
                  <Title headingLevel="h3" size="md" style={{ margin: '1.5rem 0 1rem' }}>
                    3 · Review
                  </Title>
                  <pre className="sc-yaml-preview">
                    {JSON.stringify({ name, namespace, spec: buildSpec() }, null, 2)}
                  </pre>
                </>
              )}

              <ActionGroup>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={submitting}
                  isDisabled={!name || (type === 'assignment' && !teamRef)}
                >
                  Create
                </Button>
                <Button variant="link" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </ActionGroup>
            </Form>
          </CardBody>
        </Card>
        {type === 'assignment' && (
          <Card className="sc-form-preview">
            <CardBody>
              <Title headingLevel="h3" size="md">
                Preview
              </Title>
              <p className="sc-page-header__subtitle">Resulting assignment topology</p>
              <div className="sc-bind-preview">
                <div className="sc-bind-preview__node">Team: {teamRef || '—'}</div>
                <div className="sc-bind-preview__edge" />
                <div className="sc-bind-preview__node">Project: {projectRef || '—'}</div>
                <div className="sc-bind-preview__edge" />
                <div className="sc-bind-preview__node">Platform: {platformRef || '—'}</div>
                <div className="sc-bind-preview__edge" />
                <div className="sc-bind-preview__node sc-bind-preview__node--new">
                  Assignment: {name || '(new)'}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
