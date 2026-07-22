# UIHealthChecker — On-demand URL probes

**Last updated**: 2026-07-22  
**API**: `uihealthcheckers.hybridsovereign.redhat/v1alpha1`  
**UI**: Admin dashboard → Hybrid VPC → UI Health (`/networking/uihealth`)

## Purpose

`UIHealthChecker` is a **URL registry** for platform service health checks. It does **not** drive infrastructure reconcile or EDA provision/teardown.

Once the CR exists with `spec.url`, the admin dashboard can probe that URL from the **dashboard pod** (cluster egress). Results are live-only in the UI session — they are not written back as operator status phases like `reconciling`.

## Lifecycle

| Step | Behavior |
|------|----------|
| Create CR | Operator marks `status.ready=true` / `status.status=ready` immediately (`Registered`). No Kafka/EDA job. |
| Refresh / Run checks | Admin dashboard `POST /api/uihealth/probe` with each CR’s `spec.url`. |
| Delete CR | Operator sets `deletionComplete` and removes the finalizer. No infra teardown. |

There is **no** `AwaitingEDA` / `reconciling` loop for this kind.

## Spec fields

| Field | Description |
|-------|-------------|
| `url` | Absolute HTTP(S) URL probed from the admin dashboard pod |
| `displayName` | Optional friendly name in the table |
| `group` | Logical group (`central`, `services`, `quay`, …) |
| `expectedStatus` | Default `200` |
| `timeoutSeconds` | Default `10` |

## UI columns

Name · Group · URL · **Live** (probe result). The old Status/reconcile badge is not shown — registration is implied by the CR row.

## Samples

`hybridcloud/samples/hybridvpc/uihealthcheckers.yaml` seeds Vault, RHBK, AAP, Gitea, and Quay targets in `sovereign-cloud`.

## Related

- [C4 UI packages](../c4/components/ui.md)
- [Hybrid VPC design](../../mocks/DESIGN_UI.md) § UI Health
- Admin probe route: `ui/packages/admin-dashboard/server/index.js` (`/api/uihealth/probe`)
