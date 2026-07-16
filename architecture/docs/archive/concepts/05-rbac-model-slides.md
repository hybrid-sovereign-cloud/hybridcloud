# Sovereign Cloud RBAC — Business Overview

*Presentation deck — 6 slides*

---

## Slide 1 — The Challenge

**Managing access at scale is hard**

- 40+ customer tenants, each with their own team
- Each team needs different levels of access to different cloud resources
- Manual permission management → errors, security gaps, compliance risk
- Changes must be auditable and reversible

---

## Slide 2 — Our Solution: Named RBAC Roles

**14 purpose-built roles, automatically enforced**

| Role Family | Example Roles |
|---|---|
| Platform control | Entity Admin, Auditor |
| Cloud resources | CloudOSO Admin/Viewer, CloudAWS Admin/Viewer |
| OpenShift clusters | PlatformOpenshift Admin/Viewer |
| Team & Project | Team Admin/Viewer, Project Admin/Viewer |
| Assignments & Identity | Assignment Admin, Identity Admin |

**How it works:** An operator creates and enforces these roles automatically
from a single YAML file. No manual Kubernetes or Keycloak configuration.

---

## Slide 3 — Security First

**Zero-trust by design**

- Every role grants the **minimum permissions required** — no wildcard access
- Credentials are **never stored in code** — all secrets live in HashiCorp Vault
- Full audit trail — every access change is recorded as a Kubernetes event
- **Automatic cleanup** — when a customer is removed, all their Keycloak groups
  and permissions are deleted automatically (finalizer pattern)

---

## Slide 4 — How a New Customer Gets Access

```
Day 1: Customer onboarding
  ├── Platform team creates Entity CR
  │   → Customer namespace provisioned automatically
  ├── Platform team creates Rbac CRs for each team group
  │   → Keycloak groups created automatically
  └── Platform team updates Entity namespaceRbac
      → 14 K8s Roles and RoleBindings created automatically

Day 2: Customer starts working
  ├── Customer teams log in via Keycloak SSO
  ├── Their Keycloak group membership → Kubernetes RBAC
  └── They can only see and modify what their role allows
```

**Total manual steps: 0** — everything flows from the YAML files.

---

## Slide 5 — Scale and Reliability

**Built for production**

| Metric | Capability |
|---|---|
| Tenants supported | 40+ simultaneously |
| RBAC groups per tenant | 10,000+ |
| Role resolution time | Parallel (all lookups simultaneous) |
| Operator availability | Active/standby (leader election) |
| Secret rotation | Automatic via External Secrets |

**No single point of failure** — the operator can be restarted at any time;
it will re-reconcile and restore the correct state automatically.

---

## Slide 6 — What Changes? (refactorrbac)

**Before → After**

| Area | Before | After |
|---|---|---|
| Role model | Generic creators/viewers | 14 named business roles |
| Secret handling | Stored in Kubernetes | Stored in Vault, delivered via ExternalSecret |
| Dashboard | Shows old role names | Shows 14 named roles with scope badges |
| Cleanup | Manual group cleanup | Automatic — finalizer removes everything |
| Audit logs | Credential values visible | `no_log: true` — credentials never logged |

**Result:** Cleaner security posture, clearer permissions model, zero manual cleanup.
