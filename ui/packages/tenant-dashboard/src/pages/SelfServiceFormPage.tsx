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
} from '@patternfly/react-core';
import {
  HybridSovereignKind,
  createDashboardResource,
  PageHeader,
  useK8sResourceList,
  K8sResource,
} from '@hybridsovereign/shared';

export type FormType =
  | 'team'
  | 'project'
  | 'assignment'
  | 'cloudoso'
  | 'cloudaws'
  | 'migration'
  | 'persona'
  | 'rbac'
  | 'vault'
  | 'vaultkv'
  | 'aaporg'
  | 'quayorg';

interface SelfServiceFormPageProps {
  namespace: string;
}

const FORM_TITLES: Record<FormType, string> = {
  team: 'Create Team',
  project: 'Create Project',
  assignment: 'Create Assignment',
  cloudoso: 'Request CloudOSO Environment',
  cloudaws: 'Request Cloud AWS Account',
  migration: 'Migrate to OpenStack',
  persona: 'Create Persona',
  rbac: 'Create RBAC',
  vault: 'Create Vault',
  vaultkv: 'Create Vault KV',
  aaporg: 'Create AAP Org',
  quayorg: 'Create Quay Org',
};

const FORM_KINDS: Record<FormType, HybridSovereignKind> = {
  team: 'Team',
  project: 'Project',
  assignment: 'Assignment',
  cloudoso: 'CloudOSO',
  cloudaws: 'CloudAWS',
  migration: 'OpenStackMigration',
  persona: 'Persona',
  rbac: 'Rbac',
  vault: 'Vault',
  vaultkv: 'VaultKV',
  aaporg: 'AAPOrg',
  quayorg: 'QuayOrg',
};

const LIST_PATH: Record<FormType, string> = {
  team: '/teams',
  project: '/projects',
  assignment: '/assignments',
  cloudoso: '/cloudoso',
  cloudaws: '/cloudaws',
  migration: '/migrations',
  persona: '/personas',
  rbac: '/rbac',
  vault: '/vaults',
  vaultkv: '/vaultkvs',
  aaporg: '/aaporgs',
  quayorg: '/quayorgs',
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
  const [rbacRef, setRbacRef] = useState('');
  const [personaType, setPersonaType] = useState('platform-admin');
  const [rbacConfig, setRbacConfig] = useState('rhbk-services');
  const [vaultRef, setVaultRef] = useState('');
  const [cloudosoRef, setCloudosoRef] = useState('');
  const [vmName, setVmName] = useState('');
  const [source, setSource] = useState('vmware');
  const [aapConfig, setAapConfig] = useState('aap-services');
  const [quayConfig, setQuayConfig] = useState('quay-services');
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
  const vaults = useK8sResourceList<K8sResource>('Vault', {
    namespace,
    enabled: type === 'vaultkv',
  });
  const cloudosos = useK8sResourceList<K8sResource>('CloudOSO', {
    namespace,
    enabled: type === 'migration',
  });
  const rbacs = useK8sResourceList<K8sResource>('Rbac', {
    namespace,
    enabled: type === 'persona',
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
      case 'migration':
        return { source, vmName, cloudoso: cloudosoRef };
      case 'persona':
        return { rbac: rbacRef, type: personaType };
      case 'rbac':
        return { config: rbacConfig, description };
      case 'vault':
        return { ha: true, rbacConfig };
      case 'vaultkv':
        return { vault: vaultRef, vaultAdminRbac: [], vaultReaderRbac: [] };
      case 'aaporg':
        return { aapConfig, aapAdminRbac: [], aapJobExecutorRbac: [] };
      case 'quayorg':
        return { quayConfig, quayAdminRbac: [], quayCreatorRbac: [], quayMemberRbac: [] };
      default:
        return {};
    }
  };

  const listPath = LIST_PATH[type] ?? '/';

  const canSubmit = (): boolean => {
    if (!name) return false;
    if (type === 'assignment' && !teamRef) return false;
    if (type === 'persona' && !rbacRef) return false;
    if (type === 'vaultkv' && !vaultRef) return false;
    if (type === 'migration' && (!vmName || !cloudosoRef)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      await createDashboardResource(kind, { name, namespace, spec: buildSpec() }, namespace);
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
          { label: title.replace(/^Create |^Request |^Migrate to /, ''), to: listPath },
          { label: 'Create' },
        ]}
      />
      {result && (
        <Alert
          variant={result.ok ? 'success' : 'danger'}
          title={result.ok ? 'Submitted' : 'Submission failed'}
          isInline
          className="sc-mb"
        >
          {result.message}
        </Alert>
      )}
      <div className="sc-form-layout">
        <Card isCompact>
          <CardBody>
            <Form onSubmit={handleSubmit}>
              <FormGroup label="Name" isRequired fieldId="name">
                <TextInput id="name" value={name} onChange={(_e, v) => setName(v)} isRequired />
              </FormGroup>

              {(type === 'project' || type === 'rbac') && (
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
                  <FormGroup label="Team" isRequired fieldId="team">
                    <TextInput id="team" list="team-options" value={teamRef} onChange={(_e, v) => setTeamRef(v)} isRequired />
                    <datalist id="team-options">
                      {teams.items.map((t) => (
                        <option key={t.metadata.name} value={t.metadata.name} />
                      ))}
                    </datalist>
                  </FormGroup>
                  <FormGroup label="Project" fieldId="project">
                    <TextInput id="project" list="project-options" value={projectRef} onChange={(_e, v) => setProjectRef(v)} />
                    <datalist id="project-options">
                      {projects.items.map((t) => (
                        <option key={t.metadata.name} value={t.metadata.name} />
                      ))}
                    </datalist>
                  </FormGroup>
                  <FormGroup label="Platform Openshift" fieldId="platform">
                    <TextInput id="platform" list="platform-options" value={platformRef} onChange={(_e, v) => setPlatformRef(v)} />
                    <datalist id="platform-options">
                      {platforms.items.map((t) => (
                        <option key={t.metadata.name} value={t.metadata.name} />
                      ))}
                    </datalist>
                  </FormGroup>
                </>
              )}

              {type === 'persona' && (
                <>
                  <FormGroup label="RBAC" isRequired fieldId="rbac">
                    <TextInput id="rbac" list="rbac-options" value={rbacRef} onChange={(_e, v) => setRbacRef(v)} isRequired />
                    <datalist id="rbac-options">
                      {rbacs.items.map((t) => (
                        <option key={t.metadata.name} value={t.metadata.name} />
                      ))}
                    </datalist>
                  </FormGroup>
                  <FormGroup label="Type" isRequired fieldId="persona-type">
                    <TextInput id="persona-type" value={personaType} onChange={(_e, v) => setPersonaType(v)} isRequired />
                  </FormGroup>
                </>
              )}

              {type === 'rbac' && (
                <FormGroup label="Config" isRequired fieldId="rbac-config">
                  <TextInput id="rbac-config" value={rbacConfig} onChange={(_e, v) => setRbacConfig(v)} isRequired />
                </FormGroup>
              )}

              {type === 'vault' && (
                <FormGroup label="RBAC Config" isRequired fieldId="vault-rbac-config">
                  <TextInput id="vault-rbac-config" value={rbacConfig} onChange={(_e, v) => setRbacConfig(v)} isRequired />
                </FormGroup>
              )}

              {type === 'vaultkv' && (
                <FormGroup label="Vault" isRequired fieldId="vault-ref">
                  <TextInput id="vault-ref" list="vault-options" value={vaultRef} onChange={(_e, v) => setVaultRef(v)} isRequired />
                  <datalist id="vault-options">
                    {vaults.items.map((t) => (
                      <option key={t.metadata.name} value={t.metadata.name} />
                    ))}
                  </datalist>
                </FormGroup>
              )}

              {type === 'aaporg' && (
                <FormGroup label="AAP Config" isRequired fieldId="aap-config">
                  <TextInput id="aap-config" value={aapConfig} onChange={(_e, v) => setAapConfig(v)} isRequired />
                </FormGroup>
              )}

              {type === 'quayorg' && (
                <FormGroup label="Quay Config" isRequired fieldId="quay-config">
                  <TextInput id="quay-config" value={quayConfig} onChange={(_e, v) => setQuayConfig(v)} isRequired />
                </FormGroup>
              )}

              {type === 'migration' && (
                <>
                  <FormGroup label="Source" fieldId="source">
                    <TextInput id="source" value={source} onChange={(_e, v) => setSource(v)} />
                  </FormGroup>
                  <FormGroup label="VM Name" isRequired fieldId="vm">
                    <TextInput id="vm" value={vmName} onChange={(_e, v) => setVmName(v)} isRequired />
                  </FormGroup>
                  <FormGroup label="CloudOSO" isRequired fieldId="cloudoso">
                    <TextInput
                      id="cloudoso"
                      list="cloudoso-options"
                      value={cloudosoRef}
                      onChange={(_e, v) => setCloudosoRef(v)}
                      isRequired
                    />
                    <datalist id="cloudoso-options">
                      {cloudosos.items.map((t) => (
                        <option key={t.metadata.name} value={t.metadata.name} />
                      ))}
                    </datalist>
                  </FormGroup>
                </>
              )}

              <ActionGroup>
                <Button variant="primary" type="submit" isLoading={submitting} isDisabled={!canSubmit()}>
                  Create
                </Button>
                <Button variant="link" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </ActionGroup>
            </Form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
