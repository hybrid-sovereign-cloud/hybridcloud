#!/usr/bin/env python3
"""Generate 34 feature spec files for hybridcloud/specs/."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPECS_OUT = ROOT / "specs"

SPECS = [
    {
        "id": "001",
        "slug": "entity-management",
        "title": "Entity Management",
        "kind": "Entity",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "primary",
        "namespace": "sovereign-cloud",
        "description": (
            "Entity is the top-level tenancy boundary. Creating an Entity CR triggers the "
            "primary operator to provision an `entity-<name>` namespace, deploy a namespace "
            "operator, configure namespace RBAC roles, and register the entity with Keycloak."
        ),
        "schema_summary": (
            "`spec.description`, `spec.billingID`, `spec.websiteLink`, and `spec.namespaceRbac` "
            "map 14 named RBAC role keys to lists of Rbac CR names resolved at reconcile time."
        ),
        "api_fields": [
            ("metadata.name", "string", "Unique entity identifier; drives namespace name `entity-<name>`"),
            ("spec.description", "string", "Human-readable tenant description"),
            ("spec.billingID", "string", "Optional billing reference"),
            ("spec.websiteLink", "string", "Optional tenant website URL"),
            ("spec.namespaceRbac", "map[string][]string", "Role key → Rbac CR name list"),
            ("status.ready", "boolean", "True when namespace operator is deployed and healthy"),
            ("status.conditions", "[]Condition", "Reconciliation conditions"),
        ],
        "deployment": [
            "Deploy primary operator and CRDs (sync-wave 38)",
            "Apply Entity CR to `sovereign-cloud` namespace",
            "Verify `entity-<name>` namespace created with `hybridsovereign.redhat/entity` label",
            "Verify namespace operator Deployment is Running in entity namespace",
        ],
        "testing": [
            "Apply `samples/entity/acme-corp.yaml` and verify namespace creation",
            "Create Team CR in entity namespace; confirm namespace operator reconciles",
            "Delete Entity CR and verify finalizer tears down namespace operator",
        ],
        "security": [
            "Entity CRs only in `sovereign-cloud`; cluster-admin or platform-admin required",
            "No credentials in Entity spec — RBAC references resolved via Rbac CR status",
            "Namespace isolation: each entity gets dedicated namespace operator with namespace-scoped Role",
        ],
    },
    {
        "id": "002",
        "slug": "team-management",
        "title": "Team Management",
        "kind": "Team",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace",
        "namespace": "entity-<name>",
        "description": (
            "Team CRs represent organizational units within an entity. The namespace operator "
            "reconciles Team membership, Keycloak group bindings, and RBAC references."
        ),
        "schema_summary": "`spec.description`, `spec.members` (Keycloak usernames), and optional RBAC role bindings.",
        "api_fields": [
            ("metadata.name", "string", "Team name within entity"),
            ("spec.description", "string", "Team description"),
            ("spec.members", "[]string", "Keycloak usernames"),
            ("status.ready", "boolean", "Reconciliation complete"),
        ],
        "deployment": [
            "Prerequisite: Entity CR reconciled, entity namespace exists",
            "Apply Team CR to entity namespace",
            "Verify Keycloak group created/updated via RbacConfig integration",
        ],
        "testing": [
            "Apply `samples/team/alpha.yaml` in entity-acme-corp",
            "Verify status.ready and Keycloak group membership",
        ],
        "security": [
            "TeamAdmin/TeamView RBAC enforced via Entity namespaceRbac mapping",
            "Dashboard uses user OAuth token, not service account",
        ],
    },
    {
        "id": "003",
        "slug": "assignment-management",
        "title": "Assignment Management",
        "kind": "Assignment",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace",
        "namespace": "entity-<name>",
        "description": (
            "Assignment binds Teams to PlatformOpenshift clusters with scoped RBAC. "
            "Creates ACM ManagedClusterSetBinding and cluster-scoped RBAC on central cluster."
        ),
        "schema_summary": (
            "`spec.team`, `spec.platform`, `spec.clusterRbac` map cluster roles to Rbac CR names."
        ),
        "api_fields": [
            ("spec.team", "string", "Team CR name"),
            ("spec.platform", "string", "PlatformOpenshift CR name"),
            ("spec.clusterRbac", "map[string][]string", "Cluster role → Rbac CR names"),
            ("status.ready", "boolean", "Assignment active on target cluster"),
        ],
        "deployment": [
            "Prerequisites: Team, PlatformOpenshift, Rbac CRs exist and ready",
            "Apply Assignment CR to entity namespace",
            "Verify central cluster RBAC and ManagedClusterSetBinding",
        ],
        "testing": [
            "Apply `samples/assignment/ses12-platform-eng.yaml` after ocp-ses12 is ready",
            "Verify ACM binding and cluster role bindings on central",
        ],
        "security": [
            "AssignmentAdmin RBAC required to create/modify",
            "Central cluster SA token delivered via PushSecret from Vault — never in git",
        ],
    },
    {
        "id": "004",
        "slug": "project-management",
        "title": "Project Management",
        "kind": "Project",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace",
        "namespace": "entity-<name>",
        "description": "Project CRs define logical application groupings within an entity with optional team associations.",
        "schema_summary": "`spec.description`, `spec.teams` list linking projects to Team CRs.",
        "api_fields": [
            ("metadata.name", "string", "Project name"),
            ("spec.description", "string", "Project description"),
            ("spec.teams", "[]string", "Associated Team CR names"),
        ],
        "deployment": ["Apply Project CR after Teams exist in entity namespace"],
        "testing": ["Apply `samples/project/website.yaml` and verify status.ready"],
        "security": ["ProjectAdmin/ProjectView enforced via Entity namespaceRbac"],
    },
    {
        "id": "005",
        "slug": "persona-management",
        "title": "Persona Management",
        "kind": "Persona",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace",
        "namespace": "entity-<name>",
        "description": (
            "Persona CRs define reusable permission bundles (platform-admin, cloud-viewer, etc.) "
            "mapped to Rbac CR references for Keycloak group assignment."
        ),
        "schema_summary": "`spec.description`, `spec.rbacRefs` listing Rbac CR names for the persona.",
        "api_fields": [
            ("metadata.name", "string", "Persona identifier"),
            ("spec.rbacRefs", "[]string", "Rbac CR names included in persona"),
        ],
        "deployment": ["Apply Persona CR after Rbac CRs exist"],
        "testing": ["Apply `samples/persona/platform-admin.yaml`"],
        "security": ["IdentityAdmin required to manage personas"],
    },
    {
        "id": "006",
        "slug": "platform-openshift",
        "title": "Platform OpenShift",
        "kind": "PlatformOpenshift",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace",
        "namespace": "entity-<name>",
        "description": (
            "PlatformOpenshift provisions OpenShift clusters on OpenStack (CloudOSO) or AWS (CloudAWS). "
            "Creates ClusterBuild CR on central cluster and monitors installation."
        ),
        "schema_summary": (
            "`spec.type` (openstack|aws), `spec.openstack` or `spec.aws` blocks with environment, "
            "flavor, and node counts."
        ),
        "api_fields": [
            ("spec.type", "string", "openstack or aws"),
            ("spec.openstack.environment", "string", "CloudOSO CR name"),
            ("spec.openstack.controlPlaneCount", "integer", "Control plane nodes"),
            ("spec.openstack.workerCount", "integer", "Worker nodes"),
            ("status.ready", "boolean", "Cluster installed and accessible"),
        ],
        "deployment": [
            "Prerequisite: CloudOSO or CloudAWS status.ready == true",
            "Apply PlatformOpenshift CR",
            "Monitor ClusterBuild on central cluster",
        ],
        "testing": ["Apply `samples/platformopenshift/ocp-ses12.yaml` after ses12-env ready"],
        "security": [
            "OpenStack/AWS credentials from Vault only",
            "Cluster kubeconfig stored in Vault via PushSecret",
        ],
    },
    {
        "id": "007",
        "slug": "cloud-oso",
        "title": "CloudOSO (OpenStack)",
        "kind": "CloudOSO",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace",
        "namespace": "entity-<name>",
        "description": (
            "CloudOSO provisions an OpenStack project/environment for the entity. "
            "Creates OSOHelper type:environmentprep Job on central cluster."
        ),
        "schema_summary": (
            "`spec.vaultPath`, `spec.baseDomain`, `spec.projectDomain`, `spec.externalNetwork`, "
            "`spec.route53VaultPath`."
        ),
        "api_fields": [
            ("spec.vaultPath", "string", "Vault path for OpenStack credentials"),
            ("spec.baseDomain", "string", "DNS base domain for cluster routes"),
            ("spec.externalNetwork", "string", "OpenStack external network name"),
        ],
        "deployment": ["Apply CloudOSO CR; wait for environmentprep Job completion"],
        "testing": ["Apply `samples/cloudoso/ses12-env.yaml`"],
        "security": ["OpenStack credentials in Vault; DNS creds via route53VaultPath"],
    },
    {
        "id": "008",
        "slug": "cloud-aws",
        "title": "CloudAWS",
        "kind": "CloudAWS",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace",
        "namespace": "entity-<name>",
        "description": (
            "CloudAWS provisions an AWS account environment for the entity. "
            "Creates AWSHelper type:environmentprep Job on central cluster."
        ),
        "schema_summary": (
            "`spec.account`, `spec.vaultPath`, `spec.baseDomain`, `spec.toolRbac` for IAM role mappings."
        ),
        "api_fields": [
            ("spec.account", "string", "12-digit AWS account ID"),
            ("spec.vaultPath", "string", "Vault path for AWS credentials"),
            ("spec.toolRbac.accountAdminRbac", "[]string", "AdministratorAccess Rbac refs"),
        ],
        "deployment": ["Apply CloudAWS CR; verify AWSHelper Job on central"],
        "testing": ["Apply `samples/cloudaws/cloudaws-dev.yaml` with sanitized account ID"],
        "security": ["Never commit AWS account IDs or credentials; use Vault + ExternalSecret"],
    },
    {
        "id": "009",
        "slug": "openstack-migration",
        "title": "OpenStack Migration",
        "kind": "OpenStackMigration",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace",
        "namespace": "entity-<name>",
        "description": (
            "OpenStackMigration CR triggers VMware-to-OpenStack VM migration via "
            "os_migrate.vmware_migration_kit playbooks executed by EDA."
        ),
        "schema_summary": "Migration source (VMware), target CloudOSO project, VM inventory, network/flavor maps.",
        "api_fields": [
            ("spec.source", "object", "VMware vCenter connection (Vault ref)"),
            ("spec.target", "object", "CloudOSO project reference"),
            ("spec.vms", "[]string", "VM names to migrate"),
        ],
        "deployment": ["Prerequisites: CloudOSO ready, MTV operator, conversion host deployed"],
        "testing": ["Apply `samples/openstackmigration/website.yaml` in test entity"],
        "security": ["VMware and OpenStack creds in Vault only; migration logs to S3 via PushSecret"],
    },
    {
        "id": "010",
        "slug": "plugin-aap",
        "title": "Plugin AAP",
        "kind": "AAPConfig, AAPOrg",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "primary (AAPConfig) / namespace (AAPOrg)",
        "namespace": "sovereign-cloud-plugins / entity-<name>",
        "description": (
            "AAPConfig configures the AAP controller connection and OIDC. "
            "AAPOrg creates entity-scoped AAP organizations with RBAC group mappings."
        ),
        "schema_summary": "AAPConfig: `spec.secret`, `spec.rbacConfig`. AAPOrg: org name, admin/executor RBAC refs.",
        "api_fields": [
            ("AAPConfig.spec.secret", "string", "K8s Secret name for AAP admin creds (ExternalSecret)"),
            ("AAPOrg.spec.aapAdminRbac", "[]string", "Rbac CR names for org admins"),
        ],
        "deployment": ["Deploy AAPConfig in plugins namespace; AAPOrg per entity"],
        "testing": ["Apply `samples/aapconfig/aap-sovereign-services.yaml` and `samples/aaporg/acme-corp.yaml`"],
        "security": ["AAP credentials via ExternalSecret from Vault; entity-prefixed org names"],
    },
    {
        "id": "011",
        "slug": "plugin-quay",
        "title": "Plugin Quay",
        "kind": "QuayConfig, QuayOrg",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "primary (QuayConfig) / namespace (QuayOrg)",
        "namespace": "sovereign-cloud-plugins / entity-<name>",
        "description": "QuayConfig configures Quay registry OIDC. QuayOrg creates entity-scoped Quay organizations.",
        "schema_summary": "QuayConfig: registry URL, OIDC client. QuayOrg: org name, admin RBAC refs.",
        "api_fields": [
            ("QuayConfig.spec.registryUrl", "string", "Quay registry base URL"),
            ("QuayOrg.spec.quayAdminRbac", "[]string", "Rbac CR names for org admins"),
        ],
        "deployment": ["Quay registry must be running; apply QuayConfig then QuayOrg"],
        "testing": ["Apply samples in quayconfig/ and quayorg/"],
        "security": ["All Quay repos private; OIDC via Keycloak; no robot tokens in git"],
    },
    {
        "id": "012",
        "slug": "plugin-rbac",
        "title": "Plugin RBAC",
        "kind": "RbacConfig, Rbac",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "primary (RbacConfig) / namespace (Rbac)",
        "namespace": "sovereign-cloud-plugins / entity-<name>",
        "description": (
            "RbacConfig configures Keycloak realm/clients for tenant RBAC. "
            "Rbac CRs define groups with members resolved to Keycloak group paths."
        ),
        "schema_summary": "RbacConfig: Keycloak realm ref. Rbac: `spec.members`, `spec.description`, status.group.",
        "api_fields": [
            ("Rbac.spec.members", "[]string", "Keycloak usernames"),
            ("Rbac.status.group", "string", "Resolved Keycloak group path"),
        ],
        "deployment": ["Apply RbacConfig first; then Rbac CRs per entity"],
        "testing": ["Apply `samples/rbacconfig/keycloak.yaml` then rbac samples"],
        "security": ["Keycloak admin creds via ExternalSecret; group paths entity-scoped"],
    },
    {
        "id": "013",
        "slug": "plugin-vault",
        "title": "Plugin Vault",
        "kind": "Vault, VaultKV",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace",
        "namespace": "entity-<name>",
        "description": (
            "Vault CR deploys entity-scoped Vault HA instance. "
            "VaultKV CR creates KV secret engines with OIDC auth and RBAC policies."
        ),
        "schema_summary": "Vault: `spec.ha`, `spec.rbacConfig`. VaultKV: engine path, admin/reader RBAC refs.",
        "api_fields": [
            ("Vault.spec.ha", "boolean", "Enable HA Raft mode"),
            ("VaultKV.spec.path", "string", "KV engine mount path"),
        ],
        "deployment": ["Apply Vault CR; wait for init/unseal; apply VaultKV CRs"],
        "testing": ["Apply `samples/vault/acme-vault.yaml` and vaultkv samples"],
        "security": ["Root token/unseal keys via ExternalSecret; OIDC auth via Keycloak"],
    },
    {
        "id": "014",
        "slug": "iaac-git-sync",
        "title": "IAAC Git Sync",
        "kind": "Iaac",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "StatefulSet (Python)",
        "namespace": "sovereign-cloud",
        "description": (
            "IAAC replaces the Go operator with a Python StatefulSet that watches all "
            "hybridsovereign CRDs and syncs them to a Gitea Git repository for config-as-code."
        ),
        "schema_summary": "Iaac CR configures git remote, branch, sync interval, and CRD filter.",
        "api_fields": [
            ("spec.repoUrl", "string", "Gitea repository URL"),
            ("spec.branch", "string", "Target branch"),
            ("spec.syncInterval", "string", "Reconciliation interval"),
        ],
        "deployment": ["Deploy IAAC StatefulSet (sync-wave 40); apply Iaac CR"],
        "testing": ["Apply `samples/iaac/iaac.yaml`; verify git commits for CR changes"],
        "security": ["Gitea token from Vault; no credentials in Iaac CR spec"],
    },
    {
        "id": "015",
        "slug": "event-forwarder",
        "title": "Event Forwarder",
        "kind": "N/A (DaemonSet)",
        "api_group": "N/A",
        "operator": "Helm chart",
        "namespace": "sovereign-cloud-jobs",
        "description": (
            "Event forwarder watches Kubernetes events and audit logs, forwarding them "
            "to AMQ Streams Kafka topics for EDA rulebook consumption."
        ),
        "schema_summary": "Helm values: Kafka bootstrap servers, topic names, filter rules.",
        "api_fields": [],
        "deployment": ["Deploy event-forwarder chart after AMQ Streams (sync-wave 13+)"],
        "testing": ["Create CR; verify event appears on hybridsovereign-events topic"],
        "security": ["Kafka TLS; SASL credentials via ExternalSecret"],
    },
    {
        "id": "016",
        "slug": "amq-streams",
        "title": "AMQ Streams",
        "kind": "Kafka (Strimzi)",
        "api_group": "kafka.strimzi.io/v1beta2",
        "operator": "OLM Subscription",
        "namespace": "amq-streams",
        "description": (
            "AMQ Streams provides the Kafka event bus replacing direct EDA event streams. "
            "Topics: hybridsovereign-events, hybridsovereign-audit."
        ),
        "schema_summary": "Kafka cluster CR: 3 brokers, 3 ZooKeeper; KafkaTopic CRs for event routing.",
        "api_fields": [
            ("Kafka.spec.kafka.replicas", "integer", "Broker count"),
            ("KafkaTopic.spec.partitions", "integer", "Topic partitions"),
        ],
        "deployment": ["Install AMQ Streams operator via OLM; create Kafka cluster and topics"],
        "testing": ["Verify Kafka cluster Ready; produce/consume test message"],
        "security": ["TLS encryption; mutual auth for producers/consumers"],
    },
    {
        "id": "017",
        "slug": "vm-migration-vmware",
        "title": "VM Migration (VMware)",
        "kind": "OpenStackMigration",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "namespace + EDA",
        "namespace": "entity-<name>",
        "description": (
            "VMware-to-CloudOSO migration using os_migrate.vmware_migration_kit with "
            "conversion host on target OpenStack project and nbdkit/VDDK data transfer."
        ),
        "schema_summary": "See 009-openstack-migration; adds conversion host deployment and warm/cold migration modes.",
        "api_fields": [],
        "deployment": [
            "Deploy conversion host via deploy_conversion_host.yml playbook",
            "Configure MTV provider with VMware inventory",
            "Apply OpenStackMigration CR to trigger EDA rulebook",
        ],
        "testing": ["Run discovery.yml; migrate test VM; verify Nova instance on CloudOSO"],
        "security": ["VMware creds seeded via vmwareInit Job to Vault; VDDK libs on conversion host"],
    },
    {
        "id": "018",
        "slug": "admin-dashboard-ui",
        "title": "Admin Dashboard UI",
        "kind": "N/A",
        "api_group": "N/A",
        "operator": "Deployment",
        "namespace": "sovereign-cloud",
        "description": (
            "Standalone admin dashboard (PatternFly 5, React 18, TypeScript) for platform "
            "administrators to manage all CR types across entities."
        ),
        "schema_summary": "N/A — UI consumes K8s API via user OAuth token proxy.",
        "api_fields": [],
        "deployment": ["Build/push dashboard image; deploy via sovereign-dashboard Helm chart"],
        "testing": ["Login via Keycloak; verify CR list/create/edit/delete for all types"],
        "security": ["User OAuth token only; RBAC-aware UI hiding forbidden actions"],
    },
    {
        "id": "019",
        "slug": "tenant-dashboard-ui",
        "title": "Tenant Dashboard UI",
        "kind": "N/A",
        "api_group": "N/A",
        "operator": "Deployment",
        "namespace": "sovereign-cloud",
        "description": (
            "Tenant-scoped dashboard for entity admins and developers to manage "
            "teams, projects, clouds, and assignments within their entity."
        ),
        "schema_summary": "N/A — scoped to user's entity namespace via RBAC.",
        "api_fields": [],
        "deployment": ["Deploy tenancy-dashboard chart on services cluster"],
        "testing": ["Login as tenant user; verify entity scoping and CRUD permissions"],
        "security": ["14 named RBAC roles enforced; no cross-entity data leakage"],
    },
    {
        "id": "020",
        "slug": "admin-console-plugin",
        "title": "Admin Console Plugin",
        "kind": "ConsolePlugin",
        "api_group": "console.openshift.io/v1",
        "operator": "Helm chart",
        "namespace": "sovereign-cloud",
        "description": "OpenShift console plugin embedding admin dashboard pages with PatternFly 5 dark/light mode.",
        "schema_summary": "ConsolePlugin CR: proxy endpoints, service reference, display metadata.",
        "api_fields": [
            ("ConsolePlugin.spec.proxy", "[]Proxy", "Backend service proxy config"),
        ],
        "deployment": ["Deploy sovereign-admin-plugin chart; enable in console operator config"],
        "testing": ["Open console; verify Hybrid Sovereign nav section loads"],
        "security": ["Console proxy uses user token; CSP headers configured"],
    },
    {
        "id": "021",
        "slug": "tenant-console-plugin",
        "title": "Tenant Console Plugin",
        "kind": "ConsolePlugin",
        "api_group": "console.openshift.io/v1",
        "operator": "Helm chart",
        "namespace": "sovereign-cloud",
        "description": "OpenShift console plugin for tenant-scoped resource management.",
        "schema_summary": "ConsolePlugin CR with tenant-scoped API proxy.",
        "api_fields": [],
        "deployment": ["Deploy sovereign-tenant-plugin chart"],
        "testing": ["Verify tenant pages render in console with correct RBAC"],
        "security": ["Same token-only policy as admin plugin"],
    },
    {
        "id": "022",
        "slug": "vault-integration",
        "title": "Vault Integration",
        "kind": "N/A",
        "api_group": "N/A",
        "operator": "Helm charts + Jobs",
        "namespace": "vault / external-secrets",
        "description": (
            "Platform Vault HA deployment on central and services clusters with "
            "k8s auth, OIDC, KV engines, and ESO ClusterSecretStore integration."
        ),
        "schema_summary": "Vault Helm: Raft HA, ingress, auto-unseal. Jobs: vaultInit, vaultKv, vaultK8sAuth.",
        "api_fields": [],
        "deployment": [
            "Phase A5: Deploy Vault (sync-wave 15)",
            "Phase A6: vault-init, vault-kv, vault-k8s-auth Jobs",
            "Configure ClusterSecretStore with k8s auth on both clusters",
        ],
        "testing": ["ExternalSecret test sync; Vault OIDC login via Keycloak"],
        "security": ["No token auth for ESO; k8s auth only; root token never in git"],
    },
    {
        "id": "023",
        "slug": "keycloak-sso",
        "title": "Keycloak SSO",
        "kind": "N/A",
        "api_group": "N/A",
        "operator": "RHBK Helm + Jobs",
        "namespace": "rhbk / services-rhbk",
        "description": (
            "Red Hat Build of Keycloak for SSO across dashboards, Vault, Quay, AAP, "
            "and OpenShift OAuth with sovereign-central and tenant realms."
        ),
        "schema_summary": "RHBK instance CR; Jobs for realms, groups, clients, RBAC, OAuth integration.",
        "api_fields": [],
        "deployment": [
            "Phase A7: Deploy RHBK (sync-wave 20)",
            "Phase A8: keycloak-realms, groups, clients, rbac, oauth Jobs",
        ],
        "testing": ["OAuth login on both clusters; verify group membership drives RBAC"],
        "security": ["Admin creds in Vault; test users via keycloak-test-users Job only"],
    },
    {
        "id": "024",
        "slug": "rhacm-gitops",
        "title": "RHACM GitOps",
        "kind": "GitOpsCluster",
        "api_group": "apps.open-cluster-management.io/v1beta1",
        "operator": "RHACM",
        "namespace": "open-cluster-management",
        "description": (
            "Advanced Cluster Management with GitOpsCluster pull model syncing "
            "services cluster applications from central ArgoCD."
        ),
        "schema_summary": "GitOpsCluster CR: ArgoCD server ref, managed cluster, placement rules.",
        "api_fields": [
            ("GitOpsCluster.spec.argocdServer", "object", "Central ArgoCD reference"),
            ("GitOpsCluster.spec.placement", "object", "Cluster placement"),
        ],
        "deployment": [
            "Phase A4: Deploy RHACM; import services cluster",
            "Phase F: Create GitOpsCluster CR",
        ],
        "testing": ["Verify GitOpsCluster Connected; services apps sync via ACM"],
        "security": ["ArgoCD credentials via Vault; least-privilege ManagedCluster RBAC"],
    },
    {
        "id": "025",
        "slug": "acs-security",
        "title": "ACS Security",
        "kind": "N/A",
        "api_group": "N/A",
        "operator": "ACS Helm + Job",
        "namespace": "stackrox",
        "description": (
            "Red Hat Advanced Cluster Security central deployment with cluster "
            "registration and OIDC integration for both clusters."
        ),
        "schema_summary": "ACS Central CR; acs-config Job for cluster registration and OIDC.",
        "api_fields": [],
        "deployment": ["Phase B1: Deploy ACS (sync-wave 25); run acs-config Job"],
        "testing": ["Verify both clusters registered; OIDC login works"],
        "security": ["ACS admin password via ExternalSecret; network policies enforced"],
    },
    {
        "id": "026",
        "slug": "aap-config-as-code",
        "title": "AAP Config as Code",
        "kind": "N/A",
        "api_group": "N/A",
        "operator": "Ansible playbook",
        "namespace": "sovereign-cloud-jobs",
        "description": (
            "AAP controller and EDA configuration managed via infra.aap_configuration "
            "collection in aap-config/ directory."
        ),
        "schema_summary": "YAML inventories for credentials, projects, job templates, DEs, rulebook activations.",
        "api_fields": [],
        "deployment": ["Run aap-config/playbook.yml via sovereign Job after AAP license Jobs"],
        "testing": ["Verify job templates, projects, and EDA activations match config"],
        "security": ["AAP credentials from Vault; no tokens in aap-config/"],
    },
    {
        "id": "027",
        "slug": "quay-registry",
        "title": "Quay Registry",
        "kind": "N/A",
        "api_group": "N/A",
        "operator": "Quay Helm + Jobs",
        "namespace": "quay / services-quay",
        "description": "Red Hat Quay registry on central and services clusters with OIDC and Postgres backend.",
        "schema_summary": "Quay config bundle; quay-central-config and quay-services-config Jobs.",
        "api_fields": [],
        "deployment": ["Phase B3: Deploy Quay (sync-wave 35-37); run config Jobs"],
        "testing": ["Push/pull test image; verify OIDC login"],
        "security": ["All repos private; config secret via ExternalSecret; TLS required"],
    },
    {
        "id": "028",
        "slug": "crunchy-postgres",
        "title": "Crunchy Postgres",
        "kind": "PostgresCluster",
        "api_group": "postgres-operator.crunchydata.com/v1beta1",
        "operator": "PGO",
        "namespace": "openshift-operators",
        "description": "Crunchy Postgres Operator providing HA Postgres for Keycloak, Quay, Gitea, and AAP.",
        "schema_summary": "PostgresCluster CR: instances, backups, pgBouncer, monitoring.",
        "api_fields": [
            ("PostgresCluster.spec.instances", "[]Instance", "HA replica configuration"),
        ],
        "deployment": ["Phase A2: Deploy PGO (sync-wave 11) on both clusters"],
        "testing": ["Verify PostgresCluster Ready; connectivity from dependent services"],
        "security": ["Postgres passwords via ExternalSecret; encrypted storage"],
    },
    {
        "id": "029",
        "slug": "gitea-git-server",
        "title": "Gitea Git Server",
        "kind": "N/A",
        "api_group": "N/A",
        "operator": "Gitea Helm + Jobs",
        "namespace": "gitea",
        "description": (
            "Gitea git server on central cluster for IAAC sync, cluster builds, and tenancy repo."
        ),
        "schema_summary": "Gitea Helm values; gitea-init and gitea-create-repo Jobs.",
        "api_fields": [],
        "deployment": ["Phase B4: Deploy Gitea (sync-wave 18, 35-36); run init Jobs"],
        "testing": ["Verify Gitea accessible; tenancy_repo exists; IAAC syncs CRs"],
        "security": ["Admin token stored in Vault via gitea-init Job"],
    },
    {
        "id": "030",
        "slug": "odf-storage",
        "title": "ODF Storage",
        "kind": "StorageCluster",
        "api_group": "ocs.openshift.io/v1",
        "operator": "ODF",
        "namespace": "openshift-storage",
        "description": "OpenShift Data Foundation providing Noobaa object storage and Ceph-backed PVCs.",
        "schema_summary": "StorageCluster CR: mode, resources, encryption, multiCloudGateway.",
        "api_fields": [
            ("StorageCluster.spec.multiCloudGateway", "object", "Noobaa gateway config"),
        ],
        "deployment": ["Phase A3: Deploy ODF (sync-wave 12) on both clusters"],
        "testing": ["Verify Noobaa running; test PVC and object bucket claim"],
        "security": ["Encryption at rest; KMS integration via Vault optional"],
    },
    {
        "id": "031",
        "slug": "cnv-virtualization",
        "title": "CNV Virtualization",
        "kind": "HyperConverged",
        "api_group": "hco.kubevirt.io/v1beta1",
        "operator": "CNV",
        "namespace": "openshift-cnv",
        "description": "OpenShift Virtualization (CNV) for VM workloads; deployed alongside ODF.",
        "schema_summary": "HyperConverged CR enabling KubeVirt with storage class integration.",
        "api_fields": [
            ("HyperConverged.spec.storageClassName", "string", "Default storage class"),
        ],
        "deployment": ["Phase A3: Deploy CNV after ODF"],
        "testing": ["Verify HyperConverged Available; launch test VM"],
        "security": ["SCC restrictions; network policies for VM workloads"],
    },
    {
        "id": "032",
        "slug": "mtv-migration-toolkit",
        "title": "MTV Migration Toolkit",
        "kind": "Provider",
        "api_group": "forklift.konveyor.io/v1beta1",
        "operator": "MTV",
        "namespace": "openshift-mtv",
        "description": (
            "Migration Toolkit for Virtualization for VMware inventory discovery "
            "and migration planning integrated with OpenStackMigration CRs."
        ),
        "schema_summary": "Provider CR for VMware; StorageMap, NetworkMap for target CloudOSO.",
        "api_fields": [
            ("Provider.spec.url", "string", "vCenter URL (from Vault)"),
            ("Provider.spec.secret", "objectRef", "Credentials secret reference"),
        ],
        "deployment": ["Phase B6: Deploy MTV (sync-wave 28); vmware-init and mtv-catalog-sync Jobs"],
        "testing": ["Verify Provider Ready; VM inventory populated"],
        "security": ["VMware creds in Vault; MTV namespace isolated"],
    },
    {
        "id": "033",
        "slug": "unified-operator",
        "title": "Unified Operator",
        "kind": "All hybridsovereign CRDs",
        "api_group": "hybridsovereign.redhat/v1alpha1",
        "operator": "primary + namespace",
        "namespace": "sovereign-cloud / entity-<name>",
        "description": (
            "Multi-tier operator architecture consolidating 13 Ansible operators into "
            "primary (Entity + plugin configs) and per-entity namespace operators."
        ),
        "schema_summary": (
            "Primary watches: Entity, RbacConfig, AAPConfig, QuayConfig. "
            "Namespace watches: Team, Assignment, Project, Persona, PlatformOpenshift, "
            "CloudOSO, CloudAWS, OpenStackMigration, Rbac, AAPOrg, QuayOrg, Vault, VaultKV."
        ),
        "api_fields": [],
        "deployment": [
            "Phase C1-C2: Build primary and namespace operator images",
            "Phase C3: Deploy primary operator with all CRDs",
            "Phase C6: Entity creation end-to-end test",
        ],
        "testing": [
            "Create Entity → verify namespace operator spawn",
            "Create each CR type → verify reconciliation",
            "Delete Entity → verify finalizer cleanup",
        ],
        "security": [
            "Primary uses ClusterRole; namespace operator uses namespace-scoped Role",
            "All Ansible roles use no_log for credential tasks",
            "AMQ event publishing for audit trail",
        ],
    },
    {
        "id": "034",
        "slug": "bootstrap-deployment",
        "title": "Bootstrap Deployment",
        "kind": "N/A",
        "api_group": "N/A",
        "operator": "Helm init chart",
        "namespace": "openshift-gitops",
        "description": (
            "Phased ArgoCD bootstrap deploying all platform components across "
            "central and services clusters with sync-wave ordering and verification gates."
        ),
        "schema_summary": (
            "bootstrap/helm/init seeds ArgoCD app-of-apps; central/values.yaml drives "
            "all Application CRs with sync-wave annotations."
        ),
        "api_fields": [],
        "deployment": [
            "make check-env && cd bootstrap && make upload-all-charts",
            "make init-central-argo (bootstrap entry point)",
            "Monitor ArgoCD sync through Mega-Phases A→J",
        ],
        "testing": [
            "oc get applications -n openshift-gitops — all Synced/Healthy",
            "Run global_tests suite after each mega-phase gate",
        ],
        "security": [
            "Bootstrap seeds secrets from env vars only (one-time)",
            "All post-bootstrap secrets via Vault + ESO",
            "Never oc apply after init-central-argo",
        ],
    },
]


def render_spec(spec: dict) -> str:
    lines = [
        f"# Spec {spec['id']}: {spec['title']}",
        "",
        f"**Spec ID**: `{spec['id']}-{spec['slug']}`",
        f"**API Group**: `{spec['api_group']}`",
        f"**Kind**: {spec['kind']}",
        f"**Operator**: {spec['operator']}",
        f"**Namespace**: `{spec['namespace']}`",
        "",
        "## Description",
        "",
        spec["description"],
        "",
    ]

    if spec.get("schema_summary"):
        lines.extend(["## CRD Schema Summary", "", spec["schema_summary"], ""])

    if spec.get("api_fields"):
        lines.extend(
            [
                "## API Reference",
                "",
                "| Field | Type | Description |",
                "|-------|------|-------------|",
            ]
        )
        for field, ftype, desc in spec["api_fields"]:
            lines.append(f"| `{field}` | {ftype} | {desc} |")
        lines.append("")

    lines.extend(["## Deployment Steps", ""])
    for i, step in enumerate(spec["deployment"], 1):
        lines.append(f"{i}. {step}")
    lines.append("")

    lines.extend(["## Testing Guide", ""])
    for step in spec["testing"]:
        lines.append(f"- {step}")
    lines.append("")

    lines.extend(["## Security Considerations", ""])
    for item in spec["security"]:
        lines.append(f"- {item}")
    lines.append("")

    lines.extend(
        [
            "## Related Samples",
            "",
            f"See [`samples/`](../samples/) for sanitized CR examples.",
            f"See [`tests/`](../tests/) for holistic test specs.",
            "",
        ]
    )

    return "\n".join(lines)


def write_specs_index() -> None:
    lines = [
        "# Hybridcloud Feature Specifications",
        "",
        "Detailed specifications for all 34 platform features in the hybridcloud monorepo.",
        "Each spec covers description, CRD schema, API reference, deployment, testing, and security.",
        "",
        "## Index",
        "",
        "| # | Spec | Kind / Component | Operator |",
        "|---|------|------------------|----------|",
    ]
    for spec in SPECS:
        lines.append(
            f"| {spec['id']} | [{spec['title']}](./{spec['id']}-{spec['slug']}/spec.md) "
            f"| {spec['kind']} | {spec['operator']} |"
        )

    lines.extend(
        [
            "",
            "## Mega-Phase Mapping",
            "",
            "| Mega-Phase | Specs |",
            "|------------|-------|",
            "| A: Foundation | 022, 023, 028, 030, 031, 024 |",
            "| B: Platform Services | 025, 026, 027, 029, 016, 032 |",
            "| C: Operator + IAAC | 001-014, 033 |",
            "| D: Event System | 015, 016 |",
            "| E: UI | 018-021 |",
            "| F: ACM GitOps | 024 |",
            "| G: VM Migration | 009, 017, 032 |",
            "| H: AAP Config | 026, 010 |",
            "| I: Specs + Samples | (this directory) |",
            "| J: Security + Tests | All specs § Security |",
            "",
            "## Conventions",
            "",
            "- API group for tenancy CRs: `hybridsovereign.redhat/v1alpha1`",
            "- Primary operator namespace: `sovereign-cloud`",
            "- Plugin config namespace: `sovereign-cloud-plugins`",
            "- Entity namespaces: `entity-<name>`",
            "- All deployments via ArgoCD after `make init-central-argo`",
            "",
        ]
    )
    (SPECS_OUT / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    SPECS_OUT.mkdir(parents=True, exist_ok=True)

    created = []
    for spec in SPECS:
        spec_dir = SPECS_OUT / f"{spec['id']}-{spec['slug']}"
        spec_dir.mkdir(parents=True, exist_ok=True)
        spec_path = spec_dir / "spec.md"
        spec_path.write_text(render_spec(spec), encoding="utf-8")
        created.append(spec_path.relative_to(SPECS_OUT))

    write_specs_index()
    print(f"Generated {len(created)} spec files in {SPECS_OUT}")
    for path in created:
        print(f"  {path}")


if __name__ == "__main__":
    main()
