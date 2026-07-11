# Technical: Migration Toolkit for Virtualization (MTV)

## Overview

MTV is deployed on the central cluster via the `mtv` ArgoCD Application (syncWave `"28"`), which references the `openshift-mtv` Helm chart at `oci://quay.example.com/hybrid-sovereign/openshift-mtv`.

## ArgoCD Application

| Field | Value |
|---|---|
| Application name | `mtv` |
| ArgoCD project | `central` |
| Destination cluster | `https://kubernetes.default.svc` (central) |
| Destination namespace | `openshift-mtv` |
| Sync wave | `28` |
| Self-heal | true |
| Prune | true |

## Chart Resources

| Resource | Kind | Notes |
|---|---|---|
| `openshift-mtv` | Namespace | Created at wave `-1` |
| `openshift-mtv-operatorgroup` | OperatorGroup | Targets `openshift-mtv` namespace |
| `mtv-operator` | Subscription | Channel: `release-v2.7`, source: `redhat-operators` |
| `vmware-vcenter-es` | ExternalSecret | Wave `3`; pulls from Vault → `vmware-vcenter-secret` |
| `forklift-controller` | ForkliftController | Wave `5`; `controller_replicas: 2`, `ui_replicas: 2` |
| `vmware-vcenter` | Provider | Wave `6`; type `vsphere`, references `vmware-vcenter-secret` |
| `mtv-controller-pdb` | PodDisruptionBudget | `minAvailable: 1`, selector `app=forklift-controller` |

## VMware Credential Flow

```
VMWARE_HOST/USERNAME/PASSWORD (env vars on bastion)
  ↓ make init-central-secrets
  ↓ sovereign-init init chart (--set vmware.*)
  ↓ vmware-bootstrap-credentials Secret (sovereign-cloud-jobs)
  ↓ vmwareInit Ansible Job (sovereignJobs, wave 24)
  ↓ Vault KV central/data/vmware-credentials
  ↓ vmware-vcenter-es ExternalSecret (openshift-mtv, wave 3)
  ↓ vmware-vcenter-secret Kubernetes Secret (openshift-mtv)
  ↓ vmware-vcenter Provider CR (openshift-mtv, wave 6)
```

## Vault Secret Structure

Path: `central/data/vmware-credentials`

| Key | Description |
|---|---|
| `url` | `https://<VMWARE_HOST>` |
| `username` | vCenter service account username |
| `password` | vCenter service account password |
| `cacert` | PEM CA certificate (empty in lab; required in production) |

## Expected Status

```bash
# Provider ready
oc get provider vmware-vcenter -n openshift-mtv \
  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
# True

# ExternalSecret synced
oc get externalsecret vmware-vcenter-es -n openshift-mtv \
  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
# True
```

## Rotating VMware Credentials

1. Update `VMWARE_PASSWORD` in `~/.bashrc` and export
2. Run `make init-central-secrets` (re-seeds `vmware-bootstrap-credentials` Secret)
3. Delete the `vmwareInit` Job so ArgoCD recreates it:
   ```bash
   oc delete job -n sovereign-cloud-jobs -l app.kubernetes.io/name=vmware-init
   ```
4. ArgoCD recreates the Job at next sync; new credentials written to Vault
5. ExternalSecret TTL expires and re-syncs automatically (default: 1h)

## Dashboard Integration

MTV does not currently expose CRDs consumed by `user_dashboard` or `tenancy_dashboard`. If migration management is added to dashboards in a future feature, this section must be updated.
