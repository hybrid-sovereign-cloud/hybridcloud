# Hybridsovereign CR Samples — Testing Status

## Overview

This document tracks the current test-environment status of all `hybridsovereign.redhat/v1alpha1`
custom resource types, the EDA job log storage architecture, and known blockers.

## Cloud Cluster Topology (Reduced)

Deployment is intentionally scoped to **1 AWS + 1 OpenStack** cluster for testing:

| Resource | Cloud | Environment | Status |
|---|---|---|---|
| `CloudAWS/ses10-env` | AWS | ses10 | **ready** ✅ (AAP job 247) |
| `PlatformOpenshift/ocp-ses10` | AWS | ses10-env | pending (CloudAWS ready, cluster install pending) |
| `CloudOSO/ses4-env` | OpenStack | ses4 | **failed** — Route53 zone `lab.example.com` not in configured AWS account |
| `PlatformOpenshift/ocp-ses4` | OpenStack | ses4-env | failed (pending CloudOSO) |

## Status Summary (post EDA→AAP migration)

| CR Kind | Count | Ready | AAP Job URL | Notes |
|---|---|---|---|---|
| `Entity` | 3 | 3/3 ✅ | ✅ all show AAP job ID | All ready |
| `Persona` | 6 | 6/6 ✅ | ✅ all show AAP job ID | All ready |
| `Team` | 4 | 4/4 ✅ | ✅ all show AAP job ID | All ready |
| `Project` | 4 | 4/4 ✅ | ✅ all show AAP job ID | All ready |
| `AAPOrg` | 7 | 7/7 ✅ | ✅ all show AAP job ID | All ready |
| `QuayOrg` | 7 | 7/7 ✅ | ✅ all show AAP job ID | All ready |
| `Rbac` | 30 | 30/30 ✅ | ✅ all show AAP job ID | All ready |
| `CloudAWS` | 1 | 1/1 ✅ | ✅ AAP job 247 | Route53 zone, AWS creds verified |
| `CloudOSO` | 1 | 0/1 ❌ | ✅ AAP job URL recorded | Blocked on Route53 zone |
| `PlatformOpenshift` | 2 | 0/2 ❌ | — | Blocked on CloudAWS/CloudOSO |
| `Assignment` | 6 | 0/6 ❌ | — | Blocked on PlatformOpenshift |

## EDA Job Log Storage

EDA job logs are stored in **NooBaa S3** on the services cluster for direct browser access
from the dashboards. AAP job output is also accessible via the clickable AAP job URL.

### URL Priority Order

1. **AAP job URL** — `https://<aap-controller>/execution/jobs/playbook/<id>/output` (primary)
2. **S3 log URL** — `https://s3-openshift-storage.apps.services.lab.example.com/eda-job-logs/{kind}/{ns}/{cr}/{ts}.json` (fallback)
3. **EDA activation URL** — `https://<eda>/#/rulebook-activations/<id>` (legacy fallback)

### S3 Architecture

```
AAP Role (central)
    ↓ writes structured log JSON
upload_log_to_s3.yml
    ↓ boto3 PUT to NooBaa S3
eda-job-logs bucket (openshift-storage, services)
    ↓ public URL stored in CR status edaJobs[0].url
Dashboard EdaJobsChips → clickable chip → browser downloads log
```

### Components

| Component | Namespace | Cluster |
|---|---|---|
| `ObjectBucketClaim/eda-job-logs` | `openshift-storage` | services |
| `PushSecret/push-eda-s3-logs-creds` | `openshift-storage` | services |
| Vault path `central/eda-s3-logs` | HashiCorp Vault | central |
| `ExternalSecret/eda-s3-creds` | `openshift-gitops` | central |
| `Secret/eda-s3-creds` | `openshift-gitops` | central |

### EE Image Versions (post AAP migration)

| EE / DE Image | Tag | Notes |
|---|---|---|
| `de-entity` | 0.1.6 | patch_cr_status START callback added |
| `de-persona` | 0.1.2 | patch_cr_status START callback added |
| `de-assignment` | 0.1.4 | patch_cr_status START callback added |
| `de-cloudaws` | 0.1.4 | `amazon.aws` snake_case attrs, services creds |
| `de-cloudoso` | 0.1.5 | `amazon.aws` collection added, build patches |
| `de-platformopenshift` | 0.1.4 | patch_cr_status START callback added |

## Known Blockers

### CloudOSO Route53 Zone

- **Issue**: `ses4-env` uses `baseDomain: lab.example.com` but the configured Route53 AWS account (`390403869973`) only manages `sandbox5530.opentlc.com`.
- **Workaround needed**: Provide AWS credentials for an account that manages `lab.example.com`, or update the `ses4-env` CR's `baseDomain` to a zone in the configured account.
- **OpenStack provisioning works**: Project creation, role assignment, and floating IP allocation all succeed. Only Route53 delegation fails.
- **Route53 Vault path**: `central/data/oso/accounts/route53-openstack` must contain `access-key` and `secret-access-key` properties for an account managing the CR's `baseDomain` zone.

### Infrastructure-Dependent (expected in test env)

- **PlatformOpenshift**: Depends on CloudAWS/CloudOSO being ready
- **Assignment**: Depends on PlatformOpenshift being ready

## EDA → AAP Migration (June 2026)

All EDA rulebooks have been migrated from `run_playbook` to `run_job_template`. Key changes:

1. **Rulebooks** — `run_job_template` with `organization: sovereign` and template name matching operator
2. **CR status** — `edaJobs` now contains exactly **1 entry** with `jobId` (AAP numeric ID) and `url` (AAP job output URL)
3. **START callback** — Each provision role patches CR status to `{status: reconciling}` with AAP job ID immediately on launch
4. **Dashboard** — `EdaJobsChips` shows last job only as clickable AAP job ID link

## Dashboard Chip URL Logic

```javascript
// EdaJobsChips.jsx (post migration)
const displayJobs = Array.isArray(jobs) && jobs.length > 0 ? [jobs[jobs.length - 1]] : [];
const hasValidUrl = job.url && job.url.startsWith("http");
// AAP URLs: https://sovereign-aap-controller-aap.apps.../  #/jobs/playbook/247/output
// S3 URLs: https://s3-openshift-storage.apps.services.../eda-job-logs/...
```
