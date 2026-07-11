# Cleanup Procedures — Full Cluster Reset

## Overview

Phase 3 provides a complete "clean slate" procedure to remove all platform workloads from both clusters while preserving the ArgoCD installation on the central cluster. This is useful for:
- Complete re-deployment from scratch
- Testing the full bootstrap sequence
- Recovery from a corrupted state

## Preserved Resources

- ArgoCD installation (`openshift-gitops` namespace)
- The in-cluster ArgoCD ApplicationSet `sovereign-central-apps` (if needed)
- All `sovereign-*` namespaces are **NEVER deleted** — non-negotiable rule

## Cleanup Sequence

```
Step 1: Disable all ArgoCD Application auto-sync
Step 2: Run cleanup-services-cluster.yml
Step 3: Run cleanup-central-cluster.yml
Step 4: Run cleanup-argocd.yml
Step 5: Verify — only ArgoCD pods in openshift-gitops should remain
```

## Playbooks

| Playbook | Target | What It Removes |
|----------|--------|----------------|
| `cleanup-services-cluster.yml` | Services cluster (via central) | All platform CRs, OLM subscriptions, platform namespaces |
| `cleanup-central-cluster.yml` | Central cluster | RHACM, Vault, RHBK, Quay, ODF, Gitea namespaces + OLM |
| `cleanup-argocd.yml` | Central cluster (ArgoCD) | All Applications, AppSets, cluster registrations, repos, AppProjects |

## Running Cleanup

```bash
# Prerequisites: kubectl/oc logged in to central cluster
# The playbooks run as sovereign-jobs (Ansible jobs)

# To run locally for debugging:
cd bootstrap/

# Step 1: Disable ArgoCD auto-sync (via oc)
oc patch applicationset sovereign-central-apps \
  -n openshift-gitops \
  --type=json \
  -p '[{"op":"replace","path":"/spec/template/spec/syncPolicy","value":{}}]'

# Step 2: Cleanup services cluster (runs cross-cluster via ArgoCD SA token)
ansible-playbook ansible/project/cleanup-services-cluster.yml

# Step 3: Cleanup central cluster
ansible-playbook ansible/project/cleanup-central-cluster.yml

# Step 4: Cleanup ArgoCD configuration
ansible-playbook ansible/project/cleanup-argocd.yml

# Step 5: Verify
oc get pods -n openshift-gitops
# Only ArgoCD pods should be running
```

## Rollback Notes

- **There is no automatic rollback.** Cleanup is destructive and irreversible.
- To restore: run `make init-central-argo` to re-bootstrap the platform from scratch.
- PVCs are deleted as part of namespace deletion. Data stored in PVCs is permanently lost.
- Vault init secrets (`vault-init-secrets`) are deleted when the `vault` namespace is deleted. Ensure Vault KV data is backed up or acceptable to lose before running cleanup.

## Important Warnings

- Do NOT run cleanup if there are active tenant namespaces with production data.
- Do NOT delete `sovereign-*` namespaces manually — these are protected by governance rules.
- The services cluster external to central ArgoCD — cleanup-services-cluster must run before cleanup-argocd to ensure service cluster resources are removed.

## Ansible Roles

| Role | Description |
|------|-------------|
| `cleanup-services-cluster` | Removes platform CRs and namespaces from services cluster |
| `cleanup-central-cluster` | Removes platform namespaces from central cluster |
| `cleanup-argocd` | Removes ArgoCD Applications, AppSets, clusters, repos |
