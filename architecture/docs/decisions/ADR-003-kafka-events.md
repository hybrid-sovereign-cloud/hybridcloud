# ADR-003: Kafka Event Bus via AMQ Streams

**Status**: Accepted  
**Date**: 2026-07-11  
**Deciders**: Platform architecture team

---

## Context

The legacy event pipeline routed operator Kubernetes Events exclusively through the AAP EDA Event Stream HTTP endpoint on the central cluster:

```
Operator → K8s Event → Event Forwarder → HTTPS POST → EDA Event Stream → Rulebook
```

This design had limitations:

- **No durable buffer** — event stream downtime caused lost events
- **No replay** — debugging required reproducing CR changes
- **No audit trail** — events were ephemeral after EDA consumption
- **Single consumer** — only EDA could act on operator events
- **Tight coupling** — forwarder hardcoded to one central URL

---

## Decision

Introduce AMQ Streams (Strimzi Kafka) on the central cluster as the primary durable event bus, while retaining the EDA Event Stream as the current rulebook trigger during migration.

### Components

| Component | Cluster | Path |
|-----------|---------|------|
| AMQ Streams operator | Central | `bootstrap/helm/central/templates/centralCluster/amq-streams-application.yaml` |
| Kafka cluster | Central (`amq-streams`) | `hybridsovereign-kafka`, 3 brokers |
| Topic `hybridsovereign-events` | Central | Operator and platform events |
| Topic `hybridsovereign-audit` | Central | Reserved for audit consumers |
| Event Forwarder (updated) | Services | `hybridcloud/eda/event-forwarder/src/forwarder.py` |

### Dual-publish strategy

The event forwarder publishes to both destinations:

1. **Kafka** (`KAFKA_ENABLED=true`) — durable, replayable, auditable
2. **EDA Event Stream** (legacy `EVENT_STREAM_URL`) — immediate rulebook activation

Operators may also publish directly via `hybridcloud/operator/roles/_common/tasks/amq_publish.yml`.

### Sync-wave ordering

- Wave 13: AMQ Streams Kafka cluster (central)
- Wave 32: Event Forwarder (services, after Kafka is Ready)

### Security

- TLS encryption on broker connections
- SASL credentials via ExternalSecret from Vault (`central/event-forwarder`)
- No tokens or passwords in Git or Helm values

---

## Consequences

### Positive

- Events survive EDA downtime; consumers can catch up
- Future consumers (metrics, SIEM, audit dashboard) can subscribe without modifying forwarder
- Replay enables integration testing without CR mutation
- Decouples event production from EDA availability

### Negative

- Additional infrastructure: 3 Kafka brokers + ZooKeeper on central cluster
- Dual-publish adds latency and operational complexity during migration
- Kafka credential rotation requires forwarder pod restart

### Migration path

1. **Phase 1** (current): Dual-publish to Kafka + EDA Event Stream
2. **Phase 2**: EDA rulebooks consume from Kafka source instead of HTTP event stream
3. **Phase 3**: Retire EDA Event Stream HTTP endpoint

---

## References

- [c4/components/event-system.md](../c4/components/event-system.md)
- Spec 016: AMQ Streams (`hybridcloud/specs/016-amq-streams/spec.md`)
- Spec 015: Event Forwarder (`hybridcloud/specs/015-event-forwarder/spec.md`)
