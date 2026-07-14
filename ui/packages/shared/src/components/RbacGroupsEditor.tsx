import React, { useState } from 'react';
import {
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Button,
  Modal,
  ModalVariant,
  Alert,
  ChipGroup,
  Chip,
  Title,
} from '@patternfly/react-core';

export interface RbacGroupsEditorProps {
  /** Current Keycloak group names on the CR spec.toolRbac field */
  value: string[];
  /** Available groups from RbacConfig / Keycloak */
  availableGroups: string[];
  /** Called after user confirms PATCH */
  onSave: (groups: string[]) => Promise<void>;
  /** Field label shown in the form */
  label?: string;
  disabled?: boolean;
}

/** Multi-select Keycloak group picker for Layer-2 tool RBAC (CloudOSO, CloudAWS, Vault, etc.) */
export function RbacGroupsEditor({
  value,
  availableGroups,
  onSave,
  label = 'Tool RBAC Groups',
  disabled = false,
}: RbacGroupsEditorProps): React.ReactElement {
  const [selected, setSelected] = useState<string[]>(value);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unselected = availableGroups.filter((g) => !selected.includes(g));

  const addGroup = (group: string) => {
    if (group && !selected.includes(group)) {
      setSelected([...selected, group]);
    }
  };

  const removeGroup = (group: string) => {
    setSelected(selected.filter((g) => g !== group));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(selected);
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tool RBAC');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Form>
        <FormGroup label={label} fieldId="rbac-groups">
          <ChipGroup>
            {selected.map((group) => (
              <Chip key={group} onClick={() => removeGroup(group)} isReadOnly={disabled}>
                {group}
              </Chip>
            ))}
          </ChipGroup>
          {!disabled && unselected.length > 0 && (
            <FormSelect
              aria-label="Add RBAC group"
              onChange={(_e, val) => addGroup(val)}
              value=""
            >
              <FormSelectOption key="placeholder" value="" label="Add group…" />
              {unselected.map((g) => (
                <FormSelectOption key={g} value={g} label={g} />
              ))}
            </FormSelect>
          )}
        </FormGroup>
        {!disabled && (
          <Button
            variant="primary"
            isDisabled={JSON.stringify(selected) === JSON.stringify(value)}
            onClick={() => setConfirmOpen(true)}
          >
            Update tool RBAC
          </Button>
        )}
      </Form>

      <Modal
        variant={ModalVariant.small}
        title="Confirm tool RBAC change"
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        actions={[
          <Button key="confirm" variant="primary" isLoading={saving} onClick={handleSave}>
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>,
        ]}
      >
        {error && (
          <Alert variant="danger" title="Update failed" isInline style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        <Title headingLevel="h4" size="md">
          Groups to apply
        </Title>
        <ul>
          {selected.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
