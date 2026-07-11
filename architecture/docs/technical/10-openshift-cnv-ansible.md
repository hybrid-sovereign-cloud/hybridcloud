# Ansible Flow: VMware Credential Bootstrap (vmware-init role)

## Role Location

`bootstrap/ansible/roles/vmware-init/`

## Playbook

`bootstrap/ansible/project/vmware-init.yml`

## Trigger

The `vmwareInit` sovereignJob in `bootstrap/helm/central/values.yaml` runs this playbook as a Kubernetes Job (syncWave `"24"`, after Vault KV engine is available at wave `"24"`).

## Task Sequence

```
1. Read vmware-bootstrap-credentials Secret from sovereign-cloud-jobs
   (kubernetes.core.k8s_info, retries: 10, no_log: true)

2. Decode host/username/password/cacert fields from base64
   (set_fact, no_log: true)

3. Retrieve Vault root token from vault-init-secrets Secret
   (kubernetes.core.k8s_info, no_log: true)

4. POST to Vault KV v2 API: central/data/vmware-credentials
   (uri module, POST, no_log: true)
   Body: { data: { url, username, password, cacert } }

5. Log confirmation message (no credential values exposed)
```

## Idempotency

The `uri` POST to Vault KV v2 creates a new version if the path already exists. This is safe and idempotent — re-running after credential rotation writes version N+1 to Vault, and the ExternalSecret picks up the new version at its next refresh interval (default: 1h).

## no_log Usage

All four credential-handling tasks use `no_log: true`. The confirmation debug task does NOT use `no_log` and only prints the path, not any values.

## Variables

| Variable | Default | Source |
|---|---|---|
| `vault_addr` | `http://vault.central-vault.svc:8200` | Env var `VAULT_ADDR` |
| `vault_namespace` | `central-vault` | Env var `VAULT_NAMESPACE` |
| `vault_kv_path` | `central` | Role default |
| `vault_secret_name` | `vault-init-secrets` | Role default |
| `vmware_vault_key` | `vmware-credentials` | Role default |
