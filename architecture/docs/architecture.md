# Sovereign Cloud — Platform Architecture

## Documentation Structure

### Concepts (non-technical / presentations / managers)

| Document | Description |
|---|---|
| [concepts/00-overview.md](concepts/00-overview.md) | Platform overview |
| [concepts/01-what-is-sovereign-cloud.md](concepts/01-what-is-sovereign-cloud.md) | What is it and why |
| [concepts/02-how-it-works.md](concepts/02-how-it-works.md) | How it works (simple) |
| [concepts/03-security-model.md](concepts/03-security-model.md) | Security at a glance |
| [concepts/04-components-overview.md](concepts/04-components-overview.md) | Component map |
| [concepts/09-leadership-demo-deck.md](concepts/09-leadership-demo-deck.md) | Leadership Demo Deck (10 slides) |
| [concepts/10-component-interaction-map.md](concepts/10-component-interaction-map.md) | Component Interaction Maps (5 Mermaid diagrams) |

### Technical (developers / operators / implementation)

| Document | Description |
|---|---|
| [technical/02-bootstrap-flow.md](technical/02-bootstrap-flow.md) | Bootstrap sequence and make targets |
| [technical/03-central-cluster.md](technical/03-central-cluster.md) | Central cluster: ArgoCD, RHACM, Vault, Gitea |
| [technical/04-services-cluster.md](technical/04-services-cluster.md) | Services cluster management |
| [technical/05-oci-registry.md](technical/05-oci-registry.md) | OCI registry access model |
| [technical/06-keycloak.md](technical/06-keycloak.md) | Keycloak realms, clients, OAuth, RBAC |
| [technical/07-ansible-runner.md](technical/07-ansible-runner.md) | Ansible execution environment |
| [technical/08-acs.md](technical/08-acs.md) | Red Hat Advanced Cluster Security |
| [technical/09-vault.md](technical/09-vault.md) | HashiCorp Vault secrets management |
| [technical/10-aap.md](technical/10-aap.md) | Ansible Automation Platform |
| [technical/11-odf.md](technical/11-odf.md) | ODF / Noobaa object storage |
| [technical/12-quay.md](technical/12-quay.md) | Red Hat Quay registry |
| [technical/13-crunchy-postgres.md](technical/13-crunchy-postgres.md) | Crunchy Postgres for Kubernetes |
| [technical/14-gitea.md](technical/14-gitea.md) | Gitea self-hosted Git service |
| [technical/15-sovereign-dashboard.md](technical/15-sovereign-dashboard.md) | Sovereign Cloud Dashboard |
| [technical/16-dashboard-api-reference.md](technical/16-dashboard-api-reference.md) | Dashboard REST API reference |
| [technical/17-entity-operator.md](technical/17-entity-operator.md) | Entity Operator (tenant namespaces) |
| [technical/18-secrets-flow.md](technical/18-secrets-flow.md) | Platform secrets: Vault, External Secrets, cross-cluster delivery |
| [technical/19-plugin-rbac.md](technical/19-plugin-rbac.md) | Plugin RBAC operator (`RbacConfig` / `Rbac`) |
| [technical/20-tenancy-dashboard.md](technical/20-tenancy-dashboard.md) | Tenancy Dashboard UI |
| [technical/21-plugin-vault.md](technical/21-plugin-vault.md) | Plugin Vault operator (`Vault` / `VaultKV`) |
| [technical/22-plugin-aap.md](technical/22-plugin-aap.md) | Plugin AAP operator (`AAPConfig` / `AAPOrg`) |
| [technical/23-plugin-quay.md](technical/23-plugin-quay.md) | Plugin Quay operator (`QuayConfig` / `QuayOrg`) |
| [technical/24-tenancy-operators.md](technical/24-tenancy-operators.md) | Tenancy operators (Team, Assignment, Project, PlatformOpenshift, CloudOSO) |
| [technical/25-plugin-iaac.md](technical/25-plugin-iaac.md) | Plugin SDX operator (CR-to-Gitea sync) |
| [technical/26-observability.md](technical/26-observability.md) | Observability (metrics / alerts) |
| [technical/27-operator-performance.md](technical/27-operator-performance.md) | Operator reconcile tuning and concurrency |
| [technical/28-cleanup-procedures.md](technical/28-cleanup-procedures.md) | Full cluster reset and cleanup procedures |
| [technical/29-deployment-sequence.md](technical/29-deployment-sequence.md) | Phased deployment sequence (app-by-app ArgoCD) |
| [technical/30-app-of-apps-structure.md](technical/30-app-of-apps-structure.md) | App-of-apps Helm chart layout and template directory structure |
| [technical/31-keycloak-vault-integration.md](technical/31-keycloak-vault-integration.md) | Keycloak OIDC + Vault Kubernetes auth integration |
| [technical/32-deployment-fixes.md](technical/32-deployment-fixes.md) | Known deployment issues and resolutions |
| [technical/33-cluster-builds-appset.md](technical/33-cluster-builds-appset.md) | Cluster Builds ApplicationSet (GitOps cluster provisioning) |
| [technical/36-cluster-builds-oso.md](technical/36-cluster-builds-oso.md) | OpenStack cluster build flow end-to-end |
| [technical/37-ocp-base-chart.md](technical/37-ocp-base-chart.md) | ocp-base chart: ESO + GitOps delivery to provisioned clusters via ACM |
| [technical/50-security-interaction-diagrams.md](technical/50-security-interaction-diagrams.md) | Security Interaction Diagrams |
| [technical/51-qa-test-checklist.md](technical/51-qa-test-checklist.md) | QA Test Checklist |
| [technical/52-three-tier-presentation.md](technical/52-three-tier-presentation.md) | IBM Three-Tier Architecture — Presentation Tier |
| [technical/53-three-tier-logic-part1.md](technical/53-three-tier-logic-part1.md) | IBM Three-Tier Architecture — Logic Tier (Part 1) |
| [technical/53-three-tier-logic-part2.md](technical/53-three-tier-logic-part2.md) | IBM Three-Tier Architecture — Logic Tier (Part 2) |
| [technical/54-three-tier-data.md](technical/54-three-tier-data.md) | IBM Three-Tier Architecture — Data Tier |
| [technical/55-three-tier-overview.md](technical/55-three-tier-overview.md) | IBM Three-Tier Architecture — Overview |
| [../hardeningcheck/security-state-2026.md](../hardeningcheck/security-state-2026.md) | 2026 Security State Assessment |


### Tutorials (day-2 operations / how-to guides)

| Document | Description |
|---|---|
| [tutorial/01-day2-vault.md](tutorial/01-day2-vault.md) | Vault seal/unseal, KV secrets, policies, k8s auth troubleshooting |
| [tutorial/02-day2-keycloak.md](tutorial/02-day2-keycloak.md) | Realm/client/group management, OIDC debug, OAuth integration |
| [tutorial/03-day2-operators.md](tutorial/03-day2-operators.md) | Entity/Team/Assignment CRs, operator upgrades, watches tuning |
| [tutorial/04-day2-argocd.md](tutorial/04-day2-argocd.md) | Sync waves, app-of-apps, cluster registration, OCI chart workflow |
| [tutorial/05-day2-plugins.md](tutorial/05-day2-plugins.md) | Plugin RBAC/Vault/AAP/Quay lifecycle and troubleshooting |
| [tutorial/06-user-dashboard.md](tutorial/06-user-dashboard.md) | Sovereign Cloud Dashboard: entity management, OAuth proxy, login flow |
| [tutorial/07-tenancy-dashboard.md](tutorial/07-tenancy-dashboard.md) | Tenancy Dashboard: tenant onboarding, team/project/assignment CRs |

---

## Quick Summary

Two-cluster OpenShift platform:
- **Central** = ArgoCD + RHACM + Vault + Gitea + Keycloak + Sovereign Jobs (management) — **only cluster with ArgoCD ApplicationSet**
  - Namespaces: `sovereign-cloud-jobs`, `sovereign-cloud-helpers`
- **Services** = Keycloak + AAP + Entity Operator + tenancy operators (Team, Assignment, Project, PlatformOpenshift, CloudOSO) + Sovereign & Tenancy Dashboards + plugin operators (RBAC, Vault, AAP, Quay, SDX), managed remotely by central ArgoCD
  - Namespaces: `sovereign-cloud`, `sovereign-cloud-plugins`
- **Both** = ODF/Noobaa, Quay, Crunchy Postgres
- **ACS** = disabled (`enabled: false` in app-of-apps)
- **Quay** = external OCI registry for Helm charts and container images
- **Operator placement**: `hybridsovereign.redhat` → services, `helper.hybridsovereign.redhat` → central

ArgoCD on the central cluster manages both clusters via a single app-of-apps (`helm/central`).
The services cluster does NOT run its own ArgoCD management.

## Plugin Operators — Scoping & Naming Rules

All plugin operators (`plugin_rbac`, `plugin_aap`, `plugin_vault`, `plugin_quay`, `plugin_sdx`) follow these rules:

| Rule | Detail |
|------|--------|
| **Scope** | Cluster-scoped operators |
| **Deployment** | All in `sovereign-cloud-plugins` namespace |
| **Namespace watching** | Watch all entity namespaces |
| **Config CRs** | `RbacConfig`, `AAPConfig`, `QuayConfig` → only in `sovereign-cloud-plugins` |
| **Entity CRs** | `Rbac`, `AAPOrg`, `QuayOrg`, `Vault`, `VaultKV` → in entity namespaces |
| **Entity label** | Entity namespaces MUST have `hybridsovereign.redhat/entity` label |
| **Label enforcement** | CRs in entity namespaces fail reconciliation if label is missing |
| **Entity prefixing** | AAP/Quay org names: `<entity>-<cr-name>`. Vault OIDC clients: `vault-<entity>-<cr-name>` |
| **RBAC field** | `Rbac` CR status field is `status.group` (not `status.groupName`) |

### Examples

- AAP org for `AAPOrg` named `automation` in `entity-acme-corp` → AAP org name: `acme-corp-automation`
- Quay org for `QuayOrg` named `registry` in `entity-acme-corp` → Quay org name: `acme-corp-registry`
- Vault OIDC client for `Vault` named `secrets` in `entity-acme-corp` → client: `vault-acme-corp-secrets`

## Dashboard API Rules

- All Kubernetes API calls MUST use the logged-in user's OAuth access token
- OAuth proxy MUST request `user:full` scope
- Never use the pod's ServiceAccount token for user-facing API interactions
- `kubeadmin` user has access to all namespaces

## Known Deviations & Infrastructure Issues

| Area | Deviation | Impact | Mitigation |
|------|-----------|--------|------------|
| **Vault mlock** | `disable_mlock = true` required on OpenShift restricted SCC | Vault data is not memory-locked; swappable to disk | Acceptable on OpenShift where SCCs prevent `IPC_LOCK`. Use encrypted storage at rest. |
| **Vault chown** | `SKIP_CHOWN=true`, `SKIP_SETCAP=true` env vars added | Container entrypoint skips permission fixups | Required for restricted SCC compatibility; `emptyDir` at `/vault/config` provides writable config. |
| **Vault OIDC TLS** | Vault OIDC discovery uses OpenShift ingress CA (`oidc_discovery_ca_pem`) | Vault must trust the router's self-signed CA to reach Keycloak external URL | CA is read from `default-ingress-cert` ConfigMap in `openshift-config-managed`. |
| **Quay service** | Quay app pods in `Pending` due to cluster memory exhaustion | `QuayOrg` CRs cannot reconcile | Infrastructure-level fix required (add worker nodes or increase memory). Retry logic added to operator. |
| **Keycloak route lookup** | Route name is auto-generated by Keycloak operator | Cannot use hardcoded name in lookups | Label selector `app.kubernetes.io/instance=rhbk-services` used instead. |
| **Jinja2 `.keys` collision** | Ansible dict `.keys` method shadows Vault API response `keys` field | Init secret saving fails with `.json.keys[0]` | Use bracket notation: `.json['keys'][0]`. |
