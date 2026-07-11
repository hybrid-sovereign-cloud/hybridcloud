# ADR-002: Multi-Tier Operator Architecture

**Status**: Accepted  
**Date**: 2026-07-11  
**Deciders**: Platform architecture team

---

## Context

The legacy platform deployed 13 independent Ansible Operator SDK controllers, each with its own Helm chart, container image, and ArgoCD Application:

- Entity, Team, Assignment, Project, Persona, PlatformOpenshift, CloudOSO, CloudAWS
- Plugin operators: RBAC, AAP, Quay, Vault (×2 kinds each)
- OpenStackMigration

Each operator carried a full ClusterRole, duplicated reconcile boilerplate, and independent release cycles. Entity was the only operator that needed cluster-wide namespace creation privileges; tenant-scoped operators only needed access within `entity-<name>`.

---

## Decision

Replace 13 operators with a two-tier architecture:

### Tier 1 — Primary Operator

- **Deployment**: Single Deployment in `sovereign-cloud` (2 replicas)
- **RBAC**: ClusterRole (namespace creation, namespace operator deployment)
- **Watches**: `Entity`, `RbacConfig`, `AAPConfig`, `QuayConfig`
- **Path**: `hybridcloud/operator/primary/`

### Tier 2 — Namespace Operator

- **Deployment**: One Deployment per entity in `entity-<name>`
- **RBAC**: Namespace-scoped Role (`hybridsovereign.redhat/*` verbs within entity namespace)
- **Watches**: Team, Assignment, Project, Persona, PlatformOpenshift, CloudOSO, CloudAWS, OpenStackMigration, Rbac, AAPOrg, QuayOrg, Vault, VaultKV
- **Path**: `hybridcloud/operator/namespace/`
- **Spawned by**: Primary `entity` role via `deploy_namespace_operator.yml`

Both tiers remain lightweight event emitters. Heavy provisioning stays in EDA (see ADR-003).

### ArgoCD

Single Application key `hybridsovereignPrimaryOperator` (sync-wave 38) replaces individual operator Applications. Legacy per-operator Application keys remain in `values.yaml` with `enabled: false` during phased migration.

---

## Consequences

### Positive

- Namespace operators inherit least-privilege RBAC automatically
- One CRD bundle, one primary image build, one chart upload pipeline
- Entity deletion cascades: finalizer removes namespace operator before namespace
- Per-entity leader election ID prevents cross-entity reconcile conflicts

### Negative

- Primary operator failure blocks all new entity onboarding
- Namespace operator image updates require rolling restart per entity (or primary re-reconcile)
- Debugging requires identifying which tier owns a given CR kind

### Neutral

- Event contract (`<Kind>CreateRequested`) unchanged from legacy operators
- EDA rulebooks remain per-kind; no EDA consolidation required

---

## CR Kind Assignment

| Tier | Kinds | Namespace |
|------|-------|-----------|
| Primary | Entity, RbacConfig, AAPConfig, QuayConfig | `sovereign-cloud`, `sovereign-cloud-plugins` |
| Namespace | All tenant + plugin entity CRs | `entity-<name>` |

---

## References

- [c4/components/operator.md](../c4/components/operator.md)
- [c4/code/entity-lifecycle.md](../c4/code/entity-lifecycle.md)
- Spec 033: Unified Operator (`hybridcloud/specs/033-unified-operator/spec.md`)
