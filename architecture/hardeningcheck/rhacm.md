# Hardening Check — RHACM

**Chart:** `bootstrap/helm/charts/rhacm`
**Cluster:** Central only
**Namespace:** `open-cluster-management`

## Checks

| Check | Status | Notes |
|---|---|---|
| SingleNamespace OperatorGroup | PASS | ACM requires this mode |
| Minimal components enabled | PASS | Only console, search, cluster-lifecycle |
| Sourced from `redhat-operators` catalog | PASS | Certified operator |
| `installPlanApproval: Automatic` | REVIEW | Change to `Manual` for air-gapped |
| Never deployed on services cluster | PASS | Architecture constraint |
