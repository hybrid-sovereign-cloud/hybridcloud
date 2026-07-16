# 44 — Assignment CR Cleanup Flow

## Overview

When an `Assignment` CR is deleted, the operator must clean up the spoke-cluster
namespaces and RoleBindings that were created for it. This is done via a finalizer chain
across two clusters.

## Cleanup Chain

```
Assignment CR deleted (services cluster)
  │
  └─→ assignment_delete finalizer role (services cluster)
        │
        ├── Read Assignment status → helperName, helperProvider
        ├── If helperName is empty (never provisioned) → skip (meta: end_play)
        └── DELETE /apis/helper.hybridsovereign.redhat/v1alpha1/namespaces/
            sovereign-cloud-helpers/osohelpers/<helperName>   (openstack)
            OR awshelpers/<helperName>   (aws)
                │
                └─→ OSOHelper/AWSHelper finalizer (osohelper_delete / awshelper_delete)
                      │
                      └─→ delete_assignment.yml
                            │
                            ├── Fetch kubeconfig for spoke cluster from Vault
                            └── helm uninstall <entity>-<team>-assignment -n <spoke-ns>
                                  │
                                  └── Removes: namespaces, RoleBindings on spoke cluster
```

## Key Files

| File | Purpose |
|------|---------|
| `Assignment/operator/watches.yaml` | Declares finalizer `hybridsovereign.redhat/assignment-cleanup` pointing to `assignment_delete` role |
| `Assignment/operator/roles/assignment_delete/tasks/main.yml` | Reads helper facts, issues DELETE to central cluster |
| `Assignment/operator/roles/assignment/tasks/main.yml` | Sets `status.helperProvider` (openstack\|aws) needed by delete role |

## Status Fields Used for Delete

The `assignment_delete` role reads two status fields from the Assignment CR:

| Field | Set By | Purpose |
|-------|--------|---------|
| `status.helperName` | `assignment/tasks/main.yml` | Name of OSOHelper/AWSHelper to delete |
| `status.helperProvider` | `assignment/tasks/main.yml` | `openstack` or `aws` — selects which SA secret to use |

## Cross-Cluster SA Authentication

The `assignment_delete` role authenticates to the central cluster using:
- `status.helperProvider == openstack` → reads `Secret/osohelper-creator-sa` in `sovereign-cloud`
- `status.helperProvider == aws` → reads `Secret/awshelper-creator-sa` in `sovereign-cloud`

These secrets contain the `token` and `ca.crt` for the central cluster SA.

## Known Gap (Production Hardening)

If the `osohelper-creator-sa` or `awshelper-creator-sa` secret is expired or rotated
between Assignment creation and deletion, the delete role will fail the `assert` step and
the finalizer will not be cleared. Manual cleanup:
1. `oc patch assignment <name> -n <ns> --type json -p '[{"op":"remove","path":"/metadata/finalizers"}]'`
2. Manually delete the orphaned OSOHelper/AWSHelper on the central cluster

This is documented in `architecture/hardeningcheck/003-fix-ocp-cloudrbac-cleanup-ocp.md`.

## Chart Version

Assignment operator chart bumped 0.4.6 → 0.4.8 in feature `003`.
