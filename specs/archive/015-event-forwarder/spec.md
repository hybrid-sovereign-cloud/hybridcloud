# Spec 015: Event Forwarder

**Spec ID**: `015-event-forwarder`
**API Group**: `N/A`
**Kind**: N/A (DaemonSet)
**Operator**: Helm chart
**Namespace**: `sovereign-cloud-jobs`

> **Status (2026-07-15): RETIRED / DISABLED**
>
> `eventForwarder.enabled: false` in `bootstrap/helm/central/values.yaml`.
> Operators publish directly to AMQ Streams (`operator/roles/_common/tasks/amq_publish.yml`).
> Prefer specs **016** (AMQ Streams) and **033** (unified operator) for the live event path.

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
