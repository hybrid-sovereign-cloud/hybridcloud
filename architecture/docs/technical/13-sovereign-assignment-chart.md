# sovereign-assignment Helm Chart — Technical Reference

**Version**: 0.2.0 | **Branch**: `004-assignment-cr-redesign`

---

## Overview

The `sovereign-assignment` chart deploys a team's complete environment on a spoke OCP cluster.
It is **never deployed directly** — the Assignment operator runs `helm template` to render its
manifests, then bundles them as ACM ConfigurationPolicy object-templates. ACM enforces the
rendered state on the target cluster.

---

## Deployed Resources

```
<entity>-<team>-devops (Namespace)
  └── ArgoCD CR (<entity>-<team>-argocd) — namespace-scoped, restricted to project NSes
  └── AppProject (<entity>-<team>-project) — restricts ArgoCD destinations to project NSes
  └── RoleBinding assignment-admin (if assignmentAdminGroup set)
  └── RoleBinding assignment-viewer (if assignmentViewerGroup set)
  └── RoleBinding assignment-ops-edit (if assignmentOpsGroup set)
  └── RoleBindings for ArgoCD SA in each project namespace

<entity>-<project> (Namespace, one per projects[])
  └── RoleBinding assignment-admin
  └── RoleBinding assignment-developer
  └── RoleBinding assignment-viewer
  └── RoleBinding assignment-ops-view

<entity>-<team>-istio (Namespace, if features.istio)
  └── ServiceMeshControlPlane (basic)
  └── RoleBinding assignment-admin
  └── RoleBinding assignment-viewer
  └── RoleBinding assignment-ops-edit
```

---

## Values

```yaml
entity: "acme-corp"          # Required: entity name (from namespace label)
team: "platform-engineering" # Required: team name

projects:                    # Required: list of Project CR names
  - website-redesign
  - data-pipeline

features:
  istio: true    # Deploy ServiceMeshControlPlane
  gitops: true   # Deploy ArgoCD instance + AppProject

toolRbac:
  assignmentAdminGroup: "acme-corp/platform-admins"     # from Rbac CR status.group
  assignmentDeveloperGroup: "acme-corp/platform-devs"   # from Rbac CR status.group
  assignmentViewerGroup: "acme-corp/platform-viewers"   # from Rbac CR status.group
  assignmentOpsGroup: "acme-corp/platform-ops"          # from Rbac CR status.group
```

---

## Namespace Naming Convention

| Type | Name Pattern | Labels |
|------|-------------|--------|
| DevOps | `<entity>-<team>-devops` | `team=<entity>-<team>`, `hybridsovereign.redhat/assignment-devops=true` |
| Project | `<entity>-<project>` | `team=<entity>-<team>`, `hybridsovereign.redhat/assignment-project=<project>` |
| Istio | `<entity>-<team>-istio` | `team=<entity>-<team>`, `hybridsovereign.redhat/assignment-istio=true` |

---

## ArgoCD Instance Scoping

The team ArgoCD instance (`ArgoCD` CR in devops namespace) is namespace-scoped:
- `spec.server.route.enabled: true` — exposed via OpenShift Route
- `AppProject` with `spec.destinations` restricted to `<entity>-<project>` namespaces only
- ArgoCD controller SA has RoleBindings only in declared project namespaces

---

## Istio Control Plane

`ServiceMeshControlPlane` deployed in `<entity>-<team>-istio`:
- `spec.version: v2.6`
- `spec.members` includes all project namespaces (enables sidecar injection)
- Minimal profile (no Kiali, Grafana, Prometheus — reduces resource consumption)

**Prerequisite**: `servicemeshoperator` Subscription must be installed on the spoke cluster
(deployed via `acmBasechart` istioOperator policy).

---

## Delete Behaviour

ACM Policy is patched to `complianceType: mustnothave` before deletion. This causes ACM to
**remove all resources from the spoke cluster** before the Policy itself is deleted from central.
