# Platform Deviations & Remediation Tracker

This document records implementation deviations from platform best practices,
including WHY, WHERE, and the remediation / production target.

---

## DEV-001: PlatformOpenshift AWS Delete Flow Deferred

**Feature**: 002-manage-tenancy-crs  
**Phase**: Phase 8 (Delete Flow Validation)  
**Status**: Deferred

**Why**: The `ocp-sdx-aws1` AWS cluster (replacing deprecated `ocp-ses10`) and associated
`ses10-env` CloudAWS CR represent live sandbox infrastructure that requires careful
coordination to destroy. AWS resource cleanup (VPC, Route53, ELBs) via Hive involves a
longer teardown cycle and was intentionally excluded from the automated delete validation
run in Phase 8.

**Where**:
- `entity-acme-corp/ocp-sdx-aws1` (PlatformOpenshift, type: aws)
- `entity-acme-corp/ses10-env` (CloudAWS)

> **Note**: `ocp-ses8`–`ocp-ses12` (including `ocp-ses10`) are deprecated. Current
> PlatformOpenshift clusters: `ocp-sdx-oso1`, `ocp-sdx-oso2` (OpenStack via
> `acme-dev-openstack` CloudOSO), `ocp-sdx-aws1` (AWS via `ses10-env` CloudAWS).

**Finalizer implementation is complete**:
- `hybridsovereign.redhat/platformopenshift-cleanup` finalizer set on CR
- `platformopenshift_delete` role handles AWSHelper CR deletion on central cluster
- `hybridsovereign.redhat/cloudaws-cleanup` finalizer set on CR
- `cloudaws_delete` role handles cleanup

**Remediation / Production Target**:
1. In a maintenance window, delete `ocp-sdx-aws1` PlatformOpenshift CR and monitor
   until Hive ClusterDeployment shows `Deprovisioned` on central cluster.
2. Verify all AWS resources (VPC, subnets, Route53 records, IAM roles) are cleaned up
   via the AWS Console or `aws` CLI investigation.
3. Delete `ses10-env` CloudAWS CR after cluster is fully gone.
4. Close this deviation by updating status to "Validated" here.

---

## DEV-003: Assignment Delete — SA Token Expiry Gap

**Feature**: 003-fix-ocp-cloudrbac-cleanup-ocp  
**Phase**: Phase 5 US3  
**Status**: Known, production hardening required

**Why**: The `assignment_delete` finalizer role reads the `osohelper-creator-sa` or
`awshelper-creator-sa` secret token from the services cluster to authenticate to the
central cluster. If the token is rotated, expired, or deleted between Assignment creation
and deletion, the `assert` step in the delete role fails and the finalizer is never cleared.

**Where**:
- `Assignment/operator/roles/assignment_delete/tasks/main.yml` (lines: `assert` task)
- `sovereign-cloud/osohelper-creator-sa` (Secret)
- `sovereign-cloud/awshelper-creator-sa` (Secret)

**Remediation / Production Target**:
1. Add `ignore_errors: true` to the `assert` step with a clear failure message and
   manual cleanup instructions logged when token is unavailable.
2. Use `TokenRequest` API for short-lived projected tokens instead of long-lived SA secrets.
3. **Manual recovery** if finalizer is stuck:
   `oc patch assignment <name> -n <ns> --type json -p '[{"op":"remove","path":"/metadata/finalizers"}]'`
   then `oc delete osohelper <name> -n sovereign-cloud-helpers` on central cluster.

---

## DEV-002: Project Operator Delete Flow via Owner References (No Finalizer)

**Feature**: 002-manage-tenancy-crs  
**Phase**: Phase 3D / Phase 8

**Why**: The `Project` operator creates per-CR viewer `Role` and `RoleBinding` resources
within the same namespace as the Project CR. Kubernetes garbage collection via owner
references (automatically injected by the operator proxy) handles cleanup without needing
a dedicated finalizer role.

**Where**: `Projects/operator/roles/project/tasks/main.yml`

**Validation**: Tested — `test-delete-project` CR deletion confirmed both
`project-test-delete-project-viewer` Role and matching RoleBinding were removed within
30s via owner reference GC.

**Remediation / Production Target**:
If the Project operator begins managing cross-namespace resources in future phases
(e.g., assigning members to external systems), add a `project_delete` finalizer role
following the same pattern as the `Team` operator. Until then, owner reference GC
is sufficient and simpler.

---
