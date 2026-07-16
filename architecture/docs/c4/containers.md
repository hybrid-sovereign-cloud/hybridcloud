# C4 Level 2 — Container Diagrams

**Scope**: Central and services OpenShift clusters  
**Last updated**: 2026-07-15

---

## Overview

One ArgoCD on central manages both clusters. Custom `hybridsovereign.redhat` operators and tenant UIs run on **services**. Management plane (ArgoCD, RHACM, Vault, Gitea, Kafka, AAP EDA) runs on **central**. Secrets never appear in Git.

---

## Central cluster containers

```mermaid
C4Container
    title Central Cluster — Management Plane

    Person(admin, "Platform Administrator")

    System_Boundary(central, "Central Cluster") {
        Container(argocd, "ArgoCD", "OpenShift GitOps", "App-of-apps; deploys central + services")
        Container(rhacm, "RHACM", "OLM", "Registers services; spoke lifecycle")
        Container(vault, "Vault", "HA Raft x3", "KV secrets; k8s + OIDC auth")
        Container(eso, "External Secrets", "OLM", "Vault → K8s Secret sync")
        Container(gitea, "Gitea", "Helm", "tenancy_repo; cluster_builds")
        Container(keycloak, "Keycloak", "RHBK", "Realm sovereign-central")
        Container(aap, "AAP Controller", "AAP", "Job templates + execution")
        Container(eda, "AAP EDA", "AAP", "Kafka rulebook activations")
        Container(amq, "AMQ Streams", "Strimzi", "hybridsovereign-events")
        Container(jobs, "Sovereign Jobs", "Ansible Job", "Bootstrap and config-as-code")
        Container(acs, "ACS Central", "RHACS", "Security scanning (lab)")
    }

    System_Ext(quay, "Quay Registry")
    System_Ext(services, "Services Cluster")

    Rel(admin, argocd, "Monitor sync", "HTTPS")
    Rel(argocd, services, "Deploy workloads", "K8s API remote")
    Rel(argocd, quay, "Pull OCI charts", "OCI")
    Rel(rhacm, services, "Import managed cluster", "Klusterlet")
    Rel(jobs, aap, "infra.aap_configuration", "HTTPS")
    Rel(jobs, eda, "Activations / DEs / creds", "HTTPS")
    Rel(eso, vault, "Read KV", "HTTPS")
    Rel(eda, amq, "Consume events", "Kafka SASL_SSL")
    Rel(eda, aap, "run_job_template", "HTTPS")
```

### Central namespaces (selected)

| Namespace | Containers |
|-----------|------------|
| `openshift-gitops` | ArgoCD |
| `open-cluster-management` | RHACM / MultiClusterHub |
| `central-vault` | Vault HA (3) + injector |
| `external-secrets` / `external-secrets-operator` | ESO |
| `gitea` | Gitea |
| `central-rhbk` | Keycloak |
| `aap` | AAP Controller + EDA |
| `amq-streams` | Kafka `hybridsovereign-kafka` |
| `sovereign-cloud-jobs` | Ansible Jobs |
| `openshift-cnv` / MTV ns | Virtualization + migration toolkit |

---

## Services cluster containers

```mermaid
C4Container
    title Services Cluster — Workload Plane

    Person(platformAdmin, "Platform Administrator")
    Person(tenantUser, "Tenant User")

    System_Boundary(services, "Services Cluster") {
        Container(primaryOp, "Primary Operator", "Ansible Operator", "Entity + plugin configs")
        Container(nsOp, "Namespace Operator", "Ansible Operator", "Per-entity reconcile")
        Container(iaac, "IAAC Git Sync", "Python STS", "CR → Gitea mirror")
        Container(adminUI, "Admin Dashboard", "React", "Platform CR management")
        Container(tenantUI, "Tenant Dashboard", "React", "Entity self-service")
        Container(plugins, "Console Plugins", "OCP dynamic", "Admin + tenant console nav")
        Container(aapSvc, "AAP Controller", "AAP", "Controller only (no EDA)")
        Container(vaultSvc, "Vault", "HA Raft x3", "Services-local Vault")
        Container(esoSvc, "External Secrets", "OLM", "Vault → Secrets")
        Container(keycloak, "Keycloak", "RHBK", "Realm sovereign-tenants")
    }

    System_Boundary(entityNs, "entity-<name>") {
        Container(nsOpInst, "Namespace Operator", "Deployment", "Watches entity ns only")
        Container(tenantCRs, "Tenant CRs", "hybridsovereign.redhat", "Team, Project, Cloud…")
    }

    System_Ext(central, "Central Cluster")

    Rel(platformAdmin, adminUI, "Manage CRs", "OAuth + K8s proxy")
    Rel(tenantUser, tenantUI, "Entity CRs", "OAuth + K8s proxy")
    Rel(tenantUser, plugins, "Console views", "OAuth")
    Rel(primaryOp, nsOpInst, "Deploy on Entity create", "K8s API")
    Rel(primaryOp, central, "Publish events", "Kafka SASL_SSL")
    Rel(nsOpInst, central, "Publish events", "Kafka SASL_SSL")
    Rel(iaac, central, "git push tenancy_repo", "HTTPS")
    Rel(esoSvc, central, "Read vault-central KV", "HTTPS")
```

### Services namespaces (selected)

| Namespace | Containers |
|-----------|------------|
| `sovereign-cloud` | Primary operator, dashboards, console plugins |
| `sovereign-cloud-plugins` | IAAC git-sync; plugin config CRs |
| `sovereign-cloud-jobs` / `helpers` | Automation support |
| `aap` | AAP Controller (EDA disabled) |
| `services-vault` | Vault HA |
| `services-rhbk` | Keycloak |
| `entity-<name>` | Namespace operator + tenant CRs |

**Retired on services:** Event Forwarder DaemonSet (`eventForwarder.enabled: false`). Operators publish directly to Kafka.

---

## Cross-cluster communication

```mermaid
flowchart LR
    subgraph Central
        AG[ArgoCD]
        EDA[EDA]
        GI[Gitea]
        KF[Kafka]
        VC[Vault Central]
    end

    subgraph Services
        PO[Primary Operator]
        NO[Namespace Operator]
        IA[IAAC]
        UI[Dashboards]
        AC[AAP Controller]
    end

    AG -->|Helm sync remote| PO
    AG -->|Helm sync remote| NO
    AG -->|Helm sync remote| IA
    AG -->|Helm sync remote| UI
    AG -->|Helm sync remote| AC

    PO -->|produce| KF
    NO -->|produce| KF
    KF --> EDA
    EDA -->|run_job_template| AC
    IA -->|git push| GI
    UI -.->|OAuth user token| PO
```

| Path | Protocol | Credential source |
|------|----------|-------------------|
| ArgoCD → services API | K8s API | Bootstrap cluster secret / Vault |
| Operators → Kafka | SASL_SSL Route | Vault `amq-producer` via ExternalSecret |
| EDA → Kafka | SASL_SSL | EDA credential from Vault |
| EDA → AAP Controller | HTTPS | Controller token credential |
| IAAC → Gitea | HTTPS | Vault `gitea-admin` ExternalSecret |
| Dashboards → K8s API | OAuth user token | Keycloak OIDC |

---

## Sync-wave highlights

| Wave | Component | Cluster |
|------|-----------|---------|
| 10–15 | RHACM, Vault, AMQ Streams | Central |
| 20 | RHBK | Both |
| 30 | AAP (central EDA + services controller) | Both |
| 38 | Primary operator | Services |
| 40–42 | IAAC, dashboards, console plugins | Services |

Full table: `bootstrap/helm/central/values.yaml`.

---

## Related

- [context.md](context.md)
- [components/event-system.md](components/event-system.md)
- [components/operator.md](components/operator.md)
- [components/ui.md](components/ui.md)
