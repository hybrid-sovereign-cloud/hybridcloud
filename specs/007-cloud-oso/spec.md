# Spec 007: CloudOSO (OpenStack)

**Spec ID**: `007-cloud-oso`
**API Group**: `hybridsovereign.redhat/v1alpha1`
**Kind**: CloudOSO
**Operator**: namespace
**Namespace**: `entity-<name>`

## Description

CloudOSO provisions an OpenStack project/environment for the entity. Creates OSOHelper type:environmentprep Job on central cluster.

## CRD Schema Summary

`spec.vaultPath`, `spec.baseDomain`, `spec.projectDomain`, `spec.externalNetwork`, `spec.route53VaultPath`.

## API Reference

| Field | Type | Description |
|-------|------|-------------|
| `spec.vaultPath` | string | Vault path for OpenStack credentials |
| `spec.baseDomain` | string | DNS base domain for cluster routes |
| `spec.externalNetwork` | string | OpenStack external network name |

## Deployment Steps

1. Apply CloudOSO CR; wait for environmentprep Job completion

## Testing Guide

- Apply `samples/cloudoso/ses12-env.yaml`

## Security Considerations

- OpenStack credentials in Vault; DNS creds via route53VaultPath

## Related Samples

See [`samples/`](../samples/) for sanitized CR examples.
See [`tests/`](../tests/) for holistic test specs.
