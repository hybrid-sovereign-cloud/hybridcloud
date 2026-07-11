# Plugin RBAC Operator — Technical Reference

**Version:** refactorrbac v1.0
**Cluster:** Services
**Namespace:** `sovereign-cloud-plugins`
**CRD group:** `hybridsovereign.redhat`

## CRDs

### RbacConfig

```yaml
apiVersion: hybridsovereign.redhat/v1alpha1
kind: RbacConfig
metadata:
  name: keycloak-sovereign-tenants-services
  namespace: sovereign-cloud-plugins
spec:
  type: keycloak
  secret: rhbk-services-admin   # ExternalSecret-managed admin creds
```

**Status fields:**

| Field | Description |
|---|---|
| `clientId` | Keycloak OIDC client ID created |
| `clientSecretName` | ExternalSecret name delivering client creds |
| `vaultPath` | Vault KV path: `central/plugin-rbac/<name>` |
| `ready` | `true` when reconcile completes |

**Secret delivery chain** (Constitution Principle I):

```
Keycloak OIDC client secret
  → operator writes to Vault KV central/plugin-rbac/<name>
  → ExternalSecret reads from Vault
  → K8s Secret <name>-client (creationPolicy: Owner)
```

The operator **never** creates a `kind: Secret` directly.

### Rbac

```yaml
apiVersion: hybridsovereign.redhat/v1alpha1
kind: Rbac
metadata:
  name: acme-platform-admins
  namespace: entity-acme-corp
spec:
  config: keycloak-sovereign-tenants-services
  description: "Platform administrators for ACME Corp"
```

**Status fields:**

| Field | Description |
|---|---|
| `group` | Keycloak group path (`entity-name/rbac-name`) — consumed by Entity operator |
| `ready` | `true` when Keycloak group is reconciled |

## Reconciliation Flow

### RbacConfig reconcile

```
RbacConfig CR applied
  → Assert namespace == sovereign-cloud-plugins
  → Read admin Secret (ExternalSecret-managed)
  → Obtain Keycloak admin token (no_log)
  → Create/update OIDC client (confidential, serviceAccountsEnabled)
  → Assign realm-management roles to service account
  → Retrieve client secret from Keycloak (no_log)
  → Write {client_id, client_secret, keycloak_url} to Vault central/plugin-rbac/<name>
  → Create ExternalSecret → K8s Secret <name>-client
  → Update status.clientSecretName, status.vaultPath, status.ready=true
```

### Rbac reconcile

```
Rbac CR applied in entity namespace
  → Validate namespace has hybridsovereign.redhat/entity label
  → Read RbacConfig status.clientSecretName
  → Obtain service account token via client_credentials (no_log)
  → Ensure parent entity group exists in Keycloak
  → Create/update subgroup <entity-name>/<rbac-name>
  → Set subgroup attributes (entity, billing-id, config, namespace)
  → Update status.group = <entity-name>/<rbac-name>
  → Update status.ready=true
```

### Rbac finalizer

```
Rbac CR deleted
  → Delete Keycloak subgroup
  → Count remaining Rbac CRs in namespace (excluding self)
  → If count == 0: delete parent entity group from Keycloak
  → Emit Deleted event
```

### RbacConfig finalizer

```
RbacConfig CR deleted
  → Delete Keycloak OIDC client
  → Read vault-init-secrets for root token (no_log)
  → DELETE central/metadata/plugin-rbac/<name> in Vault
  → Delete ExternalSecret <name>-client
```

## Security — no_log Coverage

All tasks that handle credentials use `no_log: true`:

- Decode admin/service credentials (`b64decode` set_fact)
- Obtain Keycloak access token (URI task + token set_fact)
- Read/decode Vault root token
- Write to Vault KV
- Retrieve Keycloak client secret

## Performance at Scale

See `architecture/hardeningcheck/plugin-rbac.md` for full scaling guidance.

Key patterns:
- Token obtained **once per reconcile** — not per-loop iteration
- Keycloak `group-by-path` endpoint used for O(1) group lookup
- Parent group deletion only fires when last Rbac CR is removed (sibling count check via K8s API cache)

## Helm chart values

| Key | Default | Purpose |
|---|---|---|
| `samples.enabled` | `true` | Deploy sample Rbac CRs for all three tenants |
| `defaultRbacConfig.enabled` | `true` | Deploy default RbacConfig pointing to Keycloak |
| `externalSecret.enabled` | `true` | Deploy ExternalSecret for admin credentials |
| `replicas` | `1` | Set to `2` for HA in production |
| `resources.limits.cpu` | `500m` | Increase for high-throughput reconciliation |
