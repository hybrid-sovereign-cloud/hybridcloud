# Developer Tutorial: OpenShift Virtualization and MTV Setup

## Prerequisites

- `oc` logged in to central cluster
- `make check-env` passes
- `VMWARE_HOST`, `VMWARE_USERNAME`, `VMWARE_PASSWORD` set in environment
- Vault central is initialized and the `vmwareInit` job is expected to run

## Step 1: Upload Charts to OCI

```bash
cd bootstrap

# Upload CNV chart (first time or after any chart change)
make upload-cnv-chart

# Upload MTV chart
make upload-mtv-chart
```

## Step 2: Commit and Push to Enable ArgoCD Applications

```bash
git add bootstrap/helm/central/values.yaml bootstrap/helm/central/Chart.yaml
git commit -m "feat(phase-1): enable cnv mtv ArgoCD applications"
git push origin 009-install-virtualization-vmware
```

Trigger ArgoCD to pick up the change immediately:
```bash
oc annotate application sovereign-central-apps -n openshift-gitops \
  argocd.argoproj.io/refresh=hard --overwrite
```

## Step 3: Seed VMware Credentials

```bash
cd bootstrap
make init-central-secrets
```

Then wait for `vmwareInit` Job to complete:
```bash
oc get job -n sovereign-cloud-jobs | grep vmware
# Completed
```

## Step 4: Verify CNV

```bash
oc get hyperconverged kubevirt-hyperconverged -n openshift-cnv \
  -o jsonpath='{.status.conditions[?(@.type=="Available")].status}'
# True

oc get pdb -n openshift-cnv
# virt-api-pdb, virt-controller-pdb
```

## Step 5: Verify MTV Provider

```bash
oc get externalsecret vmware-vcenter-es -n openshift-mtv
# READY=True, STATUS=SecretSynced

oc get provider vmware-vcenter -n openshift-mtv \
  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
# True

oc describe provider vmware-vcenter -n openshift-mtv | grep -A5 Inventory
```

## Troubleshooting

**HyperConverged stuck in Progressing**: Check OLM is healthy — `oc get csv -n openshift-cnv`. If the CSV shows `Failed`, check node resources.

**ExternalSecret showing SecretSyncedError**: The `vmwareInit` Job may not have completed yet. Check: `oc logs -n sovereign-cloud-jobs $(oc get pod -n sovereign-cloud-jobs -l job-name=vmware-init -o name)`.

**Provider NotReady**: Check `oc describe provider vmware-vcenter -n openshift-mtv`. Common cause: incorrect `VMWARE_HOST` (must be hostname reachable from cluster) or TLS cert mismatch (set `vmware.cacert` in production).

## Making Chart Changes

1. Edit files in `bootstrap/helm/charts/openshift-cnv/` or `bootstrap/helm/charts/openshift-mtv/`
2. Bump `version:` in the chart's `Chart.yaml`
3. Run `helm lint bootstrap/helm/charts/<chart>/`
4. Run `make upload-<chart>-chart`
5. Update `<chart>.chartVersion` in `bootstrap/helm/central/values.yaml`
6. Bump `bootstrap/helm/central/Chart.yaml` version
7. Commit + push + ArgoCD refresh
