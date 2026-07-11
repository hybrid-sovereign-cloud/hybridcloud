# Hybridcloud Feature Specifications

Detailed specifications for all 34 platform features in the hybridcloud monorepo.
Each spec covers description, CRD schema, API reference, deployment, testing, and security.

## Index

| # | Spec | Kind / Component | Operator |
|---|------|------------------|----------|
| 001 | [Entity Management](./001-entity-management/spec.md) | Entity | primary |
| 002 | [Team Management](./002-team-management/spec.md) | Team | namespace |
| 003 | [Assignment Management](./003-assignment-management/spec.md) | Assignment | namespace |
| 004 | [Project Management](./004-project-management/spec.md) | Project | namespace |
| 005 | [Persona Management](./005-persona-management/spec.md) | Persona | namespace |
| 006 | [Platform OpenShift](./006-platform-openshift/spec.md) | PlatformOpenshift | namespace |
| 007 | [CloudOSO (OpenStack)](./007-cloud-oso/spec.md) | CloudOSO | namespace |
| 008 | [CloudAWS](./008-cloud-aws/spec.md) | CloudAWS | namespace |
| 009 | [OpenStack Migration](./009-openstack-migration/spec.md) | OpenStackMigration | namespace |
| 010 | [Plugin AAP](./010-plugin-aap/spec.md) | AAPConfig, AAPOrg | primary (AAPConfig) / namespace (AAPOrg) |
| 011 | [Plugin Quay](./011-plugin-quay/spec.md) | QuayConfig, QuayOrg | primary (QuayConfig) / namespace (QuayOrg) |
| 012 | [Plugin RBAC](./012-plugin-rbac/spec.md) | RbacConfig, Rbac | primary (RbacConfig) / namespace (Rbac) |
| 013 | [Plugin Vault](./013-plugin-vault/spec.md) | Vault, VaultKV | namespace |
| 014 | [IAAC Git Sync](./014-iaac-git-sync/spec.md) | Iaac | StatefulSet (Python) |
| 015 | [Event Forwarder](./015-event-forwarder/spec.md) | N/A (DaemonSet) | Helm chart |
| 016 | [AMQ Streams](./016-amq-streams/spec.md) | Kafka (Strimzi) | OLM Subscription |
| 017 | [VM Migration (VMware)](./017-vm-migration-vmware/spec.md) | OpenStackMigration | namespace + EDA |
| 018 | [Admin Dashboard UI](./018-admin-dashboard-ui/spec.md) | N/A | Deployment |
| 019 | [Tenant Dashboard UI](./019-tenant-dashboard-ui/spec.md) | N/A | Deployment |
| 020 | [Admin Console Plugin](./020-admin-console-plugin/spec.md) | ConsolePlugin | Helm chart |
| 021 | [Tenant Console Plugin](./021-tenant-console-plugin/spec.md) | ConsolePlugin | Helm chart |
| 022 | [Vault Integration](./022-vault-integration/spec.md) | N/A | Helm charts + Jobs |
| 023 | [Keycloak SSO](./023-keycloak-sso/spec.md) | N/A | RHBK Helm + Jobs |
| 024 | [RHACM GitOps](./024-rhacm-gitops/spec.md) | GitOpsCluster | RHACM |
| 025 | [ACS Security](./025-acs-security/spec.md) | N/A | ACS Helm + Job |
| 026 | [AAP Config as Code](./026-aap-config-as-code/spec.md) | N/A | Ansible playbook |
| 027 | [Quay Registry](./027-quay-registry/spec.md) | N/A | Quay Helm + Jobs |
| 028 | [Crunchy Postgres](./028-crunchy-postgres/spec.md) | PostgresCluster | PGO |
| 029 | [Gitea Git Server](./029-gitea-git-server/spec.md) | N/A | Gitea Helm + Jobs |
| 030 | [ODF Storage](./030-odf-storage/spec.md) | StorageCluster | ODF |
| 031 | [CNV Virtualization](./031-cnv-virtualization/spec.md) | HyperConverged | CNV |
| 032 | [MTV Migration Toolkit](./032-mtv-migration-toolkit/spec.md) | Provider | MTV |
| 033 | [Unified Operator](./033-unified-operator/spec.md) | All hybridsovereign CRDs | primary + namespace |
| 034 | [Bootstrap Deployment](./034-bootstrap-deployment/spec.md) | N/A | Helm init chart |

## Mega-Phase Mapping

| Mega-Phase | Specs |
|------------|-------|
| A: Foundation | 022, 023, 028, 030, 031, 024 |
| B: Platform Services | 025, 026, 027, 029, 016, 032 |
| C: Operator + IAAC | 001-014, 033 |
| D: Event System | 015, 016 |
| E: UI | 018-021 |
| F: ACM GitOps | 024 |
| G: VM Migration | 009, 017, 032 |
| H: AAP Config | 026, 010 |
| I: Specs + Samples | (this directory) |
| J: Security + Tests | All specs § Security |

## Conventions

- API group for tenancy CRs: `hybridsovereign.redhat/v1alpha1`
- Primary operator namespace: `sovereign-cloud`
- Plugin config namespace: `sovereign-cloud-plugins`
- Entity namespaces: `entity-<name>`
- All deployments via ArgoCD after `make init-central-argo`

