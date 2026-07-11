# Hardening Check — ODF / Noobaa

**Chart:** `bootstrap/helm/charts/odf`
**Cluster:** Both
**Namespace:** `openshift-storage`

## Checks

| Check | Status | Notes |
|---|---|---|
| Noobaa-only deployment | PASS | Minimal footprint |
| S3 endpoints active | PASS | Bucket storage for Quay |
| Operator from `redhat-operators` | PASS | Certified operator |
