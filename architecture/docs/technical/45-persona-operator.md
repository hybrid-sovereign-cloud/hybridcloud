# Persona Operator

## Overview

The Persona operator manages `Persona` CRs that decouple RBAC persona assignments from the Entity operator. Each Persona binds a named RBAC role type to an Rbac CR (Keycloak group) within an entity namespace.

## CRD

```yaml
apiVersion: hybridsovereign.redhat/v1alpha1
kind: Persona
metadata:
  name: test-entity-admin
  namespace: entity-acme-corp
spec:
  rbac: acme-entity-admins    # Reference to Rbac CR
  type: entityAdmin            # One of the 14 RBAC level types
```

## Persona Types

| Type | Description |
|------|-------------|
| entityAdmin | Full namespace admin |
| auditor | Read-only access to all CRs |
| cloudOSOAdmin | Create/edit/delete CloudOSO CRs |
| cloudOSOView | View CloudOSO CRs |
| cloudAWSAdmin | Create/edit/delete CloudAWS CRs |
| cloudAWSView | View CloudAWS CRs |
| platformOpenshiftAdmin | Create/edit/delete PlatformOpenshift CRs |
| platformOpenshiftView | View PlatformOpenshift CRs |
| teamAdmin | Create/edit/delete Team CRs |
| teamView | View Team CRs |
| projectAdmin | Create/edit/delete Project CRs |
| projectView | View Project CRs |
| assignmentAdmin | Create/edit/delete Assignment CRs |
| identityAdmin | Create/view RBAC CRs |

## Architecture

- **Operator**: Ansible-based, deployed in `sovereign-cloud` namespace on the services cluster
- **Image**: `quay.example.com/hybrid-sovereign/persona-operator`
- **Helm Chart**: `oci://quay.example.com/hybrid-sovereign/persona-operator`
- **ArgoCD**: Deployed via `persona-operator` Application targeting services cluster

## Reconciliation Flow

1. Persona CR created in entity namespace
2. Operator validates `rbac` and `type` fields
3. Operator marks CR as `reconciling` and emits `PersonaCreateRequested` event
4. EDA picks up the event and:
   - Reads the referenced Rbac CR to get the Keycloak group
   - Validates the group exists
   - Patches the Persona status to `ready` with the Keycloak group info

## Status Fields

| Field | Type | Description |
|-------|------|-------------|
| status | string | ready, reconciling, failed, deleting |
| ready | boolean | True when provisioning is complete |
| keycloakGroup | string | Resolved Keycloak group path from Rbac CR |
| observedGeneration | int-or-string | Last processed generation |
| edaJobs | array | EDA execution history |
| conditions | array | Standard Kubernetes conditions |

## Relationship to Entity

The Entity operator's `spec.namespaceRbac` previously handled RBAC bindings. With the Persona operator, this responsibility is split out. Persona CRs can be created and managed independently, enabling more granular RBAC management without modifying Entity CRs.
