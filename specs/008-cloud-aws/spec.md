# Spec 008: CloudAWS

**Spec ID**: `008-cloud-aws`
**API Group**: `hybridsovereign.redhat/v1alpha1`
**Kind**: CloudAWS
**Operator**: namespace
**Namespace**: `entity-<name>`

## Description

CloudAWS provisions an AWS account environment for the entity. Creates AWSHelper type:environmentprep Job on central cluster.

## CRD Schema Summary

`spec.account`, `spec.vaultPath`, `spec.baseDomain`, `spec.toolRbac` for IAM role mappings.

## API Reference

| Field | Type | Description |
|-------|------|-------------|
| `spec.account` | string | 12-digit AWS account ID |
| `spec.vaultPath` | string | Vault path for AWS credentials |
| `spec.toolRbac.accountAdminRbac` | []string | AdministratorAccess Rbac refs |

## Deployment Steps

1. Apply CloudAWS CR; verify AWSHelper Job on central

## Testing Guide

- Apply `samples/cloudaws/cloudaws-dev.yaml` with sanitized account ID

## Security Considerations

- Never commit AWS account IDs or credentials; use Vault + ExternalSecret

## Related Samples

See [`samples/`](../samples/) for sanitized CR examples.
See [`tests/`](../tests/) for holistic test specs.
