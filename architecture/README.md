# Architecture

Platform architecture documentation for the Sovereign Cloud project.

## Contents

| Document | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Index and quick summary |
| [docs/concepts/00-overview.md](docs/concepts/00-overview.md) | Platform overview |
| [docs/concepts/01-what-is-sovereign-cloud.md](docs/concepts/01-what-is-sovereign-cloud.md) | What is Sovereign Cloud |
| [docs/concepts/02-how-it-works.md](docs/concepts/02-how-it-works.md) | How it works |
| [docs/concepts/03-security-model.md](docs/concepts/03-security-model.md) | Security model |
| [docs/concepts/04-components-overview.md](docs/concepts/04-components-overview.md) | Component map |
| [docs/technical/02-bootstrap-flow.md](docs/technical/02-bootstrap-flow.md) | Bootstrap sequence |
| [docs/technical/03-central-cluster.md](docs/technical/03-central-cluster.md) | Central cluster |
| [docs/technical/04-services-cluster.md](docs/technical/04-services-cluster.md) | Services cluster |
| [docs/technical/05-oci-registry.md](docs/technical/05-oci-registry.md) | OCI registry |
| [docs/technical/06-keycloak.md](docs/technical/06-keycloak.md) | Keycloak |
| [docs/technical/07-ansible-runner.md](docs/technical/07-ansible-runner.md) | Ansible runner |
| [docs/technical/08-acs.md](docs/technical/08-acs.md) | ACS |
| [docs/technical/09-vault.md](docs/technical/09-vault.md) | Vault |
| [docs/technical/10-aap.md](docs/technical/10-aap.md) | AAP |
| [docs/technical/11-odf.md](docs/technical/11-odf.md) | ODF / Noobaa |
| [docs/technical/12-quay.md](docs/technical/12-quay.md) | Quay |
| [docs/technical/13-crunchy-postgres.md](docs/technical/13-crunchy-postgres.md) | Crunchy Postgres |
| [docs/technical/14-gitea.md](docs/technical/14-gitea.md) | Gitea |
| [docs/technical/15-sovereign-dashboard.md](docs/technical/15-sovereign-dashboard.md) | Sovereign Dashboard |
| [docs/technical/16-dashboard-api-reference.md](docs/technical/16-dashboard-api-reference.md) | Dashboard API reference |
| [docs/technical/17-entity-operator.md](docs/technical/17-entity-operator.md) | Entity Operator |
| [docs/technical/18-secrets-flow.md](docs/technical/18-secrets-flow.md) | Platform secrets flow |
| [docs/technical/19-plugin-rbac.md](docs/technical/19-plugin-rbac.md) | Plugin RBAC |
| [docs/technical/20-tenancy-dashboard.md](docs/technical/20-tenancy-dashboard.md) | Tenancy Dashboard |
| [docs/technical/21-plugin-vault.md](docs/technical/21-plugin-vault.md) | Plugin Vault |
| [docs/technical/22-plugin-aap.md](docs/technical/22-plugin-aap.md) | Plugin AAP |
| [docs/technical/23-plugin-quay.md](docs/technical/23-plugin-quay.md) | Plugin Quay |
| [docs/technical/24-tenancy-operators.md](docs/technical/24-tenancy-operators.md) | Tenancy operators |
| [docs/technical/25-plugin-iaac.md](docs/technical/25-plugin-iaac.md) | Plugin SDX (CR-to-Gitea sync) |
| [docs/technical/26-observability.md](docs/technical/26-observability.md) | Observability |
| [docs/technical/27-operator-performance.md](docs/technical/27-operator-performance.md) | Operator performance tuning |
| [hardeningcheck/security-assessment.md](hardeningcheck/security-assessment.md) | Security assessment |

## Platform Summary

Two-cluster OpenShift platform bootstrapped via `make` and maintained by ArgoCD:

- **Central cluster** — ArgoCD + RHACM + Vault + Gitea + Keycloak + Sovereign Jobs (management)
- **Services cluster** — AAP + Keycloak + Entity + tenancy + plugin operators + dashboards (managed by central)
- **Both clusters** — ODF/Noobaa, Quay registry workload, Crunchy Postgres for Kubernetes
- **Quay** — external OCI registry for charts and images (robot read-only where configured)

## Bootstrap

```
make check-env                        → validate env vars + test logins
make add-docker-repo                  → trust image registry on both clusters
make upload-acm-chart                 → push RHACM chart to OCI
make upload-sovereign-namespaces-chart → push namespaces chart
make upload-rhbk-chart                → push Keycloak chart
... (all upload-*-chart targets)      → push all component charts
make ansible-runner                   → build + push ansible-runner image
make init-central-argo                → deploy init chart → ArgoCD takes over
```
