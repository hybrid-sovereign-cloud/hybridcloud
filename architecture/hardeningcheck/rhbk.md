# Hardening Check — Keycloak (RHBK)

**Chart:** `bootstrap/helm/charts/rhbk`
**Cluster:** Both
**Namespace:** `rhbk`

## Checks

| Check | Status | Notes |
|---|---|---|
| HA mode (2 instances) | PASS | Both clusters |
| Dedicated namespace (`rhbk`) | PASS | Isolated from workloads |
| Operator v26.4 from `redhat-operators` | PASS | Certified RHBK operator |
| Client secrets are K8s Secrets | PASS | Not in Git; created by Ansible |
| Realm creation via REST API | PASS | Bearer token auth, not stored |
| Admin token short-lived (60s) | PASS | Obtained per operation batch |
| Ansible job uses cluster-admin SA | REVIEW | Scope down to namespace-admin |
| Secrets stored in Vault KV | PASS | Delivered via External Secrets |
| Dev mode (HTTP, embedded DB) | REVIEW | Switch to TLS + PostgreSQL for production |
