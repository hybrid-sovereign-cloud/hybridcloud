# Red Hat Quay Registry

## Overview

Quay provides enterprise container image registry with vulnerability
scanning (via Clair), mirroring, and access control.

## Deployment

| Component | Cluster | Namespace |
|-----------|---------|-----------|
| Operator | Both | `quay-enterprise` |
| Registry Instance | Both | `quay-enterprise` |
| Clair | Both | `quay-enterprise` |

## Chart: `bootstrap/helm/charts/quay`

- **Operator**: OLM Subscription, channel `stable-3.13`
- **Registry**: `QuayRegistry` CR with object storage set to unmanaged
  (uses Noobaa buckets from ODF)

## ArgoCD Applications

- `quay-central` — full Quay on central cluster
- `quay-services` — full Quay on services cluster

## Object Storage

Quay uses Noobaa (ODF) as its object storage backend. The
`objectstorage` component is set to `managed: false` — storage
configuration must be provided via a config secret referencing
the Noobaa S3 endpoint and credentials.
