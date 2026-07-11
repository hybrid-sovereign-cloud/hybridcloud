# Documented Deviations: 006 Platform EDA Rebuild

## Deviation 1: Custom Event Forwarder

**What**: A custom Python-based event forwarder (`eda/event-forwarder/`) watches K8s Events on the services cluster and POSTs them to AAP Event Streams on central.

**Why**: RHACM does not forward `events.k8s.io/v1` objects, and the `sabre1041.eda.k8s` plugin is community-only (not supported in EDA controller). AAP 2.5 has no built-in K8s event source plugin.

**Where**: `eda/event-forwarder/`, deployed to `sovereign-cloud-plugins` namespace on services via ArgoCD.

**Remediation**: When Red Hat ships a supported K8s Event Source plugin for EDA (expected AAP 2.6+), replace the forwarder with the native plugin. Track via [AAP roadmap](https://access.redhat.com/articles/ansible-automation-platform-life-cycle).

## Deviation 2: Cross-Cluster Status Writes

**What**: EDA on central writes CR status fields (`status`, `ready`, `observedGeneration`, `deletionComplete`) to CRs on the services cluster.

**Why**: User requirement places EDA on central cluster. Operators run on services. EDA must update CR status after completing automation.

**Where**: All EDA provision/teardown roles under `eda/*/roles/` use `argocd-cluster-services` bearer token to write to services cluster CRs.

**Remediation**: If EDA moves to services cluster in the future, cross-cluster writes become local writes. Alternatively, implement a status-writer sidecar on services that EDA can signal via webhook.

## Deviation 3: Per-Operator Decision Environments

**What**: 11 separate DE images (one per operator), each with slightly different collection dependencies.

**Why**: Each operator's EDA rulebook may need different Ansible collections and Python deps. A shared DE would create coupling and bloat as operators diverge.

**Where**: `eda/*/decision-environment.yml`, Quay repos at `hybrid-sovereign/de-*`.

**Remediation**: Monitor image sizes and consolidate when operators stabilize. Consider a shared base DE with operator-specific overlay layers using multi-stage builds.
