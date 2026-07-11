# Gitea - Self-Hosted Git Service

## Overview

Gitea provides a lightweight, self-hosted Git service on the central cluster for internal repository management.

## Deployment

| Property | Value |
|---|---|
| Cluster | Central only |
| Namespace | `gitea` |
| Chart | `bootstrap/helm/charts/gitea` (subchart: `gitea-charts/gitea` v12.5.3) |
| OCI location | `oci://quay.example.com/hybrid-sovereign/gitea` |
| Make target | `make upload-gitea-chart` |
| ArgoCD App | `gitea` |

## Architecture

Gitea is deployed using the upstream Gitea Helm chart as a subchart dependency. All container images are mirrored to `quay.example.com/hybrid-sovereign/` to satisfy cluster image policies.

### Components

- **Gitea**: Main application (rootless container)
- **PostgreSQL**: Internal database (Bitnami subchart)
- **Valkey Cluster**: Cache/session store

### Mirrored Images

| Original | Mirrored |
|---|---|
| `docker.gitea.com/gitea:1.25.5-rootless` | `quay.example.com/hybrid-sovereign/gitea:1.25.5-rootless` |
| `docker.io/bitnamilegacy/postgresql:17.6.0` | `quay.example.com/hybrid-sovereign/postgresql:17.6.0-debian-12-r4` |
| `docker.io/bitnamilegacy/valkey-cluster:8.1.3` | `quay.example.com/hybrid-sovereign/valkey-cluster:8.1.3-debian-12-r3` |
| `docker.io/bitnamilegacy/os-shell:12` | `quay.example.com/hybrid-sovereign/os-shell:12-debian-12-r51` |

## Access

Gitea is exposed via an OpenShift Route at `gitea-gitea.apps.<cluster-domain>`.

## Integration

Gitea is configured as a Keycloak OIDC client (`gitea` in the `sovereign-central` realm) for SSO authentication.
