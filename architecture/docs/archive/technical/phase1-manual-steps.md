# Phase 1 Bootstrap — Manual Steps

This document identifies all operations that **cannot** be fully automated through ArgoCD
and require explicit operator action before the corresponding sovereign job or ArgoCD sync
wave can complete.

## Bootstrap Run Order

```
make upload-all-charts          # upload all Helm charts to OCI
make ansible-runner             # build and push ansible-runner image
make init-central-argo          # install GitOps operator + ArgoCD
make init-central-secrets       # seed bootstrap secrets
make init-central-applicationset  # deploy ApplicationSet → ArgoCD takes over
```

After `init-central-applicationset`, monitor waves and run the manual steps below at the
correct wave boundaries.

---

## Manual Steps Required During Sync

### 1. AAP Subscription Manifest (before wave 31)

The `aapLicenseCentral` and `aapLicenseServices` sovereign jobs (wave 31) read the AAP
manifest from Vault at path `central/aap-manifest`. Store it after the `vaultKv` job
(wave 24) creates the KV engine structure.

**Check wave 24 completed:**
```bash
oc get jobs -n sovereign-cloud-jobs -l app.kubernetes.io/name=job-vault-kv
```

**Action:**
```bash
# AAP_MANIFEST must be set to the path of the manifest ZIP file
make aap-load-manifest
```

---

### 2. OpenStack Credentials (before cloud operators run, wave 38)

The `cloudOSOOperator` (wave 38) reads OpenStack credentials from Vault at path
`central/openstack-credentials`. Seed them after the `vaultKv` job (wave 24).

**Action:**
```bash
# OSO_CLOUDS must be set to the path of the clouds.yaml file
make upload-oso-creds
```

---

### 3. AWS Credentials (before cloud operators run, wave 39)

The `cloudAWSOperator` (wave 39) reads AWS credentials from Vault at path
`central/aws-credentials`. Seed them after the `vaultKv` job (wave 24).

**Action:**
```bash
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ACCOUNT_ID must be set
make upload-aws-creds
```

---

### 4. EventForwarder Event Stream URL (after wave 32)

The `eventForwarder` on the services cluster uses an EDA-generated UUID that is only known
after the `edaConfig` sovereign job (wave 32) runs.

**When to act:** After `edaConfig` job (wave 32) completes successfully.

**Action:**

1. Get the event stream URL from AAP EDA job logs:
```bash
oc logs -n sovereign-cloud-jobs \
  -l app.kubernetes.io/name=job-eda-config \
  --tail=100 | grep -i event_stream
```

2. Update `helm/central/values.yaml`:
```yaml
eventForwarder:
  eventStreamUrl: "https://sovereign-aap-aap.apps.central.lab.example.com/eda-event-streams/api/eda/v1/external_event_stream/<NEW-UUID>/post/"
```

3. Commit, push, and let ArgoCD sync the `event-forwarder` Application.

---

## Verification Steps

### Vault Init (wave 23)
```bash
oc get jobs -n sovereign-cloud-jobs -l app.kubernetes.io/name=job-vault-init
# Then verify Vault is unsealed:
oc exec -n central-vault vault-0 -- vault status
```

### Services Vault Init (wave 29)
```bash
oc get jobs -n sovereign-cloud-jobs -l app.kubernetes.io/name=job-vault-services-init
```

### Quay Admin Init (wave 37)
The `quayCentralConfig` and `quayServicesConfig` sovereign jobs (wave 37) automatically
initialize the Quay superuser `sovereign_admin`, store credentials in Vault, and configure
OIDC with the respective RHBK instance. No manual action required.

Monitor with:
```bash
oc get jobs -n sovereign-cloud-jobs | grep quay
oc logs -n sovereign-cloud-jobs -l app.kubernetes.io/name=job-quay-central-config
```

### ACS Cluster Registration (wave 36)
The `acsConfig` sovereign job (wave 36) registers both central and services clusters in
ACS and configures OIDC with central RHBK. No manual action required.

Monitor with:
```bash
oc get jobs -n sovereign-cloud-jobs | grep acs
oc logs -n sovereign-cloud-jobs -l app.kubernetes.io/name=job-acs-config
```

---

## Summary Table

| Step | When | Make Command / Action |
|------|------|----------------------|
| Seed AAP manifest | After wave 24 (vaultKv) | `make aap-load-manifest` |
| Seed OpenStack creds | After wave 24 (vaultKv) | `make upload-oso-creds` |
| Seed AWS creds | After wave 24 (vaultKv) | `make upload-aws-creds` |
| Update EventForwarder URL | After wave 32 (edaConfig) | Edit `values.yaml`, commit, push |
| Verify Vault unseal | After wave 23 (vaultInit) | `oc exec vault-0 -- vault status` |
| Verify Services Vault | After wave 29 (vaultServicesInit) | `oc get jobs` |
| Re-run EDA config | Any time after wave 32 | `make eda-sync` |

---

## Notes on Automated Steps

### ESO PushSecrets on Fresh Clusters

On a fresh cluster where External Secrets Operator (ESO) CRDs are not yet installed,
`make init-central-secrets` and `make init-central-applicationset` automatically detect
the missing CRDs and skip the OCI credential PushSecret. After ESO is deployed (wave 5)
and the Vault ClusterSecretStore is configured (wave 22), re-run `make init-central-secrets`
to activate the PushSecret.

### EDA Decision Environment Image Pulls

EDA activation pods pull Decision Environment images from `quay.example.com/hybrid-sovereign`.
The `quay-pull-secret` is automatically created in the `aap` namespace via `make init-central-secrets`.
If EDA activations fail with image pull errors, verify the pull secret is linked:

```bash
oc get serviceaccount sovereign-aap-eda -n aap -o jsonpath='{.imagePullSecrets}'
# If not linked:
oc secrets link sovereign-aap-eda quay-pull-secret --for=pull -n aap
make eda-sync
```
