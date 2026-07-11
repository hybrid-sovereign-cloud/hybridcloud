# Pod Restart Resilience Tests

**Scope**: Verify platform components recover gracefully after pod deletion or node disruption  
**Method**: Controlled pod deletion (not node drain) — run during maintenance window  
**Prerequisites**: All ArgoCD Applications Synced/Healthy baseline

---

## General Procedure

For each test:

1. Record baseline: `oc get pods -n <ns> -o wide`
2. Delete target pod: `oc delete pod <name> -n <ns> --grace-period=30`
3. Wait for replacement: `oc wait --for=condition=Ready pod -l <selector> -n <ns> --timeout=300s`
4. Verify workload function (see per-test checks)
5. Confirm ArgoCD remains Synced (no manual intervention)

---

## Test Cases

### TC-RS-001: Primary Operator Restart

| Field | Value |
|-------|-------|
| **Namespace** | `sovereign-cloud` |
| **Selector** | `app.kubernetes.io/name=hybridsovereign-primary-operator` |
| **Verify** | Entity CR `status.ready` unchanged; new pod Ready <120s |
| **Expected** | Leader election resumes; no duplicate reconciles |

### TC-RS-002: Namespace Operator Restart

| Field | Value |
|-------|-------|
| **Namespace** | `entity-acme-corp` |
| **Selector** | `app.kubernetes.io/name=hybridsovereign-namespace-operator` |
| **Verify** | Team CR still `ready=True`; logs show clean startup |
| **Expected** | Single replica recovers; watches re-established |

### TC-RS-003: Event Forwarder Restart

| Field | Value |
|-------|-------|
| **Namespace** | `sovereign-cloud-jobs` |
| **Workload** | event-forwarder Deployment |
| **Verify** | Create test ConfigMap; event appears on Kafka within 90s |
| **Expected** | No event loss for in-flight K8s events (best-effort) |

### TC-RS-004: Vault Pod Restart

| Field | Value |
|-------|-------|
| **Namespace** | `sovereign-cloud` (central) |
| **Verify** | `vault status` unsealed; ExternalSecrets remain Synced |
| **Expected** | Raft quorum maintained (HA); brief API unavailability acceptable |

### TC-RS-005: RHBK Keycloak Restart

| Field | Value |
|-------|-------|
| **Namespace** | `rhbk` or chart-defined |
| **Verify** | OIDC discovery endpoint returns 200; dashboard login works |
| **Expected** | Recovery <180s; sessions may require re-login |

### TC-RS-006: ArgoCD Application Controller

| Field | Value |
|-------|-------|
| **Namespace** | `openshift-gitops` |
| **Verify** | All Applications remain Synced after controller pod recycle |
| **Expected** | Self-heal restores any drift |

### TC-RS-007: AMQ Streams Broker Rolling

| Field | Value |
|-------|-------|
| **Namespace** | `amq-streams` |
| **Method** | Delete one `hybridsovereign-kafka-kafka-0` pod |
| **Verify** | Kafka cluster Ready; topic ISR intact |
| **Expected** | Strimzi replaces pod; no under-replicated partitions >5 min |

### TC-RS-008: EDA Activation Pod

| Field | Value |
|-------|-------|
| **Namespace** | `aap-eda` |
| **Verify** | Activation returns Running; test CR triggers rulebook |
| **Expected** | Rulebook reconnects to Kafka |

### TC-RS-009: Admin Dashboard Restart

| Field | Value |
|-------|-------|
| **Namespace** | `sovereign-cloud` |
| **Verify** | UI loads; entity list API returns 200 |
| **Expected** | Zero-downtime if replicas ≥2 |

### TC-RS-010: Tenant Dashboard Restart

| Field | Value |
|-------|-------|
| **Namespace** | `sovereign-cloud` (services) |
| **Verify** | Tenant login; scoped entity view |
| **Expected** | Same as TC-RS-009 |

### TC-RS-011: Ansible Job Pod (Ephemeral)

| Field | Value |
|-------|-------|
| **Method** | Trigger Job via CR; kill pod mid-run |
| **Verify** | Job retries or fails cleanly; CR status reflects error |
| **Expected** | No partial cluster mutations without status update |

### TC-RS-012: PDB Compliance Under Disruption

| Field | Value |
|-------|-------|
| **Verify** | `oc get pdb -A` shows ALLOWED DISRUPTIONS ≥1 for HA workloads |
| **Method** | Evict one pod; second replica serves traffic |
| **Expected** | PDB prevents full outage |

---

## HA Inventory (Expected ≥2 Replicas)

| Component | Namespace | Min Replicas | PDB |
|-----------|-----------|--------------|-----|
| CNV virt-api | openshift-cnv | 2 | virt-api-pdb |
| MTV forklift-controller | openshift-mtv | 2 | mtv-controller-pdb |
| Vault | sovereign-cloud | 3 (HA) | N/A |
| Kafka brokers | amq-streams | 3 | Strimzi-managed |
| Admin dashboard | sovereign-cloud | 2 | chart PDB |

---

## Pass Criteria

- TC-RS-001 through TC-RS-012 PASS
- No ArgoCD Application enters `Degraded` state lasting >10 min after pod restart
- No manual `oc apply` required for recovery
- All recovered pods pass security context checks (`runAsNonRoot: true`)

## Rollback

If restart test causes persistent degradation:

```bash
oc annotate application <app-name> -n openshift-gitops argocd.argoproj.io/refresh=hard --overwrite
```

Do **not** delete `sovereign-*` namespaces.
