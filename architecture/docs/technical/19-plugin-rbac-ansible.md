# Plugin RBAC Operator — Ansible Backend Flow

**Audience:** Operator developers, platform engineers debugging reconciliation

## Role structure

```
plugin_rbac/operator/roles/
  rbacconfig/          ← RbacConfig reconcile
  rbacconfig_finalizer/ ← RbacConfig delete cleanup
  rbac/                ← Rbac reconcile
  rbac_finalizer/      ← Rbac delete cleanup
```

## RbacConfig — Ansible task flow

### `roles/rbacconfig/tasks/main.yml`

```
T1: Assert namespace == sovereign-cloud-plugins
T2: Read RbacConfig CR
T3: Set facts from spec (type, secret)
T4: Assert type == keycloak
T5: Read Keycloak admin Secret (ExternalSecret-managed)
T6: Decode admin credentials (no_log: true)
T7: Obtain Keycloak admin token (master realm, admin-cli) (no_log: true)
T8: Record admin bearer token (no_log: true)
T9: Look up client by clientId
T10: Create OIDC client if absent (confidential, serviceAccountsEnabled)
T11: Re-lookup client (resolve internal id after create)
T12: Get service account user for client
T13: Look up realm-management client
T14: Get available realm-management roles
T15: Filter to required roles (manage-users, manage-clients, manage-realm, view-users)
T16: Assign roles to service account
T17: Retrieve client secret from Keycloak (no_log: true)
T18: Set credential + Vault path facts (no_log: true)
T19: Read vault-init-secrets for root token
T20: Decode Vault root token (no_log: true)
T21: Write credentials to Vault central/plugin-rbac/<name> (no_log: true)
T22: Create ExternalSecret → K8s Secret <name>-client (creationPolicy: Owner)
T23: Set reconciliation timestamp
T24: Emit reconciliation event
T25: Update RbacConfig status
```

### Key design notes

- T21 uses Vault KV v2 API: `POST /v1/central/data/plugin-rbac/<name>`
- T22 ExternalSecret uses `ClusterSecretStore vault-backend` (central ESO)
- No `kind: Secret` is ever created by the operator

### `roles/rbacconfig_finalizer/tasks/main.yml`

```
T1: Read RbacConfig CR
T2: Proceed only if CR still has spec
T3: Read admin Secret
T4: Decode admin credentials (no_log: true)
T5: Obtain Keycloak admin token (no_log: true)
T6: Record admin token (no_log: true)
T7: Look up OIDC client by clientId
T8: Delete OIDC client if found
T9: Read vault-init-secrets for root token
T10: Decode Vault root token (no_log: true)
T11: DELETE Vault KV metadata/plugin-rbac/<name> (cascading delete) (no_log: true)
T12: Delete ExternalSecret <name>-client
T13: Emit Deleted event
```

## Rbac — Ansible task flow

### `roles/rbac/tasks/main.yml`

```
T1:  Read entity namespace — assert hybridsovereign.redhat/entity label
T2:  Assert label present
T3:  Record entity facts
T4:  Read Rbac CR
T5:  Cache Rbac spec
T6:  Read referenced RbacConfig (retry 6×)
T7:  Assert RbacConfig.status.clientSecretName defined
T8:  Cache RbacConfig status
T9:  Read client credentials Secret (ExternalSecret-managed)
T10: Decode credentials (no_log: true)
T11: Obtain service account token (client_credentials grant) (no_log: true)
T12: Record bearer token (no_log: true)
T13: Look up parent entity group by path
T14: Create parent entity group if absent
T15: Record entity group ID
T16: Look up Rbac subgroup by path
T17: Create subgroup if absent
T18: Resolve final subgroup ID (re-lookup after create)
T19: Build group attributes payload
T20: Update subgroup attributes (PUT)
T21: Set reconciliation timestamp
T22: Emit reconciliation event
T23: Update Rbac status (group, ready, conditions)
```

### `roles/rbac_finalizer/tasks/main.yml`

```
T1: Read namespace for entity name
T2: Determine entity name
T3: Read Rbac CR
T4: [block: proceed if CR has spec]
    T4a: Cache Rbac spec
    T4b: Read RbacConfig
    T4c: Assert clientSecretName defined
    T4d: Cache RbacConfig status
    T4e: Read client Secret
    T4f: Decode credentials (no_log: true)
    T4g: Obtain token (no_log: true)
    T4h: Record token (no_log: true)
    T4i: Build path queries (kc_full_path_query, kc_parent_path_query)
    T4j: Look up subgroup
    T4k: Delete subgroup if found
    T4l: Count remaining Rbac CRs in namespace (excludes self)
    T4m: [when siblings == 0] Look up parent entity group
    T4n: [when siblings == 0] Delete parent entity group
T5: Emit Deleted event
```

## Variable defaults

| Variable | File | Default |
|---|---|---|
| `plugin_rbac_operator_namespace` | rbacconfig/defaults | `sovereign-cloud-plugins` |
| `plugin_rbac_keycloak_internal_url` | rbacconfig/defaults | `http://rhbk-services-service.rhbk.svc:8080` |
| `plugin_rbac_keycloak_realm` | rbacconfig/defaults | `sovereign-tenants` |
| `plugin_rbac_vault_internal_url` | rbacconfig/defaults | `http://vault-central.vault.svc:8200` |

## Debugging

```bash
# Watch rbacconfig reconcile logs
oc logs -n sovereign-cloud-plugins -l control-plane=controller-manager -f | grep -i rbacconfig

# Check ExternalSecret sync status
oc get externalsecret <rbacconfig-name>-client -n sovereign-cloud-plugins

# Inspect Vault KV entry (requires Vault access)
vault kv get central/plugin-rbac/<rbacconfig-name>
```
