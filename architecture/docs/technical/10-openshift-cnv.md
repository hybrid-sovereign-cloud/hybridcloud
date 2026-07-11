# Technical: OpenShift Virtualization (CNV)

## Overview

CNV is deployed on the central cluster via the `cnv` ArgoCD Application (syncWave `"12"`), which references the `openshift-cnv` Helm chart at `oci://quay.example.com/hybrid-sovereign/openshift-cnv`.

## ArgoCD Application

| Field | Value |
|---|---|
| Application name | `cnv` |
| ArgoCD project | `central` |
| Destination cluster | `https://kubernetes.default.svc` (central) |
| Destination namespace | `openshift-cnv` |
| Sync wave | `12` |
| Self-heal | true |
| Prune | true |

## Chart Resources

| Resource | Kind | Notes |
|---|---|---|
| `openshift-cnv` | Namespace | Created at wave `-1` |
| `openshift-cnv-operatorgroup` | OperatorGroup | Targets `openshift-cnv` namespace |
| `kubevirt-hyperconverged-operator-subscription` | Subscription | Channel: `stable`, source: `redhat-operators` |
| `kubevirt-hyperconverged` | HyperConverged | Wave `5`, skips dry-run |
| `virt-api-pdb` | PodDisruptionBudget | `minAvailable: 1`, selector `kubevirt.io=virt-api` |
| `virt-controller-pdb` | PodDisruptionBudget | `minAvailable: 1`, selector `kubevirt.io=virt-controller` |

## HyperConverged CR Configuration

Feature gates are configurable via `cnv.values.hyperconverged.featureGates` in `bootstrap/helm/central/values.yaml`. Default: both `deployKubeSecondaryDNS` and `enableCommonBootImageImport` are disabled to reduce resource consumption.

## Expected Status

After successful deployment:

```bash
oc get hyperconverged kubevirt-hyperconverged -n openshift-cnv \
  -o jsonpath='{.status.conditions[?(@.type=="Available")].status}'
# True

oc get deployment -n openshift-cnv | grep -E "virt-api|virt-controller"
# virt-api        2/2
# virt-controller 2/2
```

## Upgrading CNV

1. Update `subscription.channel` in `bootstrap/helm/charts/openshift-cnv/values.yaml` if changing channels
2. Bump `Chart.yaml version`
3. Run `make upload-cnv-chart`
4. Update `cnv.chartVersion` in `bootstrap/helm/central/values.yaml`
5. Commit + push → ArgoCD syncs automatically

## Dashboard Integration

CNV does not currently expose CRDs consumed by `user_dashboard` or `tenancy_dashboard`. If VM management is added to dashboards in a future feature, this section must be updated.
