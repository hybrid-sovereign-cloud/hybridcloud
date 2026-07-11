# What is Sovereign Cloud?

## The Big Picture

Sovereign Cloud is a **self-managing platform** that runs your workloads across two OpenShift clusters.

You set it up once. After that, it manages itself.

## Key Idea

```mermaid
graph LR
    You["You"] -->|change code| Git["Git Repository"]
    Git -->|auto-deploys| Platform["Platform"]
    Platform -->|self-heals| Platform
```

**You never touch the clusters directly.** You push changes to Git, and the platform applies them automatically.

## Why Two Clusters?

| Cluster | Role | Analogy |
|---|---|---|
| **Central** | Management brain | Air traffic control |
| **Services** | Where work happens | The actual airport |

The central cluster makes decisions. The services cluster runs workloads.

## What Makes It "Sovereign"?

- **Self-contained** — no external dependencies needed after setup
- **Self-healing** — fixes drift automatically
- **Air-gap ready** — designed for disconnected environments
- **Auditable** — all changes tracked in Git history
