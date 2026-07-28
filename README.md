# Hybridcloud

Unified monorepo for the Hybrid Sovereign Cloud platform.

## Repository layout

| Path | Purpose |
|------|---------|
| `bootstrap/` | ArgoCD app-of-apps, init chart, platform OCI charts, Ansible jobs |
| `operator/primary/` | Primary operator (Entity + plugin configs) |
| `operator/namespace/` | Per-entity namespace operator |
| `iaac/` | Python StatefulSet — Git sync for all CRs |
| `eda/` | Event-driven automation rulebooks and decision environments |
| `migration/` | VMware → CloudOSO via `os_migrate.vmware_migration_kit` |
| `ui/` | PatternFly 5 dashboards and console plugins |
| `aap-config/` | AAP/EDA config-as-code (`infra.aap_configuration`) |
| `samples/` | Sample CRs (apply via `oc apply`, not ArgoCD) |
| `specs/` | Feature specifications for agentic rebuild |
| `tests/` | Holistic test specs |
| `architecture/` | C4 model documentation |

## Quick start

```bash
make check-env
cd bootstrap && make upload-all-charts && make ansible-runner
make init-central-argo   # from bootstrap/
```

## Clusters

- **Central**: `api.central.LAB_DOMAIN` — ArgoCD, ACM, Vault, AAP EDA
- **Services**: `api.services.LAB_DOMAIN` — operators, dashboards, tenant CRs

## Constraints

- No secrets in git
- All deployments via ArgoCD after bootstrap
- Parent `sovereign/` workspace is a thin meta-repo; frozen legacy operator trees were removed after monorepo migration (see `architecture/docs/archive/technical/DEPRECATED_REPOS.md`)

## Disconnected / air-gap

Runtime GitOps and SCM must use **in-cluster Gitea + private OCI registry**. Public GitHub / quay.io / registry.redhat.io are build-time sources only (mirror first). See [`docs/disconnected-deploy.md`](docs/disconnected-deploy.md).
