# Hardening Check — Sovereign Namespaces

**Chart:** `bootstrap/helm/charts/sovereign-namespaces`
**Clusters:** Central + Services
**Namespace:** cluster-scoped

## Topology

| Cluster | Namespaces |
|---|---|
| Central | `sovereign-cloud-jobs`, `sovereign-cloud-helpers` |
| Services | `sovereign-cloud`, `sovereign-cloud-plugins` |

## Checks

| Check | Status | Notes |
|---|---|---|
| Namespaces are dedicated per function | PASS | Jobs/helpers on central, workloads/plugins on services |
| No default privileges | PASS | Namespaces created empty |
| Separate ArgoCD Applications per cluster | PASS | `sovereign-namespaces-central` + `sovereign-namespaces-services` |
| Services namespaces target correct cluster | PASS | `destination.server` points to services cluster URL |
| Central namespaces target local cluster | PASS | `destination.server: https://kubernetes.default.svc` |
| sovereign-cloud-helpers reserved for future | INFO | No helper operators yet; namespace pre-created |
