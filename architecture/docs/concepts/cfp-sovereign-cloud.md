# KubeCon + CloudNativeCon NA 2026 — Poster Session CFP

> **Submission deadline**: Sunday, May 31, 2026 at 11:59pm MT (UTC-7)
> **Submit via**: [Sessionize](https://events.linuxfoundation.org/kubecon-cloudnativecon-north-america/program/cfp/)
> **Session type**: Poster Session (1-2 presenters)
> **Check the box**: "Please also consider this for a Poster Session"

---

## Sessionize Form Fields

### Title

```
Operator-Driven Sovereign Cloud: Automating Multi-Tenant Lifecycle With Kubernetes, Argo CD, and Policy-Based Multi-Cluster Management
```

### Track

**Platform Engineering**

### Session Type

Poster Session

### Is This a Case Study?

Yes

### Content Experience Level

Intermediate

### CNCF-Hosted or Open Source Projects

Kubernetes, Argo (Argo CD), Helm, Open Cluster Management (OCM)

---

### Description

*(Third person. Appears on the public schedule if accepted.)*

Sovereign cloud platforms promise data residency, regulatory compliance, and self-contained operations, but few production implementations exist beyond vendor reference diagrams. This poster presents a working sovereign cloud platform that manages over forty tenants across multiple Kubernetes clusters spanning AWS and OpenStack, bootstrapped from a single command and governed entirely through GitOps. The platform supports three service delivery models — Platform as a Service with shared infrastructure, shared Infrastructure as a Service with dedicated per-tenant platforms, and fully dedicated tenant clusters — all managed by the same operator set and selectable per tenant through Custom Resource configuration.

The architecture follows a fractal pattern: each sovereign cloud instance is itself a complete, self-contained platform (central hub, services control plane, spoke clusters) that can be nested under a higher-level global hub. A regional sovereign cloud manages its own tenants while a global OCM hub aggregates compliance, inventory, and policy across regions — enabling a Sovereign Cloud of Sovereign Clouds topology that preserves data residency at each level.

Ten custom Kubernetes operators automate the full tenant lifecycle. Creating a single Assignment CR triggers a cross-cluster orchestration chain: the operator resolves team, project, and RBAC references, constructs an Open Cluster Management Policy, and posts it to a central hub using a least-privilege service account token delivered through a Vault-to-ExternalSecret chain. The hub enforces the policy on the target spoke, provisioning namespaces, a scoped Argo CD instance, service mesh isolation, and four-tier RBAC — all without direct cluster access. Data residency is enforced structurally: each spoke cluster is bound to a physical region, OCM Placement rules restrict workload scheduling to jurisdiction-local clusters, and Vault secret paths are scoped per region so credentials never leave their data boundary.

The presenters will demonstrate the full tenant provisioning flow live, show how the fractal architecture scales from a single-region deployment to a multi-region Sovereign Cloud of Sovereign Clouds, and discuss hard-won patterns for cross-cluster secret delivery, data-residency-aware placement, and policy-driven multi-cluster deployment.

---

### Benefits to the Ecosystem

*(Not shown publicly. Explains relevance to the program committee.)*

This poster addresses a gap the cloud native community increasingly faces: how to use Kubernetes-native patterns — operators, Custom Resources, GitOps, and policy-based management — to build production multi-tenant platforms that meet sovereign cloud requirements. While reference architectures exist, concrete implementations that demonstrate the full operator-chain pattern for tenant lifecycle management are rare in the community.

The novel contributions relevant to the broader ecosystem are:

**1. Operator-chain pattern for multi-tenant lifecycle.** The poster demonstrates how ten cooperating operators, each with narrowly scoped ClusterRoles, form a declarative pipeline where a single CR creation cascades through team resolution, RBAC group lookup, Helm chart rendering, and cross-cluster policy enforcement. This pattern is reusable for any multi-tenant platform, not limited to sovereign cloud.

**2. Cross-cluster secret delivery without secrets in Git.** The PushSecret-to-Vault-to-ExternalSecret chain shown in the poster solves a common multi-cluster problem: securely passing service account tokens between clusters without kubeconfig files or hardcoded credentials. This pattern uses the CNCF ecosystem (Kubernetes ServiceAccount tokens, Helm) combined with External Secrets Operator and is applicable to any multi-cluster Kubernetes deployment.

**3. Open Cluster Management Policy as a deployment vehicle.** Rather than using direct Helm installs or custom controllers on spoke clusters, the platform wraps rendered Helm templates as OCM ConfigurationPolicy objects. This gives automatic drift detection, compliance reporting, and centralized teardown (flipping policies to mustnothave). This approach is directly applicable to anyone using OCM or its downstream distributions for fleet management.

**4. GitOps bootstrap sequencing at scale.** The poster shows how a single Argo CD app-of-apps chart with over fifty Application templates and forty-plus sync waves bootstraps an entire platform — including Vault initialization, OIDC configuration, and secret store authentication — handling the inherent circular dependencies between identity, secrets, and cluster management components. The bootstrap gap pattern (where ExternalSecrets intentionally fail and self-heal once Vault auth is established) is a reusable technique for any complex GitOps deployment.

**5. RBAC model driven entirely by CRs.** The fourteen-role, two-layer RBAC model (Kubernetes Roles bound to Keycloak groups, all managed via Rbac Custom Resources and reconciled by operators) demonstrates how to implement fine-grained, auditable access control for forty-plus tenants without manual Keycloak or Kubernetes RBAC configuration. This scales to over ten thousand group memberships per tenant.

**6. Fractal architecture — Sovereign Cloud of Sovereign Clouds.** The poster introduces a self-similar deployment pattern where the entire sovereign cloud stack (central hub, services control plane, operator set, spoke clusters) is itself a unit that can be nested under a higher-level global OCM hub. Each regional instance is fully autonomous — it bootstraps independently, manages its own tenants, runs its own Vault and identity provider, and enforces data residency within its jurisdiction. A global hub aggregates policy compliance, inventory, and metrics across regions without accessing tenant data. This is a novel architectural pattern for the cloud native ecosystem: rather than building a single global control plane that must handle jurisdictional boundaries internally, the fractal approach composes independent sovereign instances into a federation. This is directly relevant to multinational service providers, government clouds spanning multiple jurisdictions, and any organization where data must not cross regional boundaries even at the management plane level.

**7. Three service delivery models from one operator set.** The platform supports PaaS (shared infrastructure, operator-managed team environments on shared spoke clusters), shared IaaS with dedicated platforms (shared bare-metal infrastructure with per-tenant Virtual Control Planes providing dedicated Kubernetes control planes), and fully dedicated tenant clusters (isolated three-plus-node clusters per tenant with optional tenant-level OCM). The same ten operators and the same Argo CD app-of-apps drive all three models — the service model is selected per tenant through CR configuration (Assignment CR for PaaS, PlatformOpenshift CR for dedicated platforms, tenant ACM flag for dedicated management). This demonstrates that Kubernetes operators can abstract over fundamentally different infrastructure isolation models without requiring separate platform builds.

**8. Data residency enforced structurally, not by policy alone.** Rather than relying solely on admission controllers or runtime policies, the platform enforces data residency through architectural constraints: spoke clusters are bound to physical regions via OCM ManagedCluster labels, Placement rules restrict policy enforcement to jurisdiction-matching clusters, Vault secret engines are scoped per region (secrets for region-A tenants are stored in region-A Vault and never replicated), and the fractal architecture ensures that each regional management plane is self-contained. The poster will visualize how a tenant CR created in a European sovereign cloud instance can only target European spoke clusters, with the structural guarantee that no data or credentials flow to other regions.

This work is directly relevant to platform engineers building internal developer platforms, service providers offering managed Kubernetes, and organizations with data sovereignty or air-gap requirements. The patterns are transferable to any Kubernetes distribution, not just OpenShift. The poster format is ideal because the architecture diagrams — particularly the fractal topology and data residency flow — invite the kind of interactive, detailed technical discussion that poster sessions facilitate.

---

### Additional Resources / Notes for Program Committee

This poster is based on a production sovereign cloud platform that is actively deployed and managing real tenants — it is not a proof of concept or aspirational architecture. The presenters built and operate this platform and can demonstrate every pattern described in the poster on live clusters during the session.

**What makes this submission distinct from prior KubeCon content:**

- No prior KubeCon poster or session has presented a fractal (self-similar, nestable) sovereign cloud architecture built entirely on Kubernetes-native primitives. Existing multi-cluster talks focus on fleet management or federation — this work demonstrates a composable, jurisdiction-aware topology where each instance is a fully autonomous sovereign platform.
- The operator-chain pattern (ten cooperating operators forming a declarative tenant lifecycle pipeline) goes beyond the typical single-operator case studies seen at KubeCon. The interactions between operators — cross-CR reference resolution, cross-cluster API calls via Vault-delivered tokens, and OCM Policy construction from Ansible — represent patterns the community has not seen demonstrated together.
- The three service delivery models (PaaS, shared IaaS with Virtual Control Planes, dedicated clusters) driven by the same operator codebase and selectable per tenant via CR configuration addresses a real gap: most platform engineering talks assume a single tenancy model.
- Structural data residency enforcement (region-bound clusters + region-scoped Vault + self-contained management planes) is directly relevant to the growing number of organizations subject to GDPR, DORA, NIS2, and national sovereignty mandates who are adopting Kubernetes.

**Live demo plan for the poster session:**

The presenters will have laptop access to a live multi-cluster environment and will demonstrate:
1. Creating a tenant from a single Assignment CR and watching namespaces, Argo CD instance, Istio control plane, and RBAC appear on the target spoke cluster in real time
2. The OCM Policy lifecycle on the central hub — showing how the operator constructs the policy, how OCM enforces it, and how compliance is reported
3. The secret delivery chain — showing the PushSecret sync status on central, the Vault KV path, and the ExternalSecret on the services cluster
4. Tenant deletion — showing the finalizer flip policies to mustnothave, spoke resources removed, and policy objects cleaned up

**CNCF project usage:**

| Project | Role in the Platform |
|---------|---------------------|
| **Kubernetes** | Foundation for all clusters (central, services, spokes); CRD-based tenant lifecycle; operator runtime |
| **Argo (Argo CD)** | Central GitOps engine (app-of-apps, 50+ Applications, 40+ sync waves); per-tenant scoped Argo CD instances on spoke clusters |
| **Helm** | All platform components and operator charts packaged as OCI Helm charts; sovereign-assignment chart rendered by operators for OCM Policy construction |
| **Open Cluster Management (OCM)** | Multi-cluster hub on central; ManagedCluster registration for spokes; ConfigurationPolicy for spoke configuration enforcement; Placement for jurisdiction-aware cluster targeting; Global Hub for fractal federation |

**Links:**

- Red Hat Sovereign AI Technical Reference Architecture: https://www.redhat.com/architect/portfolio/detail/130-cloud-sovereignty
- *(Add link to any prior conference talk recordings here)*
- *(Add link to blog post or technical write-up if published)*

---

## Speaker 1

### Name

*(Your name)*

### Job Title

*(Your title)*

### Company

*(Your company)*

### Bio

*(Third person, 50-100 words. Example below — customize.)*

[Speaker Name] is a [title] at [company] focused on multi-tenant Kubernetes platform engineering for sovereign cloud deployments. With [X] years of experience building Kubernetes operators, GitOps pipelines, and multi-cluster architectures on OpenShift, they have designed and implemented production sovereign cloud platforms managing over forty tenants across AWS and OpenStack environments. Their work spans the full platform stack, from Ansible-based operator development and Helm chart design to Vault secret delivery and Argo CD app-of-apps orchestration. They are an active contributor to [relevant community/project].

---

## Speaker 2 (Optional)

*(Same fields as above — add if presenting with a co-presenter.)*

---

## Poster Content Outline

> Reference for designing the 16:9 landscape JPEG (3840x2160, under 10MB) after acceptance.

### Suggested Poster Layout (8 Sections)

```
+------------------------------------------------------------------------+
|  TITLE + AUTHORS + AFFILIATIONS                                        |
+------------------------------------------------------------------------+
|                    |                       |                            |
|  1. THE PROBLEM   |  2. FRACTAL           | 3. SERVICE DELIVERY       |
|  Sovereign cloud   |     ARCHITECTURE      |    MODELS                 |
|  reference arch    |                       |                           |
|  vs. reality.      |  Global OCM Hub       |  PaaS: shared infra,     |
|  Data residency,   |    ┌──────┐           |    operator-managed       |
|  40+ tenants,      |    │Global│           |    team environments      |
|  three service     |    │ Hub  │           |                           |
|  models from one   |    └──┬───┘           |  Shared IaaS + dedicated  |
|  operator set.     |   ┌───┴────┐          |    platform: VCPs on      |
|                    |  ┌┴─┐    ┌─┴┐         |    shared bare metal      |
|                    |  │EU│    │US│          |                           |
|                    |  │SC│    │SC│          |  Dedicated clusters:      |
|                    |  └──┘    └──┘          |    hard tenancy, own      |
|                    |  Each = full           |    ACM, min 3 nodes       |
|                    |  sovereign stack       |                           |
+--------------------+------------------------+---------------------------+
|                    |                       |                            |
|  4. OPERATOR       |  5. DATA RESIDENCY   | 6. SECRET FLOW            |
|     CHAIN          |     ENFORCEMENT       |                           |
|  Entity →          |                       |  PushSecret →             |
|  Team →            |  Region-bound spoke   |  Vault →                  |
|  Project →         |  clusters (OCM        |  ExternalSecret           |
|  Assignment        |  labels + Placement)  |                           |
|  → ACM Policy      |                       |  Cross-cluster            |
|  → spoke           |  Region-scoped Vault  |  token delivery           |
|  resources         |  (secrets never       |  without secrets          |
|                    |  leave boundary)      |  in Git.                  |
|                    |                       |                           |
|                    |  Self-contained       |  Region-scoped Vault      |
|                    |  regional mgmt plane  |  paths: no cross-         |
|                    |  (fractal guarantee)  |  region replication.      |
+--------------------+------------------------+---------------------------+
|                              |                                         |
|  7. GITOPS BOOTSTRAP        |  8. RESULTS & LESSONS                   |
|  50+ apps, 40+ sync waves,  |                                         |
|  single app-of-apps chart.  |  - 40+ tenants, 3 service models        |
|  Self-heal + prune on       |  - <5 min tenant onboard                |
|  every Application.         |  - Zero secrets in Git                   |
|                              |  - Fractal: single-region to            |
|  Bootstrap gap (waves 22-26)|    multi-region with same operators     |
|  = intentional; ESO retry   |  - Data residency: structural,          |
|  handles circular deps.     |    not policy-only                      |
+------------------------------+-----------------------------------------+
```

### Section Details

**1. The Problem**: Sovereign cloud reference architectures define layers (compute, storage, identity, billing, security, AI/ML) but leave implementation open. Service providers need multi-tenant platforms supporting different isolation levels — from shared PaaS to dedicated clusters — while enforcing data residency structurally. The challenge is building this from Kubernetes-native primitives so it can scale from a single region to a federation of sovereign clouds.

**2. Fractal Architecture — Sovereign Cloud of Sovereign Clouds**: The core architectural insight. Each sovereign cloud instance is a complete, self-contained unit: central hub (Argo CD, OCM, Vault, Keycloak), services control plane (ten operators, dashboards), and spoke clusters. This unit bootstraps independently, manages its own tenants, and enforces data residency within its jurisdiction. A Global OCM Hub sits above regional instances, aggregating policy compliance status, maintaining a common inventory, and providing centralized RBAC policy — without accessing tenant data or credentials. The fractal property: the same Helm charts, the same ten operators, and the same bootstrap sequence produce a regional instance or a standalone deployment. Nesting is additive — registering a regional instance under a global hub requires only OCM ManagedCluster registration and policy propagation, not code changes.

**3. Service Delivery Models**: Three models from one operator set, selectable per tenant via CR configuration:

| Model | Infrastructure | Control Plane | Isolation | CR Configuration |
|-------|---------------|---------------|-----------|-----------------|
| **PaaS** (shared) | Shared spoke clusters | Shared, operator-managed team environments | Namespace + RBAC + service mesh (network policies + Istio) | Assignment CR targeting a shared PlatformOpenshift |
| **Shared IaaS + dedicated platform** | Shared bare-metal nodes with OpenShift Virtualization | Virtual Control Planes (VCPs) per tenant — dedicated Kubernetes control plane on shared compute | Control plane isolation via VCP; data plane on dedicated or shared worker nodes | PlatformOpenshift CR with VCP mode; Assignment CR per team |
| **Dedicated clusters** | Per-tenant bare-metal or cloud (min 3 nodes) | Fully dedicated Kubernetes cluster; optional tenant-level OCM | Hard tenancy — no shared elements requiring RBAC controls | Dedicated PlatformOpenshift CR; optional tenant ACM flag |

The same Entity, Team, Project, Assignment, and Plugin operators manage all three models. The tenancy dashboard exposes the model choice as a configuration option, not a platform fork.

**4. Operator-Chain Pattern**: Visual flow showing how an Assignment CR creation cascades through the operator chain:
- Assignment operator reads Team, Project, PlatformOpenshift CRs in the same entity namespace
- Resolves each toolRbac reference to its Keycloak group name via Rbac CR status
- Renders the sovereign-assignment Helm chart with resolved values
- POSTs OCM Policy + Placement to central hub (via Vault-delivered SA token)
- Hub enforces ConfigurationPolicies on the target spoke (selected by Placement rules)
- Spoke receives: namespaces, scoped Argo CD, Istio control plane, four-tier RBAC
- Deletion: finalizer flips policies to mustnothave, waits for spoke cleanup, deletes policy objects

**5. Data Residency Enforcement**: Four structural layers that guarantee data residency without relying solely on runtime admission control:

1. **Region-bound spoke clusters**: Each spoke cluster carries OCM ManagedCluster labels indicating its physical region (e.g., `region: eu-west`, `jurisdiction: eu`). Spoke clusters are provisioned in-region and cannot be relocated.
2. **Placement-constrained policy enforcement**: OCM Placement rules on every Assignment-generated Policy include label selectors that restrict enforcement to clusters matching the tenant's jurisdiction. A tenant in the EU sovereign cloud instance can only target EU-labeled clusters.
3. **Region-scoped Vault secret paths**: Each regional sovereign cloud instance runs its own Vault (or a dedicated KV engine mount). Secrets for EU tenants are stored in the EU Vault instance and are never replicated to other regions. PushSecrets and ExternalSecrets operate within region boundaries.
4. **Self-contained regional management plane** (fractal guarantee): Each regional sovereign cloud instance runs its own Argo CD, OCM hub, Keycloak, and operator set. Tenant CRs, operator reconciliation, and secret delivery all occur within the regional instance. The global hub receives only aggregated compliance status and inventory metadata — never tenant data or credentials.

**6. Cross-Cluster Secret Delivery**: Diagram of the PushSecret → Vault → ExternalSecret chain. Argo CD creates ServiceAccount on central, PushSecret writes token to Vault KV, ExternalSecret on services cluster pulls token into Kubernetes Secret for operator consumption. No kubeconfig files. No secrets in Git. Automatic refresh via ESO. In the fractal model, this chain is instantiated per regional instance — each region has its own Vault, its own PushSecrets, and its own ExternalSecrets. Cross-region secret flow does not exist by design.

**7. GitOps Bootstrap**: Visualization of the forty-plus sync wave sequence. Highlight the bootstrap gap (waves 22-26) where ExternalSecrets intentionally fail until Vault Kubernetes auth is established, then self-heal. Show the wave ordering: namespaces → infrastructure → identity → secrets → operators → tenancy. The same bootstrap sequence works for both a standalone single-region deployment and a regional instance within a fractal federation — the only difference is whether the global hub registration step is enabled.

**8. Results and Lessons Learned**:
- Forty-plus tenants managed across three service delivery models, five-minute tenant onboarding, zero secrets in Git
- Fractal architecture enables scaling from single-region to multi-region federation with the same operator codebase
- Data residency enforced structurally (region-bound clusters + scoped Vault + self-contained management plane), not just by policy
- Key pattern: OCM Policy as deployment vehicle (drift detection + compliance for free)
- Key pattern: operator RBAC least-privilege (Assignment operator cannot create/delete its own CRs)
- Key pattern: service model selection via CR configuration, not platform forks
- Key antipattern: Jinja2 `.keys` collision with Vault API responses
- Key insight: bootstrap gap is a feature, not a bug — ESO retry handles circular dependencies

---

## Submission Checklist

- [ ] Title is in title case
- [ ] Description is written in third person
- [ ] Description complies with LF Inclusive Language Initiative
- [ ] No vendor sales pitch — focuses on patterns, CNCF projects, and reusable techniques
- [ ] CNCF projects listed: Kubernetes, Argo, Helm, Open Cluster Management
- [ ] Case study box checked
- [ ] "Please also consider this for a Poster Session" box checked
- [ ] Speaker bio(s) written in third person
- [ ] Prior talk recording or short YouTube video linked in Additional Resources
- [ ] Reviewed KubeCon Code of Conduct
- [ ] Submission is not identical to a talk given at a prior LF event in the past year
