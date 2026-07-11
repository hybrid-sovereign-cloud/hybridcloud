# Day-2 Operations: Keycloak (RHBK)

## Overview

Two Keycloak (Red Hat Build of Keycloak v26.4) instances run in HA mode:

| Instance | Cluster | Namespace | Realm |
|----------|---------|-----------|-------|
| central-keycloak | Central | `rhbk` | `sovereign-central` |
| services-keycloak | Services | `rhbk` | `sovereign-tenants` |

Both are managed by the `rhbk-operator` (OLM subscription) and configured by Ansible jobs.

## Prerequisites

- `oc` CLI with access to the relevant cluster
- Keycloak admin credentials from Vault:
  - `central/data/rhbk-central-admin` — central admin credentials
  - `central/data/rhbk-services-admin` — services admin credentials

---

## 1. Accessing the Keycloak Admin Console

```bash
# Retrieve admin credentials
ADMIN_PASS=$(vault kv get -field=password central/data/rhbk-central-admin)
ADMIN_USER=$(vault kv get -field=username central/data/rhbk-central-admin)

# Get the route
KEYCLOAK_URL=$(oc get route -n rhbk -o jsonpath='{.items[0].spec.host}')
echo "https://$KEYCLOAK_URL"
```

Log in at `https://<route>/admin` with the retrieved credentials.

---

## 2. Realm Management

### List realms

```bash
# Using Keycloak REST API
TOKEN=$(curl -s -X POST \
  "https://$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli&grant_type=password&username=$ADMIN_USER&password=$ADMIN_PASS" \
  | jq -r '.access_token')

curl -s -H "Authorization: Bearer $TOKEN" \
  "https://$KEYCLOAK_URL/admin/realms" | jq '.[].realm'
```

### Create a new realm

New realms should be created via the Ansible `keycloak-realms` role (playbook `configure-keycloak.yml`). Do not create realms manually — they will not persist configuration across operator reconciliation.

To add a new realm, update `bootstrap/ansible/roles/keycloak-realms/defaults/main.yml` and trigger a re-run of the `keycloak-realms` job via ArgoCD.

---

## 3. Client Management

### Add a new OIDC client

Update the `keycloak-clients` Ansible role defaults to include the new client definition, then sync the `keycloak-clients` ArgoCD Application to re-run the job.

For a one-off addition via API:

```bash
curl -s -X POST \
  "https://$KEYCLOAK_URL/admin/realms/sovereign-central/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "my-app",
    "enabled": true,
    "protocol": "openid-connect",
    "standardFlowEnabled": true,
    "redirectUris": ["https://my-app.apps.central.lab.example.com/*"],
    "publicClient": false
  }'
```

### Retrieve a client secret

```bash
CLIENT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://$KEYCLOAK_URL/admin/realms/sovereign-central/clients?clientId=my-app" \
  | jq -r '.[0].id')

curl -s -H "Authorization: Bearer $TOKEN" \
  "https://$KEYCLOAK_URL/admin/realms/sovereign-central/clients/$CLIENT_ID/client-secret" \
  | jq -r '.value'
```

Store the secret in Vault immediately:
```bash
vault kv put central/data/my-app-client client_secret="<value>"
```

---

## 4. Group Management

The `sovereign-admin` group must exist in each realm to provide Vault and platform admin access.

### Create a group

```bash
curl -s -X POST \
  "https://$KEYCLOAK_URL/admin/realms/sovereign-central/groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-group"}'
```

### Add a user to a group

```bash
# Get user ID
USER_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://$KEYCLOAK_URL/admin/realms/sovereign-central/users?username=myuser" \
  | jq -r '.[0].id')

# Get group ID
GROUP_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://$KEYCLOAK_URL/admin/realms/sovereign-central/groups?search=my-group" \
  | jq -r '.[0].id')

# Add to group
curl -s -X PUT \
  "https://$KEYCLOAK_URL/admin/realms/sovereign-central/users/$USER_ID/groups/$GROUP_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. OpenShift OAuth Integration

Keycloak acts as the OpenShift identity provider on both clusters. The integration is configured by the `keycloak-oauth` Ansible role.

### Verify OAuth is working

```bash
# Check OAuth cluster config
oc get oauth cluster -o yaml | grep keycloak

# Check that the CA configmap was created
oc get configmap keycloak-services-ca -n openshift-config
```

### Reconfigure after certificate rotation

If the ingress CA is rotated, the `keycloak-services-ca` ConfigMap must be updated:

```bash
# Extract new CA
oc get configmap default-ingress-cert \
  -n openshift-config-managed \
  -o jsonpath='{.data.ca-bundle\.crt}' > ingress-ca.pem

# Update configmap
oc create configmap keycloak-services-ca \
  -n openshift-config \
  --from-file=ca.crt=ingress-ca.pem \
  --dry-run=client -o yaml | oc apply -f -
```

---

## 6. OIDC Debug

### Test OIDC token issuance

```bash
# Get a token for a user
curl -s -X POST \
  "https://$KEYCLOAK_URL/realms/sovereign-central/protocol/openid-connect/token" \
  -d "client_id=sovereign-central&grant_type=password&username=myuser&password=mypass&scope=openid" \
  | jq .

# Decode the access token
echo "<access_token>" | cut -d. -f2 | base64 -d | jq .
```

### Check group claim in token

The token must include `groups` claim with the user's group memberships. If groups are missing:
1. Open Keycloak Admin Console → Client → sovereign-central → Client Scopes
2. Add a "Groups" mapper: type `Group Membership`, token claim name `groups`, full group path `false`

---

## 7. Vault OIDC Integration Troubleshooting

```bash
# Verify OIDC discovery URL is reachable from within the cluster
oc exec -n vault vault-0 -- curl -sk \
  "https://rhbk-central.apps.central.lab.example.com/realms/sovereign-central/.well-known/openid-configuration" \
  | jq .issuer

# Check Vault OIDC auth config
VAULT_TOKEN=<root_or_admin_token> vault auth list
VAULT_TOKEN=<root_or_admin_token> vault read auth/oidc/config
```

Common issues:
- **`oidc_discovery_ca_pem` not set** — Vault cannot verify the Keycloak TLS certificate. Re-run the `vaultOidcAuth` job.
- **Invalid redirect_uri** — Add the Vault UI callback URI to the Keycloak client's allowed redirect URIs.
- **Groups claim missing** — Add the groups mapper to the `vault` client scope (see above).

---

## Related Documentation

- [06-keycloak.md](../technical/06-keycloak.md) — Architecture reference
- [31-keycloak-vault-integration.md](../technical/31-keycloak-vault-integration.md) — Keycloak-Vault OIDC integration
- [01-day2-vault.md](01-day2-vault.md) — Vault operations
