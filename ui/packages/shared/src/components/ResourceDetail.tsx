import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Label,
  Modal,
  ModalVariant,
  Spinner,
  Switch,
  Tab,
  Tabs,
  TabTitleText,
  TextInput,
} from '@patternfly/react-core';
import { ArrowLeftIcon, SyncAltIcon, TrashIcon } from '@patternfly/react-icons';
import {
  deleteDashboardResource,
  forceReconcile,
  updateDashboardResource,
  useK8sResource,
  useK8sResourceList,
} from '../hooks/k8s';
import { HybridSovereignKind, K8sResource } from '../types';
import { PageHeader } from './PageHeader';
import { StatusBadge } from './StatusBadge';

export interface ResourceDetailProps {
  kind: HybridSovereignKind;
  name: string;
  namespace: string;
  parentTitle: string;
  parentPath: string;
  onBack: () => void;
  onDeleted?: () => void;
}

function formatValue(val: unknown): React.ReactNode {
  if (val === null || val === undefined || val === '') {
    return <span className="sc-text-muted">—</span>;
  }
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') {
    return <code style={{ fontSize: '0.8125rem' }}>{JSON.stringify(val)}</code>;
  }
  const str = String(val);
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return (
      <a href={str} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
        {str}
      </a>
    );
  }
  return str;
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): [string, unknown][] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return flattenObject(v as Record<string, unknown>, key);
    }
    return [[key, v] as [string, unknown]];
  });
}

function FieldGrid({ data }: { data: Record<string, unknown> }): React.ReactElement {
  const pairs = flattenObject(data);
  if (pairs.length === 0) {
    return <p className="sc-text-muted">No data available.</p>;
  }
  return (
    <div className="sc-fields">
      {pairs.map(([label, val]) => (
        <div key={label} className="sc-fields__row">
          <div className="sc-fields__label">{label}</div>
          <div className="sc-fields__value">{formatValue(val)}</div>
        </div>
      ))}
    </div>
  );
}

function ConditionsTab({ item }: { item: K8sResource }): React.ReactElement {
  const conditions = (item.status as { conditions?: Array<Record<string, string>> } | undefined)
    ?.conditions;
  if (!conditions?.length) {
    return <p className="sc-text-muted">No conditions reported.</p>;
  }
  return (
    <div className="sc-conditions">
      {conditions.map((c, i) => {
        const isTrue = c.status === 'True';
        const color = c.type === 'Ready' ? (isTrue ? 'green' : 'red') : c.type === 'Failure' ? 'red' : 'blue';
        return (
          <div key={`${c.type}-${i}`} className="sc-condition">
            <Label color={color as 'green' | 'red' | 'blue'} isCompact>
              {c.type}
            </Label>
            <div>
              <div className="sc-condition__type">{isTrue ? 'True' : c.status || 'Unknown'}</div>
              {c.message && <div className="sc-condition__message">{c.message}</div>}
              {c.reason && (
                <div className="sc-condition__message">
                  Reason: <code>{c.reason}</code>
                </div>
              )}
            </div>
            {c.lastTransitionTime && (
              <div className="sc-condition__time">{new Date(c.lastTransitionTime).toLocaleString()}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function names(items: K8sResource[]): string[] {
  return items.map((i) => i.metadata.name).filter(Boolean);
}

function SpecEditor({
  kind,
  namespace,
  item,
  onSaved,
}: {
  kind: HybridSovereignKind;
  namespace: string;
  item: K8sResource;
  onSaved: () => void;
}): React.ReactElement {
  const spec = (item.spec ?? {}) as Record<string, unknown>;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Team
  const [istio, setIstio] = useState(Boolean((spec.features as { istio?: boolean } | undefined)?.istio));
  const [argo, setArgo] = useState(Boolean((spec.features as { argo?: boolean } | undefined)?.argo));

  // Assignment
  const [team, setTeam] = useState(typeof spec.team === 'string' ? spec.team : '');
  const [projects, setProjects] = useState(
    Array.isArray(spec.projects) ? (spec.projects as string[]).join(', ') : '',
  );
  const [openshift, setOpenshift] = useState(typeof spec.openshift === 'string' ? spec.openshift : '');

  const teams = useK8sResourceList<K8sResource>('Team', {
    namespace,
    enabled: kind === 'Assignment',
  });
  const projectList = useK8sResourceList<K8sResource>('Project', {
    namespace,
    enabled: kind === 'Assignment',
  });
  const platforms = useK8sResourceList<K8sResource>('PlatformOpenshift', {
    namespace,
    enabled: kind === 'Assignment',
  });

  useEffect(() => {
    const s = (item.spec ?? {}) as Record<string, unknown>;
    setIstio(Boolean((s.features as { istio?: boolean } | undefined)?.istio));
    setArgo(Boolean((s.features as { argo?: boolean } | undefined)?.argo));
    setTeam(typeof s.team === 'string' ? s.team : '');
    setProjects(Array.isArray(s.projects) ? (s.projects as string[]).join(', ') : '');
    setOpenshift(typeof s.openshift === 'string' ? s.openshift : '');
  }, [item]);

  const save = async (nextSpec: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await updateDashboardResource(kind, item.metadata.name, namespace, { spec: nextSpec });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (kind === 'Team') {
    return (
      <Form className="sc-form" onSubmit={(e) => e.preventDefault()}>
        {error && (
          <Alert variant="danger" title="Update failed" isInline style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        <FormGroup label="Istio" fieldId="team-istio">
          <Switch id="team-istio" isChecked={istio} onChange={(_e, v) => setIstio(v)} label={istio ? 'Enabled' : 'Disabled'} />
        </FormGroup>
        <FormGroup label="Argo CD" fieldId="team-argo">
          <Switch id="team-argo" isChecked={argo} onChange={(_e, v) => setArgo(v)} label={argo ? 'Enabled' : 'Disabled'} />
        </FormGroup>
        <Button
          variant="primary"
          isDisabled={saving}
          onClick={() => save({ features: { istio, argo } })}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Form>
    );
  }

  if (kind === 'Assignment') {
    return (
      <Form className="sc-form" onSubmit={(e) => e.preventDefault()}>
        {error && (
          <Alert variant="danger" title="Update failed" isInline style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        <FormGroup label="Team" fieldId="asg-team" isRequired>
          <FormSelect id="asg-team" value={team} onChange={(_e, v) => setTeam(v)} aria-label="Team">
            <FormSelectOption value="" label="Select a team" />
            {names(teams.items).map((n) => (
              <FormSelectOption key={n} value={n} label={n} />
            ))}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Projects (comma-separated)" fieldId="asg-projects">
          <TextInput
            id="asg-projects"
            value={projects}
            onChange={(_e, v) => setProjects(v)}
            list="asg-project-options"
          />
          <datalist id="asg-project-options">
            {names(projectList.items).map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </FormGroup>
        <FormGroup label="Platform Openshift" fieldId="asg-openshift">
          <FormSelect
            id="asg-openshift"
            value={openshift}
            onChange={(_e, v) => setOpenshift(v)}
            aria-label="Platform Openshift"
          >
            <FormSelectOption value="" label="None" />
            {names(platforms.items).map((n) => (
              <FormSelectOption key={n} value={n} label={n} />
            ))}
          </FormSelect>
        </FormGroup>
        <Button
          variant="primary"
          isDisabled={saving || !team}
          onClick={() =>
            save({
              team,
              projects: projects
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean),
              ...(openshift ? { openshift } : {}),
            })
          }
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Form>
    );
  }

  return (
    <>
      <p className="sc-text-muted" style={{ marginBottom: '1rem' }}>
        Spec fields for this kind are shown read-only. Use Reconcile Now after changing the CR via YAML/API.
      </p>
      <FieldGrid data={spec} />
    </>
  );
}

export function ResourceDetail({
  kind,
  name,
  namespace,
  parentTitle,
  parentPath,
  onBack,
  onDeleted,
}: ResourceDetailProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string | number>(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { resource, loading, error, refresh } = useK8sResource<K8sResource>(kind, name, {
    namespace,
  });

  const readyStatus =
    resource?.status?.status ||
    (resource?.status?.ready === true ? 'ready' : resource?.status?.ready === false ? 'failed' : 'pending');

  const overviewFields = useMemo(() => {
    if (!resource) return {};
    const statusRaw = { ...(resource.status ?? {}) } as Record<string, unknown>;
    delete statusRaw.conditions;
    delete statusRaw.edaJobs;
    return {
      Name: resource.metadata.name,
      Namespace: resource.metadata.namespace ?? namespace,
      ...(resource.metadata.labels ? { Labels: resource.metadata.labels } : {}),
      ...statusRaw,
    };
  }, [resource, namespace]);

  const handleReconcile = async () => {
    if (reconciling || cooldown || !namespace || !name) return;
    setReconciling(true);
    setActionError(null);
    try {
      await forceReconcile(kind, name, namespace);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 10000);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reconcile failed');
    } finally {
      setReconciling(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      await deleteDashboardResource(kind, name, namespace);
      setConfirmDelete(false);
      onDeleted?.();
      onBack();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !resource) {
    return <Spinner aria-label={`Loading ${kind}`} />;
  }

  if (error && !resource) {
    return (
      <Alert variant="danger" title={`Unable to load ${kind}`} isInline>
        {error.message}
      </Alert>
    );
  }

  if (!resource) {
    return (
      <Alert variant="warning" title="Resource not found" isInline>
        {kind} <strong>{name}</strong> was not found in {namespace}.
      </Alert>
    );
  }

  return (
    <div className="sc-detail">
      <PageHeader
        title={name}
        subtitle={`${kind} in ${namespace}`}
        breadcrumbs={[
          { label: 'Sovereign Cloud' },
          { label: parentTitle, to: parentPath },
          { label: name },
        ]}
        actions={
          <>
            <Button variant="link" icon={<ArrowLeftIcon />} onClick={onBack}>
              Back to {parentTitle}
            </Button>
            <Button
              variant="secondary"
              icon={reconciling ? <Spinner size="md" /> : <SyncAltIcon />}
              isDisabled={reconciling || cooldown}
              onClick={handleReconcile}
            >
              {cooldown ? 'Reconcile queued' : 'Reconcile now'}
            </Button>
            <Button variant="secondary" icon={<SyncAltIcon />} onClick={refresh}>
              Refresh
            </Button>
            <Button variant="danger" icon={<TrashIcon />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="sc-detail__badges" style={{ marginBottom: '1rem' }}>
        <StatusBadge
          status={resource.status?.status}
          ready={resource.status?.ready}
          message={resource.status?.message}
          lastTransition={resource.status?.lastReconciledAt}
        />
        <Label color="grey" isCompact>
          {kind}
        </Label>
        {resource.status?.lastReconciledAt && (
          <span className="sc-text-muted" style={{ fontSize: '0.75rem' }}>
            Reconciled {new Date(resource.status.lastReconciledAt).toLocaleString()}
          </span>
        )}
        <span className="sc-text-muted" style={{ fontSize: '0.75rem' }}>
          Sync: {readyStatus}
        </span>
      </div>

      {actionError && (
        <Alert
          variant="danger"
          title="Action failed"
          isInline
          style={{ marginBottom: '1rem' }}
          actionClose={<Button variant="plain" onClick={() => setActionError(null)} aria-label="Close" />}
        >
          {actionError}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(_e, k) => setActiveTab(k)}
        className="sc-detail__tabs"
      >
        <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: '1rem' }}>
            <FieldGrid data={overviewFields} />
          </div>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Configuration</TabTitleText>}>
          <div style={{ paddingTop: '1rem' }}>
            <SpecEditor kind={kind} namespace={namespace} item={resource} onSaved={refresh} />
          </div>
        </Tab>
        <Tab eventKey={2} title={<TabTitleText>Events / Conditions</TabTitleText>}>
          <div style={{ paddingTop: '1rem' }}>
            <ConditionsTab item={resource} />
          </div>
        </Tab>
        <Tab eventKey={3} title={<TabTitleText>YAML</TabTitleText>}>
          <div style={{ paddingTop: '1rem' }}>
            <pre className="sc-yaml">{JSON.stringify(resource, null, 2)}</pre>
          </div>
        </Tab>
      </Tabs>

      <Modal
        variant={ModalVariant.small}
        title={`Delete ${kind}?`}
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        actions={[
          <Button key="confirm" variant="danger" isDisabled={deleting} onClick={handleDelete}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>,
          <Button key="cancel" variant="link" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>,
        ]}
      >
        This will permanently delete <strong>{name}</strong> from namespace <strong>{namespace}</strong>.
      </Modal>
    </div>
  );
}
