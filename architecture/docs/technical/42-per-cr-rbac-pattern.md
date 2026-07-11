# Per-CR RBAC Pattern

## Overview

Starting with feature `002-manage-tenancy-crs`, operators create fine-grained
Kubernetes `Role` and `RoleBinding` resources scoped to individual Custom Resources.
This allows Keycloak groups to have `get/list/watch` permissions on specific CRs
without seeing all CRs of that type.

## Affected CR Types

| CR Type | Spec Field | Role Name Pattern | Cleanup Method |
|---------|-----------|-------------------|----------------|
| `PlatformOpenshift` | `spec.clusterViewerRbac[]` | `platform-<cr-name>-viewer` | `platformopenshift_delete` finalizer role |
| `Team` | `spec.teamViewerRbac[]` | `<cr-name>-team-viewer` | `team_delete` finalizer role (label selector) |
| `Project` | `spec.projectViewerRbac[]` | `project-<cr-name>-viewer` | Owner reference GC (same namespace) |

## Role Structure

Each per-CR `Role` grants view access to the specific CR instance:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: project-my-project-viewer
  namespace: entity-acme-corp
  labels:
    app.kubernetes.io/managed-by: project-operator
    hybridsovereign.redhat/cr-name: my-project
rules:
  - apiGroups: ["hybridsovereign.redhat"]
    resources: ["projects"]
    resourceNames: ["my-project"]
    verbs: ["get", "list", "watch"]
```

## RoleBinding Structure

One `RoleBinding` per Keycloak group in the `*ViewerRbac` list:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: project-my-project-viewer-acme-corp-devs
  namespace: entity-acme-corp
  labels:
    app.kubernetes.io/managed-by: project-operator
    hybridsovereign.redhat/cr-name: my-project
subjects:
  - kind: Group
    apiGroup: rbac.authorization.k8s.io
    name: "acme-corp/acme-corp-devs"   # Keycloak group path
roleRef:
  kind: Role
  name: project-my-project-viewer
  apiGroup: rbac.authorization.k8s.io
```

## Operator ClusterRole Requirement

Operators that create per-CR Roles and RoleBindings need these permissions in
their `ClusterRole`:

```yaml
- apiGroups:
    - rbac.authorization.k8s.io
  resources:
    - roles
    - rolebindings
  verbs:
    - create
    - delete
    - get
    - list
    - patch
    - update
    - watch
```

This is required in: `team-operator-manager`, `platformopenshift-operator-manager`,
`project-operator-manager` ClusterRoles.

## Cleanup

### Team and PlatformOpenshift: Finalizer-Based

These operators have a `finalizer` role (`team_delete`, `platformopenshift_delete`)
that uses label selectors to delete all per-group `RoleBinding` resources:

```yaml
- name: Delete per-CR viewer RoleBindings
  kubernetes.core.k8s:
    state: absent
    api_version: rbac.authorization.k8s.io/v1
    kind: RoleBinding
    namespace: "{{ ansible_operator_meta.namespace }}"
    label_selectors:
      - "app.kubernetes.io/managed-by={{ operator_name }}"
      - "hybridsovereign.redhat/cr-name={{ ansible_operator_meta.name }}"
```

### Project: Owner Reference GC

`Project` operator resources are in the same namespace as the CR. The operator
proxy auto-injects owner references on creation. Kubernetes GC removes Role and
RoleBinding when the Project CR is deleted. No explicit finalizer role is needed.
See DEV-002 in `deviations.md` for trade-offs.

## CR Status Lifecycle

All CRs managed by these operators follow the standardized 3-state lifecycle:

```
CR created (no status)
  → operator picks up: status: reconciling, lastReconciledAt: <timestamp>
  → Ansible runs:
      success → status: ready, lastReconciledAt: <timestamp>
      failure → status: failed, message: <error>, lastReconciledAt: <timestamp>
```

The UI displays "pending" if no status field is present (CR just created, operator
hasn't picked it up yet).
