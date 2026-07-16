# Hardening Check — Operators & Kafka Events

**Retested**: 2026-07-15

| Check | Result | Notes |
|-------|--------|-------|
| Primary operator on services only | PASS | `sovereign-cloud` |
| Direct Kafka publish (no forwarder) | PASS | `amq_publish.yml`; forwarder disabled |
| Producer creds via ExternalSecret | PASS | Vault path `amq-producer` |
| Kafka cluster Ready | PASS | `hybridsovereign-kafka` Ready |
| IAAC git-sync (not Go plugin-iaac) | PASS | STS `iaac-git-sync`; `pluginIaac.enabled: false` |
| GitOps image pin | REVIEW | values `0.1.6` / chart `0.1.10`; live may lag until Argo sync |

## Gaps

| ID | Gap | Severity |
|----|-----|----------|
| EVT-001 | TLS `CERT_NONE` for Route hostname mismatch | MED (lab) |
| EVT-002 | Ensure all namespace operators use same producer path | REVIEW |
