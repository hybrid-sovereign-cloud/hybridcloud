import React, { useEffect, useState } from 'react';
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
  FormSelect,
  FormSelectOption,
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

const PERSONA_TYPES = [
  'entityAdmin',
  'identityAdmin',
  'auditor',
  'teamAdmin',
  'teamView',
  'projectAdmin',
  'projectView',
  'assignmentAdmin',
  'platformOpenshiftAdmin',
  'platformOpenshiftView',
  'cloudOSOAdmin',
  'cloudOSOView',
  'cloudAWSAdmin',
  'cloudAWSView',
];

function RefSelect({
  id,
  label,
  value,
  onChange,
  options,
  isRequired,
  placeholder = 'Select…',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  isRequired?: boolean;
  placeholder?: string;
}): React.ReactElement {
  return (
    <FormGroup label={label} isRequired={isRequired} fieldId={id}>
      <FormSelect id={id} value={value} onChange={(_e, v) => onChange(v)} isRequired={isRequired}>
        <FormSelectOption value="" label={placeholder} isDisabled={isRequired} />
        {options.map((o) => (
          <FormSelectOption key={o.value} value={o.value} label={o.label} />
        ))}
      </FormSelect>
    </FormGroup>
  );
}

export function SelfServiceFormPage({ namespace }: SelfServiceFormPageProps): React.ReactElement {
  const { formType } = useParams<{ formType: FormType }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamRef, setTeamRef] = useState('');
  const [projectRef, setProjectRef] = useState('');
  const [platformRef, setPlatformRef] = useState('');
  const [cloudAwsRef, setCloudAwsRef] = useState('');
  const [argoEnabled, setArgoEnabled] = useState(true);
  const [rbacRef, setRbacRef] = useState('');
  const [personaType, setPersonaType] = useState('entityAdmin');
  const [rbacConfig, setRbacConfig] = useState('');
  const [vaultRef, setVaultRef] = useState('');
  const [cloudosoRef, setCloudosoRef] = useState('');
  const [vmName, setVmName] = useState('');
  const [source, setSource] = useState('vmware');
  const [aapConfig, setAapConfig] = useState('');
  const [quayConfig, setQuayConfig] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const type = (formType ?? 'team') as FormType;
  const title = FORM_TITLES[type] ?? 'Create Resource';
  const kind = FORM_KINDS[type];

  const teams = useK8sResourceList<K8sResource>('Team', { namespace, enabled: type === 'assignment' });
  const projects = useK8sResourceList<K8sResource>('Project', { namespace, enabled: type === 'assignment' });
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', {
    namespace,
    enabled: type === 'assignment',
  });
  const cloudAwss = useK8sResourceList<K8sResource>('CloudAWS', {
    namespace,
    enabled: type === 'assignment',
  });
  const vaults = useK8sResourceList<K8sResource>('Vault', { namespace, enabled: type === 'vaultkv' });
  const cloudosos = useK8sResourceList<K8sResource>('CloudOSO', {
    namespace,
    enabled: type === 'migration',
  });
  const rbacs = useK8sResourceList<K8sResource>('Rbac', {
    namespace,
    enabled: type === 'persona' || type === 'vaultkv',
  });
  const rbacConfigs = useK8sResourceList<K8sResource>('RbacConfig', {
    enabled: type === 'team' || type === 'rbac' || type === 'vault',
  });
  const aapConfigs = useK8sResourceList<K8sResource>('AAPConfig', { enabled: type === 'aaporg' });
  const quayConfigs = useK8sResourceList<K8sResource>('QuayConfig', { enabled: type === 'quayorg' });

  const names = (items: K8sResource[]) => items.map((i) => ({ value: i.metadata.name, label: i.metadata.name }));

  // Auto-select first option when lists load
  useEffect(() => {
    if (type === 'team' || type === 'rbac' || type === 'vault') {
      if (!rbacConfig && rbacConfigs.items[0]) setRbacConfig(rbacConfigs.items[0].metadata.name);
    }
    if (type === 'aaporg' && !aapConfig && aapConfigs.items[0]) setAapConfig(aapConfigs.items[0].metadata.name);
    if (type === 'quayorg' && !quayConfig && quayConfigs.items[0]) setQuayConfig(quayConfigs.items[0].metadata.name);
    if (type === 'assignment' && !teamRef && teams.items[0]) setTeamRef(teams.items[0].metadata.name);
    if (type === 'persona' && !rbacRef && rbacs.items[0]) setRbacRef(rbacs.items[0].metadata.name);
    if (type === 'vaultkv' && !vaultRef && vaults.items[0]) setVaultRef(vaults.items[0].metadata.name);
    if (type === 'migration' && !cloudosoRef && cloudosos.items[0]) setCloudosoRef(cloudosos.items[0].metadata.name);
  }, [
    type,
    rbacConfigs.items,
    aapConfigs.items,
    quayConfigs.items,
    teams.items,
    rbacs.items,
    vaults.items,
    cloudosos.items,
    rbacConfig,
    aapConfig,
    quayConfig,
    teamRef,
    rbacRef,
    vaultRef,
    cloudosoRef,
  ]);

  const buildSpec = (): Record<string, unknown> => {
    switch (type) {
      case 'team':
        return {
          rbacConfig: rbacConfig || 'rhbk-services',
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
          aws: cloudAwsRef || undefined,
        };
      case 'cloudoso':
        return { vaultPath: 'oso/accounts/shc_admin', baseDomain: process.env.LAB_DOMAIN || '' };
      case 'cloudaws':
        return { account: '', vaultPath: '', baseDomain: process.env.LAB_DOMAIN || '' };
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
    if (type === 'persona' && (!rbacRef || !personaType)) return false;
    if (type === 'vaultkv' && !vaultRef) return false;
    if (type === 'migration' && (!vmName || !cloudosoRef)) return false;
    if ((type === 'team' || type === 'vault' || type === 'rbac') && !rbacConfig) return false;
    if (type === 'aaporg' && !aapConfig) return false;
    if (type === 'quayorg' && !quayConfig) return false;
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
                <>
                  <RefSelect
                    id="rbac-config"
                    label="RBAC Config"
                    value={rbacConfig}
                    onChange={setRbacConfig}
                    options={names(rbacConfigs.items)}
                    isRequired
                  />
                  <FormGroup label="Enable Argo CD" fieldId="argo">
                    <Switch
                      id="argo"
                      isChecked={argoEnabled}
                      onChange={(_e, checked) => setArgoEnabled(checked)}
                    />
                  </FormGroup>
                </>
              )}

              {type === 'assignment' && (
                <>
                  <RefSelect id="team" label="Team" value={teamRef} onChange={setTeamRef} options={names(teams.items)} isRequired />
                  <RefSelect
                    id="project"
                    label="Project"
                    value={projectRef}
                    onChange={setProjectRef}
                    options={names(projects.items)}
                    placeholder="Optional"
                  />
                  <RefSelect
                    id="platform"
                    label="Platform Openshift"
                    value={platformRef}
                    onChange={setPlatformRef}
                    options={names(platforms.items)}
                    placeholder="Optional"
                  />
                  <RefSelect
                    id="cloudaws"
                    label="Cloud AWS"
                    value={cloudAwsRef}
                    onChange={setCloudAwsRef}
                    options={names(cloudAwss.items)}
                    placeholder="Optional"
                  />
                </>
              )}

              {type === 'persona' && (
                <>
                  <RefSelect id="rbac" label="RBAC" value={rbacRef} onChange={setRbacRef} options={names(rbacs.items)} isRequired />
                  <RefSelect
                    id="persona-type"
                    label="Type"
                    value={personaType}
                    onChange={setPersonaType}
                    options={PERSONA_TYPES.map((t) => ({ value: t, label: t }))}
                    isRequired
                  />
                </>
              )}

              {type === 'rbac' && (
                <RefSelect
                  id="rbac-config"
                  label="Config"
                  value={rbacConfig}
                  onChange={setRbacConfig}
                  options={names(rbacConfigs.items)}
                  isRequired
                />
              )}

              {type === 'vault' && (
                <RefSelect
                  id="vault-rbac-config"
                  label="RBAC Config"
                  value={rbacConfig}
                  onChange={setRbacConfig}
                  options={names(rbacConfigs.items)}
                  isRequired
                />
              )}

              {type === 'vaultkv' && (
                <RefSelect id="vault-ref" label="Vault" value={vaultRef} onChange={setVaultRef} options={names(vaults.items)} isRequired />
              )}

              {type === 'aaporg' && (
                <RefSelect
                  id="aap-config"
                  label="AAP Config"
                  value={aapConfig}
                  onChange={setAapConfig}
                  options={names(aapConfigs.items)}
                  isRequired
                />
              )}

              {type === 'quayorg' && (
                <RefSelect
                  id="quay-config"
                  label="Quay Config"
                  value={quayConfig}
                  onChange={setQuayConfig}
                  options={names(quayConfigs.items)}
                  isRequired
                />
              )}

              {type === 'migration' && (
                <>
                  <RefSelect
                    id="source"
                    label="Source"
                    value={source}
                    onChange={setSource}
                    options={[
                      { value: 'vmware', label: 'VMware' },
                      { value: 'ovirt', label: 'oVirt' },
                      { value: 'openstack', label: 'OpenStack' },
                    ]}
                    isRequired
                  />
                  <FormGroup label="VM Name" isRequired fieldId="vm">
                    <TextInput id="vm" value={vmName} onChange={(_e, v) => setVmName(v)} isRequired />
                  </FormGroup>
                  <RefSelect
                    id="cloudoso"
                    label="CloudOSO"
                    value={cloudosoRef}
                    onChange={setCloudosoRef}
                    options={names(cloudosos.items)}
                    isRequired
                  />
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
