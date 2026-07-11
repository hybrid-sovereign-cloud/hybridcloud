# Hardening Check — Quay Registry

**Chart:** `bootstrap/helm/charts/quay`
**Cluster:** Both
**Namespace:** `quay-enterprise`

## Checks

| Check | Status | Notes |
|---|---|---|
| Clair scanning enabled | PASS | Managed component |
| TLS via managed route | PASS | Operator-managed TLS |
| Object storage via Noobaa | PASS | External backend |
