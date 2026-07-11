# Entity Operator — Technical Reference

**Version:** refactorrbac v1.0
**Cluster:** Services
**Namespace:** `sovereign-cloud`
**CRD group:** `hybridsovereign.redhat`

## CRDs

### Entity

```yaml
apiVersion: hybridsovereign.redhat/v1alpha1
kind: Entity
metadata:
  name: <entity-name>
  namespace: sovereign-cloud
spec:
  description: "<human description>"
  billingID: "<billing-ref>"
  websiteLink: "<url>"
  namespaceRbac:
    entityAdmin: [<list of Rbac CR names>]
    auditor: [...]
    cloudOSOAdmin: [...]
    cloudOSOView: [...]
    cloudAWSAdmin: [...]
    cloudAWSView: [...]
    platformOpenshiftAdmin: [...]
    platformOpenshiftView: [...]
    teamAdmin: [...]
    teamView: [...]
    projectAdmin: [...]
    projectView: [...]
    assignmentAdmin: [...]
    identityAdmin: [...]
```

Each `namespaceRbac` key maps to a list of **Rbac CR names** in the entity namespace.
The operator resolves each Rbac CR's `status.group` (the Keycloak group path) at reconcile
time and creates the matching K8s `RoleBinding`.

### Status fields

| Field | Description |
|---|---|
| `entity` | Provisioned namespace name (`entity-<name>`) |
| `description` | Mirror of spec.description |
| `openshiftConsoleURL` | Auto-discovered console URL |
| `billingID` | Mirror of spec.billingID |
| `websiteLink` | Mirror of spec.websiteLink |

## 14 Named Roles

| spec key | K8s Role name | CRUD resources | Read-only resources |
|---|---|---|---|
| entityAdmin | entity-admin | all CRs | — |
| auditor | auditor | — | all CRs |
| cloudOSOAdmin | cloudoso-admin | cloudosos | rbacs |
| cloudOSOView | cloudoso-view | — | cloudosos, rbacs |
| cloudAWSAdmin | cloudaws-admin | cloudawss | rbacs |
| cloudAWSView | cloudaws-view | — | cloudawss, rbacs |
| platformOpenshiftAdmin | platformopenshift-admin | platformopenshifts | rbacs |
| platformOpenshiftView | platformopenshift-view | — | platformopenshifts, rbacs |
| teamAdmin | team-admin | teams | assignments, rbacs |
| teamView | team-view | — | teams, assignments, rbacs |
| projectAdmin | project-admin | projects | assignments, rbacs |
| projectView | project-view | — | projects, assignments, rbacs |
| assignmentAdmin | assignment-admin | assignments | rbacs |
| identityAdmin | identity-admin | rbacs | — |

CRUD verbs: `get, list, watch, create, update, patch, delete`.
Read-only verbs: `get, list, watch`.
All resources also have `*/status` sub-resource with read-only access.

## Reconciliation Flow

```
Entity CR created/updated
  → namespace_roles.yml
      Phase 1: Build K8s Role rules from vars/main.yml matrix
              → k8s state: present (Role per present namespaceRbac key)
      Phase 2: Dispatch async Rbac CR lookups (poll:0, parallel)
              → Collect group paths from status.group
      Phase 3: Create RoleBindings with resolved group-path subjects
```

## Performance at Scale

See `architecture/hardeningcheck/entity-operator.md` for full scaling guidance.

**Key pattern**: Phase 2 dispatches all Rbac CR name→group-path lookups simultaneously
using `async: 30, poll: 0`. At 10,000 Rbac CRs/entity, resolution completes in
O(1) clock time (limited only by kube-apiserver response, not serial loop delay).

## Operator Placement

`hybridsovereign.redhat` API group → services cluster only.
Never deploy the Entity operator on the central cluster.

## Helm chart values

| Key | Default | Purpose |
|---|---|---|
| `samples.enabled` | `true` | Deploy sample Entity CRs (acme-corp, globex-industries, waynetech) |
| `replicas` | `1` | Operator pod count (set 2 for HA) |
| `resources.limits.cpu` | `500m` | Increase for large-scale tenants |
| `resources.limits.memory` | `1Gi` | Increase for large-scale tenants |
