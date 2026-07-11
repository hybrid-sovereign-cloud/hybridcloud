# Phased Deployment Sequence

## Overview

After Phase 3 cleanup (full cluster reset), applications are re-deployed one at a time by enabling each Application in `bootstrap/helm/central/values.yaml`, committing, and waiting for ArgoCD to sync to `Synced + Healthy` before proceeding to the next.

All applications start with `enabled: false`. Enable one at a time, commit, wait, then proceed.

**Key constraint:** The entire deployment must proceed through central ArgoCD only. No `oc apply` or direct changes. If ArgoCD fails to sync, fix the chart, uninstall completely via ArgoCD pruning (set `enabled: false`, sync, then re-enable), and reinstall.

## Template Directory Layout

```
bootstrap/helm/central/templates/
├── centralCluster/           # Resources targeting central cluster
├── servicesCluster/          # Resources targeting services cluster
└── hybridSovereignOperators/ # Custom operators + dashboards (services cluster)
```

## Deployment Checklist

### Group 1 — Namespaces + Foundation

| # | App Key (values.yaml) | Template Location | Wave | Notes |
|---|----------------------|-------------------|------|-------|
| 1 | `sovereignNamespaces` | centralCluster/ | 1 | Central namespaces |
| 2 | `sovereignNamespacesServices` | servicesCluster/ | 1 | Services namespaces |
| 3 | `sovereignJobsRbac` | centralCluster/ | 3 | Job SA + RBAC |

### Group 2 — Storage + Platform

| # | App Key | Template | Wave | Notes |
|---|---------|----------|------|-------|
| 4 | `rhacm` | centralCluster/ | 10 | MultiClusterHub |
| 5 | `odfCentral` | centralCluster/ | 12 | ODF/NooBaa |
| 6 | `odfServices` | servicesCluster/ | 12 | |
| 7 | `crunchyPostgres` | centralCluster/ | 11 | |
| 8 | `crunchyPostgresServices` | servicesCluster/ | 11 | |

### Group 3 — Secrets Infrastructure

| # | App Key | Template | Wave | Notes |
|---|---------|----------|------|-------|
| 9 | `externalSecrets` | centralCluster/ | 5 | ESO central |
| 10 | `externalSecretsServices` | servicesCluster/ | 5 | ESO services |
| 11 | `vault` | centralCluster/ | 15 | vault-central HA Raft |
| 12 | `vaultServices` | servicesCluster/ | 15 | vault-services HA Raft |
| 13 | `vaultServicesInit` | centralCluster/ | 20 | Init vault-services |
| 14 | `vaultSecretStore` | centralCluster/ | 22 | ClusterSecretStore (k8s auth) |
| 15 | `vaultSecretStoreServices` | servicesCluster/ | 22 | (retries until wave 26) |
| 16 | `sovereignJobs.vaultInit` | (job) | 23 | Init vault-central |
| 17 | `sovereignJobs.vaultKv` | (job) | 24 | Create KV engine |
| 18 | `sovereignJobs.deliverVaultToken` | (job) | 25 | Send token to services |
| 19 | `sovereignJobs.vaultK8sAuth` | (job) | 26 | Enable k8s auth → ESO starts |

### Group 4 — Identity

| # | App Key | Template | Wave | Notes |
|---|---------|----------|------|-------|
| 20 | `rhbk` | centralCluster/ | 20 | RHBK central |
| 21 | `rhbkServices` | servicesCluster/ | 20 | RHBK services |
| 22 | `vaultCentralNamespace` | centralCluster/ | 27 | Init secret backup |
| 23 | `sovereignJobs.keycloakRealms` | (job) | 27 | Create realms |
| 24 | `sovereignJobs.keycloakGroups` | (job) | 27 | Create groups |
| 25 | `sovereignJobs.keycloakClients` | (job) | 27 | Create clients + push secrets |
| 26 | `sovereignJobs.keycloakRbac` | (job) | 27 | RBAC bindings |
| 27 | `sovereignJobs.keycloakOauth` | (job) | 27 | OAuth clients |

### Group 5 — Keycloak Config (continued) + OIDC Auth

| # | App Key | Template | Wave | Notes |
|---|---------|----------|------|-------|
| 28 | `sovereignJobs.keycloakServicesRealms` | (job) | 28 | Services realm |
| 29 | `sovereignJobs.keycloakServicesGroups` | (job) | 28 | Services groups |
| 30 | `sovereignJobs.keycloakServicesClients` | (job) | 28 | Services clients (openshift-services, quay-services, aap) |
| 31 | `sovereignJobs.vaultOidcAuth` | (job) | 29 | Enable OIDC on both vaults |
| 32 | `sovereignJobs.keycloakTestUsers` | (job) | 32 | Create + delete test users (leave groups) |
| 33 | `sovereignJobs.giteaInit` | (job) | 35 | Init Gitea admin + API token |
| 34 | `sovereignJobs.giteaCreateRepo` | (job) | 36 | Create tenancy repo |

### Group 6 — Platform Services

| # | App Key | Template | Wave | Notes |
|---|---------|----------|------|-------|
| 33 | `gitea` | servicesCluster/ | 18 | Gitea |
| 34 | `quay` | centralCluster/ | 35 | Quay central |
| 35 | `quayServices` | servicesCluster/ | 35 | Quay services |
| 36 | `aap` | servicesCluster/ | 30 | AAP controller+EDA |

### Group 7 — Core Operators

| # | App Key | Template | Wave | Notes |
|---|---------|----------|------|-------|
| 37 | `entityOperator` | hybridSovereignOperators/ | 38 | |
| 38 | `teamOperator` | hybridSovereignOperators/ | 38 | |
| 39 | `projectOperator` | hybridSovereignOperators/ | 38 | |
| 40 | `assignmentOperator` | hybridSovereignOperators/ | 39 | |
| 41 | `platformOpenshiftOperator` | hybridSovereignOperators/ | 38 | |

### Group 8 — Plugin Operators

| # | App Key | Template | Wave | Notes |
|---|---------|----------|------|-------|
| 42 | `pluginRbac` | hybridSovereignOperators/ | 39 | |
| 43 | `pluginVault` | hybridSovereignOperators/ | 39 | |
| 44 | `pluginAap` | hybridSovereignOperators/ | 39 | |
| 45 | `pluginQuay` | hybridSovereignOperators/ | 39 | |
| 46 | `pluginSdx` | servicesCluster/ | 33 | Replaces deprecated `pluginIaac` |

### Group 9 — Dashboards

| # | App Key | Template | Wave | Notes |
|---|---------|----------|------|-------|
| 47 | `sovereignDashboard` | hybridSovereignOperators/ | 40 | User dashboard |
| 48 | `tenancyDashboard` | hybridSovereignOperators/ | 41 | Tenancy dashboard |

## Intervention Procedure

If ArgoCD sync fails for an application:

1. Investigate: `oc get application <name> -n openshift-gitops -o yaml`
2. Check pod logs: `oc logs -n <ns> -l app=<name>`
3. Fix the Helm chart or values
4. Uninstall: set `enabled: false` in values.yaml, commit, wait for ArgoCD to prune
5. Reinstall: set `enabled: true`, commit, wait for `Synced + Healthy`
6. Only proceed to next application after current is `Synced + Healthy`

---

## Deployment Status (As of 2026-05-14)

### ✅ Completed Groups

| Group | Status | Notes |
|-------|--------|-------|
| Group 1-4 (Infrastructure) | ✅ Synced/Healthy | Vault, Keycloak, ESO, namespaces |
| Group 5 (Keycloak Config) | ✅ Synced/Healthy | Realms, groups, clients, OIDC auth configured |
| Group 6 (Platform Services - partial) | ✅ Gitea deployed | Quay and AAP pending |
| Group 7 (Core Operators) | ✅ Synced/Healthy | Entity, Team, Project, Assignment, PlatformOpenshift |
| Group 8 (Plugin Operators) | ✅ Synced/Healthy | RBAC, Vault, AAP, Quay, SDX plugins |
| Group 9 (Dashboards) | ✅ Synced/Healthy | Sovereign + Tenancy dashboards |

### Sample CRs Deployed (All READY)

| Resource | Count | Namespaces |
|----------|-------|-----------|
| Entity | 2 | sovereign-cloud (acme-corp, globex-industries) |
| Team | 2 | entity-acme-corp, entity-globex-industries |
| Project | 2 | entity-acme-corp, entity-globex-industries |
| Assignment | 2 | entity-acme-corp, entity-globex-industries |
| PlatformOpenshift | 2 | entity-acme-corp, entity-globex-industries |
| Rbac | 3 | entity-acme-corp (x2), entity-globex-industries (x1) |
| Vault | 2 | entity-acme-corp, entity-globex-industries |
| VaultKV | 2 | entity-acme-corp, entity-globex-industries |
| AAPOrg | 2 | entity-acme-corp, entity-globex-industries (pending AAP) |
| QuayOrg | 2 | entity-acme-corp, entity-globex-industries (pending Quay) |

### Key Deployment Fixes Applied

1. **Ansible-runner image rebuild required** for new playbooks (baked into image)
2. **Entity CRs created via job** not chart samples (billingID case mismatch)
3. **AAPOrg/QuayOrg CRs created via job** (spec.config → spec.aapConfig/quayConfig)
4. **ServerSideApply removed** from all operator Applications (CRD schema mismatches)
5. **ignoreDifferences added** for Namespace labels and ESO-managed ExternalSecret fields
6. **operator-samples job** at wave 45 creates all sample CRs and triggers resync

### Pending

- Quay (central + services clusters) - `enabled: false`, pending ODF prerequisites
- AAP (services cluster) - `enabled: true` but AAPOrg CRs pending AAP backend
- CrunchyData operator - explicitly excluded per user request

