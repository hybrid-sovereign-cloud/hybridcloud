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
  Card,
  CardBody,
  FormSelect,
  FormSelectOption,
} from '@patternfly/react-core';
import { PageHeader, useK8sResourceList, K8sResource } from '@hybridsovereign/shared';

type CreateKind = 'entity' | 'persona';

const TITLES: Record<CreateKind, string> = {
  entity: 'Create Entity',
  persona: 'Create Persona',
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

export function CreateResourcePage(): React.ReactElement {
  const { kind } = useParams<{ kind: CreateKind }>();
  const navigate = useNavigate();
  const type = (kind ?? 'entity') as CreateKind;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [billingID, setBillingID] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [entityName, setEntityName] = useState('');
  const [rbac, setRbac] = useState('');
  const [personaType, setPersonaType] = useState('entityAdmin');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const entities = useK8sResourceList<K8sResource>('Entity', { enabled: type === 'persona' });
  const entityNs = entityName ? `entity-${entityName}` : '';
  const rbacs = useK8sResourceList<K8sResource>('Rbac', {
    namespace: entityNs || 'default',
    enabled: type === 'persona' && !!entityName,
  });

  useEffect(() => {
    if (type === 'persona' && !entityName && entities.items[0]) {
      setEntityName(entities.items[0].metadata.name);
    }
  }, [type, entityName, entities.items]);

  useEffect(() => {
    if (type === 'persona' && rbacs.items[0] && !rbacs.items.some((r) => r.metadata.name === rbac)) {
      setRbac(rbacs.items[0].metadata.name);
    }
  }, [type, rbacs.items, rbac]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      if (type === 'entity') {
        const resp = await fetch('/api/entities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name,
            spec: {
              description,
              billingID,
              ...(websiteLink ? { websiteLink } : {}),
            },
          }),
        });
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.message || resp.statusText);
        }
        setResult({ ok: true, message: `Entity "${name}" created. Namespace provisioning started.` });
        setTimeout(() => navigate('/entities'), 1200);
      } else {
        const resp = await fetch(`/api/entities/${encodeURIComponent(entityName)}/personas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ personaName: name, rbac, type: personaType }),
        });
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.message || resp.statusText);
        }
        setResult({ ok: true, message: `Persona "${name}" created in entity-${entityName}.` });
        setTimeout(() => navigate('/personas'), 1200);
      }
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Submit failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const listPath = type === 'entity' ? '/entities' : '/personas';

  return (
    <>
      <PageHeader
        title={TITLES[type]}
        breadcrumbs={[
          { label: 'Sovereign Cloud' },
          { label: type === 'entity' ? 'Entities' : 'Personas', to: listPath },
          { label: 'Create' },
        ]}
      />
      {result && (
        <Alert variant={result.ok ? 'success' : 'danger'} isInline title={result.ok ? 'Submitted' : 'Failed'} className="sc-mb">
          {result.message}
        </Alert>
      )}
      <Card isCompact>
        <CardBody>
          <Form onSubmit={handleSubmit}>
            {type === 'persona' && (
              <FormGroup label="Entity" isRequired fieldId="entity">
                <FormSelect
                  id="entity"
                  value={entityName}
                  onChange={(_e, v) => {
                    setEntityName(v);
                    setRbac('');
                  }}
                  isRequired
                >
                  <FormSelectOption value="" label="Select entity…" isDisabled />
                  {entities.items.map((ent) => (
                    <FormSelectOption key={ent.metadata.name} value={ent.metadata.name} label={ent.metadata.name} />
                  ))}
                </FormSelect>
              </FormGroup>
            )}
            <FormGroup label="Name" isRequired fieldId="name">
              <TextInput id="name" value={name} onChange={(_e, v) => setName(v)} isRequired />
            </FormGroup>
            {type === 'entity' && (
              <>
                <FormGroup label="Description" isRequired fieldId="description">
                  <TextArea id="description" value={description} onChange={(_e, v) => setDescription(v)} isRequired />
                </FormGroup>
                <FormGroup label="Billing ID" isRequired fieldId="billing">
                  <TextInput id="billing" value={billingID} onChange={(_e, v) => setBillingID(v)} isRequired />
                </FormGroup>
                <FormGroup label="Website" fieldId="website">
                  <TextInput id="website" value={websiteLink} onChange={(_e, v) => setWebsiteLink(v)} />
                </FormGroup>
              </>
            )}
            {type === 'persona' && (
              <>
                <FormGroup label="RBAC" isRequired fieldId="rbac">
                  <FormSelect id="rbac" value={rbac} onChange={(_e, v) => setRbac(v)} isRequired>
                    <FormSelectOption value="" label={entityName ? 'Select RBAC…' : 'Select entity first'} isDisabled />
                    {rbacs.items.map((r) => (
                      <FormSelectOption key={r.metadata.name} value={r.metadata.name} label={r.metadata.name} />
                    ))}
                  </FormSelect>
                </FormGroup>
                <FormGroup label="Type" isRequired fieldId="ptype">
                  <FormSelect id="ptype" value={personaType} onChange={(_e, v) => setPersonaType(v)} isRequired>
                    {PERSONA_TYPES.map((t) => (
                      <FormSelectOption key={t} value={t} label={t} />
                    ))}
                  </FormSelect>
                </FormGroup>
              </>
            )}
            <ActionGroup>
              <Button
                type="submit"
                variant="primary"
                isLoading={submitting}
                isDisabled={
                  !name ||
                  (type === 'entity' && (!description || !billingID)) ||
                  (type === 'persona' && (!entityName || !rbac))
                }
              >
                Create
              </Button>
              <Button variant="link" onClick={() => navigate(listPath)}>
                Cancel
              </Button>
            </ActionGroup>
          </Form>
        </CardBody>
      </Card>
    </>
  );
}
