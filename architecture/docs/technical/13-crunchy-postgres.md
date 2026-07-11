# Crunchy Postgres for Kubernetes (PGO)

## Overview

Crunchy Postgres for Kubernetes provides production-grade PostgreSQL clusters
with HA, automated backups, and monitoring for use by RHBK, AAP, and Quay.

## Deployment

| Component | Cluster | Namespace |
|-----------|---------|-----------|
| Operator | Both | `openshift-operators` |

## Chart: `bootstrap/helm/charts/crunchy-postgres`

- **Operator**: OLM Subscription (`crunchy-postgres-operator`) from `certified-operators`, channel `v5`
- Cluster-scoped installation (no OperatorGroup needed in `openshift-operators`)

## ArgoCD Applications

- `crunchy-postgres-central` — operator on central cluster
- `crunchy-postgres-services` — operator on services cluster

## PostgresCluster Instances (Planned)

Once the operator is running, dedicated `PostgresCluster` CRs will be created for:
- RHBK (both clusters) — HA Postgres for Keycloak
- AAP (services cluster) — HA Postgres for Automation Platform
- Quay (both clusters) — HA Postgres for registry
