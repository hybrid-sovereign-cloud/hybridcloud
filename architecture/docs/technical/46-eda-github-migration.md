# EDA GitHub Migration

## Overview

EDA rulebooks and roles migrated from Gitea (`eda-rulebooks` repo) to GitHub at `git@github.com:hybrid-sovereign-cloud/eda.git`.

## Repository Structure

```
eda/
├── assignment/          # Assignment CR automation
├── cloudaws/            # CloudAWS CR automation (includes environmentprep)
├── cloudoso/            # CloudOSO CR automation (includes environmentprep)
├── common/              # Shared tasks (patch_cr_status.yml)
├── entity/              # Entity CR automation
├── event-forwarder/     # K8s event -> EDA event stream bridge
├── persona/             # Persona CR automation
├── platformopenshift/   # PlatformOpenshift CR automation (includes clusterbuild)
├── plugin-aap/          # AAPConfig and AAPOrg automation
├── plugin-iaac/         # Iaac CR automation
├── plugin-quay/         # QuayConfig and QuayOrg automation
├── plugin-rbac/         # Rbac and RbacConfig automation
├── plugin-vault/        # Vault and VaultKV automation
├── project/             # Project CR automation
└── team/                # Team CR automation
```

## Rulebook Activation Pattern

Each CR type has separate rulebooks for create and delete operations:

```
<cr-type>/rulebooks/
├── <cr>-create.yml              # Handles Create and Reconcile events
├── <cr>-delete.yml              # Handles Delete events
├── <cr>-provision-playbook.yml  # Playbook for create
└── <cr>-teardown-playbook.yml   # Playbook for delete
```

## Helper Merge

AWSHelper and OSOHelper functionality was merged into EDA roles:

| Helper | Type | New Location |
|--------|------|-------------|
| AWSHelper | environmentprep | `eda/cloudaws/` provision role |
| AWSHelper | clusterbuild | `eda/platformopenshift/` aws_clusterbuild tasks |
| OSOHelper | environmentprep | `eda/cloudoso/` provision role (environmentprep.yml) |
| OSOHelper | clusterbuild | `eda/platformopenshift/` openstack_clusterbuild tasks |
