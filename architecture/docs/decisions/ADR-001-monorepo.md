# ADR-001: Hybridcloud Monorepo Migration

**Status**: Accepted  
**Date**: 2026-07-11  
**Deciders**: Platform architecture team

---

## Context

The Hybrid Sovereign Cloud platform was originally spread across 20+ independent Git repositories under the parent `sovereign/` workspace:

- Separate Ansible operator repos (`Entity/`, `Team/`, `plugin_aap/`, etc.)
- Standalone dashboard repos (`user_dashboard/`, `tenancy_dashboard/`)
- Bootstrap, EDA rulebooks, and AAP config in distinct repos
- Duplicated common Ansible tasks across operator and rulebook trees

This fragmentation caused:

- Version skew between operators, EDA roles, and dashboards
- Duplicate CI pipelines and container builds
- Difficult cross-cutting refactors (API group rename, event contract changes)
- No single source of truth for architecture documentation

---

## Decision

Consolidate the platform into a single `hybridcloud/` monorepo with a fixed directory layout:

| Path | Replaces |
|------|----------|
| `hybridcloud/bootstrap/` | `bootstrap/` repo |
| `hybridcloud/operator/primary/` + `namespace/` | 13 separate operator repos |
| `hybridcloud/eda/` | `eda/` rulebook repos |
| `hybridcloud/iaac/` | Go `plugin_sdx` operator |
| `hybridcloud/ui/` | `user_dashboard/`, `tenancy_dashboard/`, console plugins |
| `hybridcloud/aap-config/` | `aap-controller-config/`, `eda-config/` Ansible roles |
| `hybridcloud/migration/` | VMware migration playbooks |
| `hybridcloud/samples/` | Per-operator `config/samples/` |
| `hybridcloud/specs/` | Feature specifications for agentic rebuild |
| `hybridcloud/architecture/` | C4 model and technical docs |

Frozen legacy repos in the parent workspace remain read-only reference during migration.

### Constraints carried forward

- API group: `hybridsovereign.redhat/v1alpha1`
- No secrets in Git
- GitOps-only after `make init-central-argo`
- Central ArgoCD manages both clusters

---

## Consequences

### Positive

- Single commit can update operator, EDA role, UI types, and docs atomically
- Shared Ansible tasks in `hybridcloud/eda/common/` eliminate duplication
- `hybridcloud/specs/` provides machine-readable feature contracts for rebuild
- C4 documentation in `hybridcloud/architecture/docs/c4/` maps directly to code paths

### Negative

- Larger repository; clone and search scope increases
- All EDA decision environment images must rebuild when shared tasks change
- Bootstrap Makefile must reference monorepo-relative paths

### Neutral

- OCI chart and image publishing still uses per-component `make upload-*` targets
- ArgoCD Application keys in `bootstrap/helm/central/values.yaml` remain the deployment contract

---

## References

- [hybridcloud/README.md](../../../README.md)
- [c4/context.md](../c4/context.md)
- Spec 034: Bootstrap Deployment (`hybridcloud/specs/034-bootstrap-deployment/spec.md`)
