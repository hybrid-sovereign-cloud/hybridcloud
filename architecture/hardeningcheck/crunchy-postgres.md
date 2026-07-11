# Hardening Check — Crunchy Postgres for Kubernetes

**Chart:** `bootstrap/helm/charts/crunchy-postgres`
**Cluster:** Both
**Namespace:** `openshift-operators`

## Checks

| Check | Status | Notes |
|---|---|---|
| Operator from `certified-operators` | PASS | Package `crunchy-postgres-operator`, channel v5 |
| Cluster-scoped installation | PASS | Manages PG in any namespace |
| HA PostgresCluster instances | TODO | Dedicated instances per service |
