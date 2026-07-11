# Day-2 Operations: ArgoCD

## Overview

ArgoCD runs on the central cluster in the `openshift-gitops` namespace. It manages all platform components on both clusters through a single **app-of-apps** Helm chart (`bootstrap/helm/central`).

```
Post-init rule: ALL changes go through Git → ArgoCD.
Never use oc apply for platform resources.
```

---

## 1. Accessing ArgoCD

```bash
# Get ArgoCD URL
oc get route openshift-gitops-server -n openshift-gitops

# Get admin password
oc get secret openshift-gitops-cluster -n openshift-gitops \
  -o jsonpath='{.data.admin\.password}' | base64 -d
```

Or use the OpenShift console → Applications → ArgoCD.

---

## 2. Sync Waves

Applications are deployed in order using ArgoCD sync waves (annotation `argocd.argoproj.io/sync-wave`). Higher numbers deploy later.

| Wave | Group |
|------|-------|
| 1–5 | Namespaces, RBAC |
| 10–15 | Infrastructure (RHACM, ODF, storage) |
| 15–20 | Vault, Keycloak |
| 20–30 | Vault init jobs, ESO, secret stores |
| 30–35 | Keycloak config jobs, Gitea, Quay |
| 36–40 | Operators (Entity, Team, etc.) |
| 40–50 | Plugins, Dashboards |

Within a wave, resources are applied in dependency order. A wave does not proceed until all resources in the previous wave are `Healthy`.

### View current sync wave of a resource

```bash
oc get application -n openshift-gitops -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.annotations.argocd\.argoproj\.io/sync-wave}{"\n"}{end}'
```

---

## 3. Enabling / Disabling Applications

All applications in `bootstrap/helm/central/values.yaml` have a top-level `enabled` flag. Setting it to `false` causes ArgoCD to prune the Application resource and stop managing those resources.

```yaml
# values.yaml
teamOperator:
  enabled: true   # set false to disable
  chartVersion: "0.3.3"
  syncWave: "38"
```

Workflow:
1. Edit `values.yaml`
2. Commit and push to Git
3. ArgoCD detects the change and syncs

```bash
# Trigger immediate sync (do not use oc apply)
argocd app sync sovereign-central-apps --force
```

---

## 4. App-of-Apps Management

The root ApplicationSet is `sovereign-central-apps` in `openshift-gitops`. It watches the `bootstrap` Git repository and generates Application resources from `bootstrap/helm/central`.

```bash
# List all Applications
oc get applications -n openshift-gitops

# Check health of all apps
oc get applications -n openshift-gitops -o wide

# Force full sync
argocd app sync sovereign-central-apps --prune
```

### Template directories

Applications are organized into three directories under `bootstrap/helm/central/templates/`:

| Directory | Target | Description |
|-----------|--------|-------------|
| `centralCluster/` | Central cluster | Vault, RHBK, ESO, RHACM, storage |
| `servicesCluster/` | Services cluster | Vault-services, RHBK-services, AAP, Gitea |
| `hybridSovereignOperators/` | Services cluster | Custom operators, plugins, dashboards |

See [30-app-of-apps-structure.md](../technical/30-app-of-apps-structure.md) for the full layout.

---

## 5. OCI Chart Upload Workflow

Helm charts are stored in an OCI-compatible Quay registry. To update a chart:

### Step 1: Modify the chart

```bash
# Edit the chart files in bootstrap/helm/charts/<chart-name>/
# Bump version in Chart.yaml
```

### Step 2: Upload via Makefile

```bash
# From bootstrap/
make upload-vault-secret-store-chart   # example

# All upload targets follow the pattern:
make upload-<component>-chart
```

> Never push charts manually with `helm push` — always use the Makefile targets which handle authentication and tagging.

### Step 3: Update values.yaml

```yaml
vaultSecretStore:
  chartVersion: "0.3.1"   # new version
```

### Step 4: Commit and push

```bash
git add bootstrap/helm/central/values.yaml
git commit -m "bump vault-secret-store chart to 0.3.1"
git push origin main
```

ArgoCD picks up the change and deploys the new chart version automatically.

---

## 6. Cluster Registration

The services cluster is registered as an ArgoCD managed cluster. Registration is done via the `argocd cluster add` command or via RHACM's ArgoCD integration.

```bash
# List registered clusters
argocd cluster list

# Check cluster connection
argocd cluster get <services-cluster-url>
```

If the cluster certificate changes (e.g., after API server cert rotation):

```bash
# Remove and re-add the cluster
argocd cluster rm <services-cluster-url>
oc login <services-cluster-url> --token=<sa-token>
argocd cluster add <services-cluster-context>
```

---

## 7. Fixing a Failed Application

### ArgoCD application degraded

```bash
# Check app sync status
argocd app get <app-name>

# View sync errors
argocd app sync-status <app-name>

# Force a hard refresh (re-reads Git + live state)
argocd app get <app-name> --hard-refresh
argocd app sync <app-name>
```

### Chart rendering error

```bash
# Test Helm rendering locally
cd bootstrap/
helm template helm/central -f helm/central/values.yaml | grep -A 5 error
helm lint helm/central
```

### Application stuck OutOfSync

Check if a resource has a `Progressing` status — this usually means a dependent resource in a lower sync wave hasn't become Healthy yet. Wait for the earlier wave to complete.

---

## 8. Sovereign Jobs (Ansible Jobs)

Platform configuration is handled by Ansible Jobs deployed as Kubernetes `Job` resources in `sovereign-cloud-jobs`.

```bash
# List jobs
oc get jobs -n sovereign-cloud-jobs

# View job logs
oc logs -n sovereign-cloud-jobs job/vault-init

# Re-run a failed job (delete the job, ArgoCD recreates it)
oc delete job vault-init -n sovereign-cloud-jobs
# Then sync the corresponding ArgoCD Application
argocd app sync vault-init-job
```

---

## Related Documentation

- [02-bootstrap-flow.md](../technical/02-bootstrap-flow.md) — Initial bootstrap sequence
- [03-central-cluster.md](../technical/03-central-cluster.md) — Central cluster reference
- [29-deployment-sequence.md](../technical/29-deployment-sequence.md) — Phased deployment order
- [30-app-of-apps-structure.md](../technical/30-app-of-apps-structure.md) — Template structure
