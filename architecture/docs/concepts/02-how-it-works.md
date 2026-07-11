# How It Works

## The Bootstrap Process

The entire platform is bootstrapped through a series of `make` commands. Each one builds an artifact or configures part of the system.

```mermaid
flowchart TD
    A["1. Set env vars<br/>(15 variables)"] --> B["2. make check-env<br/>(validate)"]
    B --> C["3. make add-docker-repo<br/>(trust registries)"]
    C --> D["4. make upload-*-chart<br/>(14 charts)"]
    D --> E["5. make ansible-runner<br/>(build image)"]
    E --> F["6. make init-central-argo<br/>(bootstrap ArgoCD)"]
    F --> G["ArgoCD takes over"]
```

This is NOT a single command. Each `make` target builds or uploads one piece of the platform.

## After Bootstrap — GitOps Flow

Once bootstrapped, the platform runs on autopilot:

```mermaid
flowchart TD
    Change["Push to Git"] --> Detect["ArgoCD detects"]
    Detect --> Sync["Syncs to clusters"]
    Sync --> Healthy["Clusters healthy"]
    Drift["Manual change"] --> Revert["ArgoCD reverts"]
    Revert --> Healthy
```

## Self-Healing

If someone manually changes something on a cluster, ArgoCD detects the drift and reverts it. No manual intervention needed.

## Who Does What?

| Actor | Responsibility |
|---|---|
| **Platform Team** | Manages Git repo, runs initial bootstrap |
| **ArgoCD** | Keeps clusters in sync with Git |
| **RHACM** | Multi-cluster visibility and policies |
| **Keycloak** | User authentication and access control |
| **Vault** | Stores and delivers platform secrets |
| **Ansible Jobs** | Configures Keycloak, Vault, Gitea post-deploy |
