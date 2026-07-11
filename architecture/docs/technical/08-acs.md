# Red Hat Advanced Cluster Security (RHACS)

## Overview

ACS provides vulnerability management, compliance, network segmentation,
and runtime threat detection for both clusters.

## Deployment

| Component | Cluster | Namespace |
|-----------|---------|-----------|
| Operator | Both | `rhacs-operator` |
| Central | Central only | `stackrox` |
| Console Plugin | Both | cluster-scoped |

## Chart: `bootstrap/helm/charts/acs`

- **Operator**: OLM Subscription from `redhat-operators`, channel `stable`
- **Central**: `platform.stackrox.io/v1alpha1` CR with HA scanner
- **Console Plugin**: `ConsolePlugin` CR for OpenShift console integration

## ArgoCD Applications

- `acs-central` — full stack on central cluster (operator + Central instance)
- `acs-services` — operator-only on services cluster (SecuredCluster added later)

## Dynamic Plugin

The `rhacs` console plugin is registered via a `ConsolePlugin` CR and enabled
in the OpenShift `Console` operator configuration.
