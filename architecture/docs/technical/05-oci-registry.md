# OCI Registry (Quay)

## What it does

The OCI registry stores Helm charts as OCI artifacts. ArgoCD pulls charts from here to deploy to clusters.

```mermaid
graph LR
    Make["make upload-*-chart"] -->|push| Quay["Quay Registry<br/>(quay.example.com)"]
    Quay -->|"pull (read-only)"| ArgoCD["ArgoCD"]
    ArgoCD -->|deploy| Clusters["Both Clusters"]
```

## Access Model

| Account | Access | Used for |
|---|---|---|
| Admin token (`OCI_REGISTRY_TOKEN`) | Read + Write | Creating repos, pushing charts |
| Robot account (`hybrid-sovereign+pull`) | **Read-only** | ArgoCD pulling charts |

## Charts stored

| Chart | OCI Path | Version |
|---|---|---|
| rhacm | `oci://quay.example.com/hybrid-sovereign/rhacm` | 0.5.0 |
| sovereign-namespaces | `oci://quay.example.com/hybrid-sovereign/sovereign-namespaces` | 0.2.1 |
| rhbk | `oci://quay.example.com/hybrid-sovereign/rhbk` | 0.10.0 |
| rhbk-config | `oci://quay.example.com/hybrid-sovereign/rhbk-config` | 0.4.0 |
| acs | `oci://quay.example.com/hybrid-sovereign/acs` | 0.2.0 |
| vault | `oci://quay.example.com/hybrid-sovereign/vault` | 0.5.0 |
| aap | `oci://quay.example.com/hybrid-sovereign/aap` | 0.5.1 |
| odf | `oci://quay.example.com/hybrid-sovereign/odf` | 0.5.0 |
| quay | `oci://quay.example.com/hybrid-sovereign/quay` | 0.5.1 |
| crunchy-postgres | `oci://quay.example.com/hybrid-sovereign/crunchy-postgres` | 0.4.0 |
| gitea | `oci://quay.example.com/hybrid-sovereign/gitea` | 0.4.0 |
| external-secrets | `oci://quay.example.com/hybrid-sovereign/external-secrets` | 0.1.2 |
| ansible-job | `oci://quay.example.com/hybrid-sovereign/ansible-job` | 0.1.2 |
| vault-secret-store | `oci://quay.example.com/hybrid-sovereign/vault-secret-store` | 0.3.0 |
| sovereign-jobs | `oci://quay.example.com/hybrid-sovereign/sovereign-jobs` | 0.1.0 |

## How OCI_REGISTRY is parsed

The `OCI_REGISTRY` env var can be:
- A hostname: `quay.example.com`
- A full URL: `https://quay.example.com/organization/hybrid-sovereign`

The Makefile extracts:
- **OCI_HOST**: `quay.example.com` (used for `helm registry login`)
- **OCI_NAMESPACE**: `hybrid-sovereign` (used as the OCI path prefix)
