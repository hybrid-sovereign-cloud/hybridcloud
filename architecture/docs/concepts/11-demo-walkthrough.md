# Leadership Demo Walkthrough — Hybrid Sovereign Cloud

**Audience:** Technical leadership (CTO / VP Engineering)  
**Duration:** 10 minutes live walkthrough + 15-minute pre-check  
**Last updated:** 2026-06-16

## Pre-Demo Checklist (15 minutes before)

| Check | URL/Command | Expected |
|-------|-------------|----------|
| Central cluster login | `oc login $OCP_CENTRAL_SERVER` | Logged in |
| Services cluster login | `oc login $OCP_SERVICES_SERVER` | Logged in |
| ArgoCD healthy | https://openshift-gitops-server-openshift-gitops.apps.central.lab.example.com | All apps Synced |
| Vault accessible | https://vault-central.apps.central.lab.example.com | Initialized, Unsealed |
| Keycloak login | https://sso-rhbk-services.apps.services.lab.example.com | Admin login works |
| User dashboard | https://sovereign-cloud-dashboard-sovereign-cloud.apps.services.lab.example.com | Loads, OAuth works |
| Tenancy dashboard | https://tenancy-dashboard-sovereign-cloud.apps.services.lab.example.com | Loads |
| AAP accessible | https://sovereign-aap-aap.apps.central.lab.example.com | Logged in |
| ocp-ses10 console | https://console-openshift-console.apps.ocp-ses10.7fe67.sandbox5530.opentlc.com | Accessible |
| ocp-ses4 console | https://console-openshift-console.apps.ocp-ses4.a4fce.lab.example.com | Accessible |

Have these browser tabs open before demo starts:

1. User Dashboard
2. Tenancy Dashboard
3. ArgoCD
4. AAP Controller
5. ocp-ses10 or ocp-ses4 cluster console

---

## Demo Flow (10 minutes)

### Minute 1-2: Platform Overview

**What to say:** "The Sovereign Cloud Platform automates the full lifecycle of isolated OpenShift tenant environments. Today I'll show you a live two-cluster deployment."

**Show:** User Dashboard → Overview page → highlight platform health indicators

**Talking points:**

- Two OpenShift clusters: central control plane, services workload cluster
- 14+ operators automate tenant lifecycle from entity creation to cluster provisioning
- All changes flow through GitOps (ArgoCD) — no manual cluster changes

---

### Minute 3-4: Entity and Tenant Structure

**What to say:** "An Entity represents an organization or customer. Each entity gets an isolated namespace with its own RBAC, secrets, and resource governance."

**Show:** Tenancy Dashboard → select entity `entity-acme-corp` → show Teams, Assignments, Projects

**Click through:**

1. Team list: show `platform-team`, `dev-team`, `qa-team`
2. Assignment list: show `ocp-ses10` and `ocp-ses4` assignments
3. Persona list: show at least 3 persona types

**Talking points:**

- Entity → Team → Assignment is the governance hierarchy
- Each Assignment maps to a provisioned cluster
- RBAC enforced at each level via Keycloak groups

---

### Minute 5-6: Automation Engine

**What to say:** "Every CR change triggers an automated provisioning job via EDA and AAP. No human intervention required."

**Show:** AAP Controller → Job Templates → run list (show recent successful jobs)

**Click:** `platformopenshift-provision` job → show job output link using `/execution/jobs/playbook/` format

**Talking points:**

- EDA watches Kubernetes events, routes to AAP
- AAP executes Ansible roles (Keycloak config, ACM policies, DNS setup)
- Job IDs and links stored back in the CR status

---

### Minute 7-8: Live Provisioned Clusters

**What to say:** "Here are two live clusters we provisioned through the platform — one on AWS, one on OpenStack."

**Show:** Tenancy Dashboard → PlatformOpenshift CRs → ocp-ses10 and ocp-ses4

**Highlight in the CR status:**

- `clusterHealth: Healthy`
- `clusterVersion: 4.21.9`
- `consoleURL` with clickable link

**Click:** Open ocp-ses10 console URL

**Talking points:**

- Cluster deployed via ACM and Hive (cloud-native provisioner)
- DNS and OAuth (OIDC) automatically configured
- Kubeconfig stored in Vault, team members access via their Keycloak group

---

### Minute 9-10: Security and GitOps

**What to say:** "Security is baked in at every layer. No secrets in git, all credentials through Vault, all changes audited through ArgoCD."

**Show:** ArgoCD → app-of-apps `sovereign-central-apps` → show all child apps Synced+Healthy

**Then show:** Vault → central → secrets tree structure (no credentials revealed, just paths)

**Talking points:**

- HashiCorp Vault as the secret hub: all credentials live here
- External Secrets Operator syncs secrets to pods — no plaintext in git
- ArgoCD enforces desired state: self-heal, prune, every change is git-committed

---

## Fallback Talking Points

If any service is degraded during the demo:

| Issue | Fallback |
|-------|----------|
| User/Tenancy Dashboard down | Show the ArgoCD app-of-apps, navigate to CR list via `oc get` |
| AAP not accessible | Show the Ansible roles in the Git repo on Gitea |
| ocp-ses10 console unreachable | Show the ClusterDeployment in ACM, kubeconfig in Vault |
| Keycloak not loading | Show the Keycloak OIDC configuration in the Helm chart |
| ArgoCD not loading | Show `oc get applications -n openshift-gitops` live output |

---

## Post-Demo Questions and Answers

**Q: How long does it take to provision a new cluster?**  
A: 20-45 minutes from Assignment CR creation to healthy cluster with OIDC and RBAC configured.

**Q: How do you handle secrets rotation?**  
A: Vault manages lease rotation. ExternalSecrets re-sync automatically. Ansible jobs use short-lived tokens.

**Q: How does a tenant access their cluster?**  
A: They log in via Keycloak SSO → their group membership maps to RBAC roles on the provisioned cluster.

**Q: What if the control plane goes down?**  
A: Provisioned clusters run independently. The services cluster continues to serve tenant workloads. Control plane recovery restores management capability but doesn't interrupt running workloads.

**Q: Is this air-gap deployable?**  
A: Yes — our roadmap includes an OCP Appliance image that bundles all platform components for sovereign/air-gapped deployment.
