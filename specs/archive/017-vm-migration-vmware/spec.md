# Spec 017: VM Migration (VMware)

**Spec ID**: `017-vm-migration-vmware`
**API Group**: `hybridsovereign.redhat/v1alpha1`
**Kind**: OpenStackMigration
**Operator**: namespace + EDA
**Namespace**: `entity-<name>`

## Description

VMware-to-CloudOSO migration using os_migrate.vmware_migration_kit with conversion host on target OpenStack project and nbdkit/VDDK data transfer.

## CRD Schema Summary

See 009-openstack-migration; adds conversion host deployment and warm/cold migration modes.

## Deployment Steps

1. Deploy conversion host via deploy_conversion_host.yml playbook
2. Configure MTV provider with VMware inventory
3. Apply OpenStackMigration CR to trigger EDA rulebook

## Testing Guide

- Run discovery.yml; migrate test VM; verify Nova instance on CloudOSO

## Security Considerations

- VMware creds seeded via vmwareInit Job to Vault; VDDK libs on conversion host

## Related Samples

See [`samples/`](../samples/) for sanitized CR examples.
See [`tests/`](../tests/) for holistic test specs.
