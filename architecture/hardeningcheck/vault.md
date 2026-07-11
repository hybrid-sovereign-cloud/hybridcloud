# Hardening Check — Vault

**Charts:** `bootstrap/helm/charts/vault` (central + services)
**Clusters:** Central (vault-central), Services (vault-services)
**Namespace:** `vault`

## Checks

| Check | Status | Notes |
|-------|--------|-------|
| HA Raft mode (3 replicas) | PASS | Central: no retry_join (single-region). Services: retry_join configured for all 3 pods |
| Images from allowed registry | PASS | Mirrored to `quay.example.com/hybrid-sovereign/` |
| Kubernetes auth for ESO | PASS | kubernetes-central + kubernetes-services mounts on vault-central; kubernetes mount on vault-services |
| OIDC auth for humans | PASS | vault-central → central-keycloak (sovereign-central). vault-services → services-keycloak (sovereign-tenants) |
| sovereign-admin group → admin policy | PASS | Vault OIDC group alias maps `sovereign-admin` to `sovereign-admin-policy` on both vaults |
| Root token NOT used by ESO | PASS | ClusterSecretStore uses k8s auth only. Root token for init jobs only |
| Root token storage | REVIEW | Stored in k8s Secret `vault-init-secrets`. Future: revoke after init, use periodic token rotation |
| Unseal keys storage | REVIEW | Stored in k8s Secrets. Also backed up in vault-central KV and vault-central namespace. Future: use auto-unseal via HSM/Transit |
| No secrets in git | PASS | All secrets removed from values.yaml. Delivered via Vault → ExternalSecret only |
| Audit logging | TODO | Enable Vault audit device (file or syslog). Required for compliance |
| TLS on internal Vault comms | REVIEW | Currently HTTP between pods. Route uses TLS edge termination. Future: mutual TLS between Raft peers |
| vault-services init via ArgoCD | PASS | Separate `vault-services-init` ArgoCD Application (chart + Job) |
| vault-central namespace backup | PASS | `vault-central` namespace contains ExternalSecret-sourced copies of init secrets |
| KV v2 versioning | PASS | `central/` engine is KV v2 |
| ESO policy scope | PASS | `external-secrets-policy` grants only `read`/`list` on `central/*` |
| Admin policy scope | REVIEW | `sovereign-admin-policy` grants full access (`*`). Review if fine-grained policies are needed per team |

## Deviations from Best Practice

| Deviation | Risk | Mitigation |
|-----------|------|------------|
| Root token stored in k8s Secret | High — if cluster is compromised, token is exposed | Post-init rotation planned; use short-lived tokens in future |
| No auto-unseal | High — vault sealed after pod restart | Manual unseal procedure documented. Future: configure Transit or KMS auto-unseal |
| HTTP between vault pods | Medium — eavesdropping within cluster | Network policies restrict vault namespace access. Future: configure vault TLS listener |
| OAuthClient.secret managed by Helm lookup | Low — value can differ briefly from k8s Secret | ArgoCD selfHeal reconciles within minutes. ExternalSecret keeps secret in sync |
