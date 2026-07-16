# Assignment Operator — Technical Reference

**Version**: 0.5.0 | **Branch**: `004-assignment-cr-redesign`

---

## Overview

The Assignment operator links a `Team`, one or more `Project` CRs, and a `PlatformOpenshift` CR
into a unified team environment on the target spoke cluster. It uses **Open Cluster Management (ACM)
ConfigurationPolicy** to deliver the `sovereign-assignment` Helm chart resources to the spoke cluster
without requiring direct spoke cluster credentials.

---

## Architecture

```
Services Cluster                   Central Cluster              Spoke Cluster (ocp-sdx-aws1)
┌─────────────────────┐            ┌──────────────────┐         ┌────────────────────────┐
│ Assignment Operator │            │ ACM Hub          │         │                        │
│ reads Assignment CR │──────────▶ │ Policy           │────────▶│ Namespaces (devops,    │
│ helm template       │   REST     │ Placement        │  ACM    │   project, istio)      │
│ POST Policy via SA  │ (SA token) │ PlacementBinding │ enforce │ ArgoCD instance        │
└─────────────────────┘            └──────────────────┘         │ ServiceMeshControlPlane│
         │                                                        │ RBAC RoleBindings      │
         │ ExternalSecret                                         └────────────────────────┘
         ▼
    Vault (central/assignment-acm-creator)
         ▲
    PushSecret (assignment-central-rbac chart)
```

---

## Assignment CR Schema

```yaml
apiVersion: hybridsovereign.redhat/v1alpha1
kind: Assignment
metadata:
  name: acme-sdx-aws1-platform-eng
  namespace: entity-acme-corp
spec:
  openshift: ocp-sdx-aws1       # PlatformOpenshift CR name (AWS, CloudAWS: ses10-env)
  team: platform-engineering    # Team CR name
  projects:
    - website-redesign           # Project CR names
    - data-pipeline
  toolRbac:                      # optional
    assignmentAdmin: acme-assignment-admins   # Rbac CR → admin all NSes + ArgoCD admin
    assignmentDeveloper: acme-developers       # Rbac CR → edit project NSes
    assignmentViewer: acme-platform-viewers    # Rbac CR → view all NSes
    assignmentOps: acme-devops                 # Rbac CR → view projects, edit devops/istio, ArgoCD admin
```

---

## Status Fields

| Field | Type | Description |
|-------|------|-------------|
| `ready` | bool | All linked CRs are ready |
| `assignmentProvisioned` | bool | ACM Policy created on central |
| `acmPolicyName` | string | Name of ACM Policy on central cluster |
| `entity` | string | Entity derived from namespace label |
| `clusterName` | string | ACM managed cluster name (from PlatformOpenshift status.appName) |

---

## ACM Policy Lifecycle

### Provision
1. Operator reads `assignment-acm-creator-sa` ExternalSecret (token + ca.crt)
2. Runs `helm template sovereign-assignment` with entity/team/projects/toolRbac values
3. POSTs ACM Policy (containing one ConfigurationPolicy with all spoke resources as object-templates)
4. POSTs ACM Placement targeting `spec.predicates[].requiredClusterSelector.matchLabels.name = <cluster>`
5. POSTs ACM PlacementBinding linking Policy + Placement

### Delete (finalizer)
1. Reads SA token from ExternalSecret
2. PATCHes Policy: all object-template entries set to `complianceType: mustnothave`
3. Waits 60s for ACM enforcement (spoke resources removed)
4. DELETEs PlacementBinding → Placement → Policy

---

## Secret Chain

```
Central Cluster:
  assignment-acm-creator (ServiceAccount)
    └── assignment-acm-creator-token (kubernetes.io/service-account-token Secret)
           └── PushSecret → Vault central/assignment-acm-creator {token, ca.crt}

Services Cluster:
  ExternalSecret (assignment-acm-creator-sa) ← Vault central/assignment-acm-creator
    └── Secret assignment-acm-creator-sa {token, ca.crt}
           └── Assignment operator reads at reconcile time
```

---

## toolRbac Role Mapping

| Field | Namespace Scope | Kubernetes Role |
|-------|-----------------|-----------------|
| `assignmentAdmin` | devops + all projects + istio | `admin` |
| `assignmentDeveloper` | project namespaces only | `edit` |
| `assignmentViewer` | devops + all projects + istio | `view` |
| `assignmentOps` | devops + istio | `edit` |
| `assignmentOps` | project namespaces | `view` |

---

## Operator Namespace

Deployed in `sovereign-cloud` on the **services cluster**. Watches all namespaces with label
`hybridsovereign.redhat/entity`.

---

## Related Charts

| Chart | Location | Purpose |
|-------|----------|---------|
| `assignment-operator` | `Assignment/helm/` | Operator deployment on services cluster |
| `assignment-central-rbac` | `assignment-central-rbac/` | SA + Role + PushSecret on central cluster |
| `sovereign-assignment` | `sovereign-assignment/` | Team environment chart enforced via ACM Policy |
