# Spec 015: Event Forwarder

**Spec ID**: `015-event-forwarder`
**API Group**: `N/A`
**Kind**: N/A (DaemonSet)
**Operator**: Helm chart
**Namespace**: `sovereign-cloud-jobs`

## Description

Event forwarder watches Kubernetes events and audit logs, forwarding them to AMQ Streams Kafka topics for EDA rulebook consumption.

## CRD Schema Summary

Helm values: Kafka bootstrap servers, topic names, filter rules.

## Deployment Steps

1. Deploy event-forwarder chart after AMQ Streams (sync-wave 13+)

## Testing Guide

- Create CR; verify event appears on hybridsovereign-events topic

## Security Considerations

- Kafka TLS; SASL credentials via ExternalSecret

## Related Samples

See [`samples/`](../samples/) for sanitized CR examples.
See [`tests/`](../tests/) for holistic test specs.
