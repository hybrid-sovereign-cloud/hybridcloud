# OpenShift Data Foundation (ODF) — Noobaa

## Overview

ODF provides object storage via Noobaa for use by Quay and other services
that require S3-compatible bucket storage.

## Deployment

| Component | Cluster | Namespace |
|-----------|---------|-----------|
| ODF Operator | Both | `openshift-storage` |
| Noobaa | Both | `openshift-storage` |

## Chart: `bootstrap/helm/charts/odf`

- **Operator**: OLM Subscription, channel `stable-4.20`
- **Noobaa**: `NooBaa` CR with postgres DB backend and minimal resources

## ArgoCD Applications

- `odf-central` — Noobaa on central cluster
- `odf-services` — Noobaa on services cluster

## Usage

Once deployed, Noobaa provides:
- S3 endpoints for bucket operations
- ObjectBucketClaim support for dynamic bucket provisioning
- Used as backend storage for Quay registry
