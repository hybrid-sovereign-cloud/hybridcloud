# Hardening Check — UI (Dashboards + Console Plugins)

**Retested**: 2026-07-15  
**Cluster**: Services · Namespace: `sovereign-cloud`

## Deployed versions (match `bootstrap/helm/central/values.yaml`)

| App | Image | ArgoCD |
|-----|-------|--------|
| `sovereign-cloud-dashboard` | `…/sovereign-cloud-dashboard:1.9.4` | Synced / Healthy |
| `tenancy-dashboard` | `…/tenancy-dashboard:4.1.8` | Synced / Healthy |
| `sovereign-admin-plugin` | `…/sovereign-admin-plugin:1.1.5` | Synced / Healthy |
| `sovereign-tenant-plugin` | `…/sovereign-tenant-plugin:1.1.7` | Synced / Healthy |

Source: `hybridcloud/ui/packages/{admin,tenant}-{dashboard,console-plugin}`.  
Image build/push automation is **not yet** in the monorepo (no Dockerfile under `ui/`); deploy pins OCI tags via GitOps.

## Controls

| # | Control | Result | Notes |
|---|---------|--------|-------|
| 1 | OAuth proxy in front of dashboards | PASS | `ose-oauth-proxy:v4.14` sidecar |
| 2 | OAuth secrets from Vault | PASS | ExternalSecret paths `dashboard-oauth`, `tenancy-dashboard-oauth` |
| 3 | User token for K8s API (not pod SA for CRUD) | PASS | Design in C4 UI + dashboard docs |
| 4 | Console plugins on services only | PASS | Deployments in `sovereign-cloud` |
| 5 | Pull secrets for Quay | PASS | `quay-pull-secret` |

## Gaps

| ID | Gap | Severity |
|----|-----|----------|
| UI-001 | No monorepo `make` image build-push for UI | MED — rebuilds require external pipeline |
| UI-002 | Chart sources for standalone dashboards not in `bootstrap/helm/charts/` | MED — charts still pulled from OCI only |
