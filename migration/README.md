# VMware → CloudOSO Migration (MEGA-PHASE G)

Ansible playbooks and roles for `OpenStackMigration` CR-driven VM migration using
[os-migrate/vmware-migration-kit](https://github.com/os-migrate/vmware-migration-kit).

## Layout

| Path | Purpose |
|------|---------|
| `requirements.yml` | Galaxy collections: `os_migrate.vmware_migration_kit`, `vmware.vmware`, `vmware.vmware_rest`, `os_migrate.os_migrate` |
| `playbooks/vmware-to-cloudoso.yml` | Wraps `os_migrate.vmware_migration_kit.migration` |
| `playbooks/conversion-host-deploy.yml` | Deploys dst conversion host with network checks only |
| `roles/migration_cr_handler/` | Reads CR, resolves Vault creds, drives playbooks |
| `inventory/localhost.yml` | Local migrator inventory for AAP/EDA jobs |

## Credential flow

- **VMware**: Vault KV at `plan.source.credentialsSecret` (default `vmware-credentials`) — seeded by `vmwareInit` bootstrap job; never stored in Git.
- **OpenStack**: Vault KV via target `CloudOSO.spec.vaultPath` → temporary `ExternalSecret` → `clouds.yaml` on the job pod.

## VDDK testing — deferred

Full VDDK library install and nbdkit/VDDK data-transfer validation against live ESXi is **not** exercised in this phase:

- `conversion-host-deploy.yml` sets `os_migrate_conversion_host_content_install: false` (no VDDK payload on conversion host).
- `vmware-to-cloudoso.yml` sets `skip_vddk_validation: true` and `run_full_migration: false` by default.
- `migration_cr_handler` sets `migration_skip_vddk: true` and `migration_run_full_workload_import: false`.

### Manual VDDK validation (future phase)

1. Build EE with VDDK libs per [vmware-migration-kit docs](https://github.com/os-migrate/vmware-migration-kit).
2. Set `migration_skip_vddk: false` and `migration_run_full_workload_import: true` on the job template.
3. Run against a lab VM with CBT disabled first, then enable `plan.cbt: true` for warm migration.

## EDA integration

`eda/openstack-migration` includes `openstack_migration_provision`, which delegates to `migration_cr_handler`.
Rulebook `openstack-migration-create.yml` launches job template `openstack-migration-provision`.

## Operator integration

`operator/namespace/roles/openstack_migration_provision` includes the same handler for sovereign-cloud Jobs.

## Collections install

```bash
cd hybridcloud/migration
ansible-galaxy collection install -r requirements.yml -p ~/.ansible/collections
```

Collections `os_migrate.vmware_migration_kit` and `os_migrate.os_migrate` install from Git tags `>=2.2.0` and `>=1.0.5`.
