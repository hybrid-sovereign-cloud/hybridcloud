# Deprecated Sovereign Repositories

**Status**: Frozen — read-only archive  
**Canonical source**: [`hybridcloud/`](../../) monorepo  
**Effective**: 2026-07-11 (monorepo migration)

---

## Policy

All new development, chart uploads, EDA decision environment builds, and documentation updates MUST target `hybridcloud/` only. The repositories listed below are **deprecated** and must not receive feature work, version bumps, or deployment artifacts.

| Action | Deprecated repo | Canonical location |
|--------|-----------------|-------------------|
| Operator code | `Entity/`, `Team/`, etc. | `hybridcloud/operator/` |
| Helm charts | Root `bootstrap/` | `hybridcloud/bootstrap/` |
| EDA playbooks | Root `eda/` | `hybridcloud/eda/` |
| Samples | Per-operator `config/samples/` | `hybridcloud/samples/` |
| Dashboards | `user_dashboard/`, `tenancy_dashboard/` | `hybridcloud/ui/` |
| Architecture docs | Root `architecture/` | `hybridcloud/architecture/` (in progress) |
| Global tests | `global_tests/` | `hybridcloud/tests/` |
| Specs | Root `specs/` (feature branches) | `hybridcloud/specs/` |

---

## Frozen Operator Repositories

These Ansible/Helm operator directories at the repository root are frozen. CRDs, roles, and chart logic have been consolidated into `hybridcloud/operator/` (primary + namespace tiers) and `hybridcloud/bootstrap/helm/charts/`.

| Repository / Directory | API Kinds | Replacement |
|------------------------|-----------|-------------|
| `Entity/` | Entity | `hybridcloud/operator/primary` |
| `Team/` | Team | `hybridcloud/operator/namespace` |
| `Projects/` | Project | `hybridcloud/operator/namespace` |
| `Assignment/` | Assignment | `hybridcloud/operator/namespace` |
| `Persona/` | Persona | `hybridcloud/operator/namespace` |
| `PlatformOpenshift/` | PlatformOpenshift | `hybridcloud/operator/namespace` |
| `CloudOSO/` | CloudOSO | `hybridcloud/operator/namespace` |
| `CloudAWS/` | CloudAWS | `hybridcloud/operator/namespace` |
| `OpenStackMigration/` | OpenStackMigration | `hybridcloud/operator/namespace` + `hybridcloud/migration/` |
| `plugin_aap/` | AAPConfig, AAPOrg | `hybridcloud/operator/` |
| `plugin_quay/` | QuayConfig, QuayOrg | `hybridcloud/operator/` |
| `plugin_rbac/` | RbacConfig, Rbac | `hybridcloud/operator/` |
| `plugin_vault/` | Vault, VaultKV | `hybridcloud/operator/` |
| `plugin_iaac/` | Iaac (removed) | `hybridcloud/iaac/` StatefulSet |
| `assignment-central-rbac/` | ACM RBAC chart | `hybridcloud/bootstrap/helm/charts/rhacm/` |

---

## Frozen Infrastructure Directories

| Directory | Purpose (legacy) | Replacement |
|-----------|------------------|---------------|
| `bootstrap/` (root) | Central/services Helm, Ansible | `hybridcloud/bootstrap/` |
| `eda/` (root) | EDA decision environments | `hybridcloud/eda/` |
| `charts/` (root) | Shared chart fragments | `hybridcloud/bootstrap/helm/charts/` |
| `user_dashboard/` | Admin UI | `hybridcloud/ui/packages/admin-dashboard` |
| `tenancy_dashboard/` | Tenant UI | `hybridcloud/ui/packages/tenant-dashboard` |
| `global_tests/` | Ansible validation playbooks | `hybridcloud/tests/` |
| `architecture/` (root) | Docs and hardening checks | `hybridcloud/architecture/` |
| `specs/` (root) | Spec Kit feature branches | `hybridcloud/specs/` (001–034) |
| `scripts/` (root) | Ad-hoc automation | `hybridcloud/scripts/` |
| `generaldocs/` | Legacy documentation | `hybridcloud/architecture/docs/` |

---

## Removed Components

| Component | Reason | Notes |
|-----------|--------|-------|
| `plugin_iaac/` EDA plugin | Replaced by Python StatefulSet | `hybridcloud/iaac/` watches Gitea |
| `assignment-central-rbac/` | Absorbed into RHACM chart | No standalone chart uploads |
| HELPEROSO / HELPERAWS SAs | Declared obsolete | `enabled: false` in central values |
| Root `README.md` | Superseded | See `hybridcloud/README.md` (if present) or `specs/README.md` |

---

## Migration Checklist for Contributors

- [ ] Clone and branch from `hybridcloud/` paths only
- [ ] Run `hybridcloud/tests/run-tests.sh` before PR
- [ ] Bump chart versions in `hybridcloud/bootstrap/helm/` (not root operator dirs)
- [ ] Update `hybridcloud/bootstrap/helm/central/values.yaml` version pins
- [ ] Rebuild EDA DE images from `hybridcloud/eda/` only
- [ ] Do not reference frozen paths in new specs or CI jobs

---

## Archive Handling

Frozen directories remain in the repository root for historical reference and branch archaeology. They may be deleted from the default branch in a future cleanup once all open PRs and CI pipelines have migrated.

**Do not**:

- Run `make upload-chart` from frozen operator directories
- Commit secrets or credentials to frozen repos (policy applies globally)
- Delete `sovereign-*` namespaces during archive validation

**Do**:

- File issues referencing `hybridcloud/` paths
- Link PRs to Mega-Phase gates in `hybridcloud/tests/argocd-deploy/DEPLOYMENT_GATES.md`

---

## Related Artifacts

- `hybridcloud/specs/033-unified-operator/spec.md` — operator consolidation design
- `hybridcloud/samples/README.md` — sample migration from frozen repos
- `hybridcloud/hardening-checks/reports/migration-hardening-gap-analysis.md` — GAP-003, GAP-004
- `hybridcloud/tests/security/SECURITY_REVIEW.md` — ongoing security gates
