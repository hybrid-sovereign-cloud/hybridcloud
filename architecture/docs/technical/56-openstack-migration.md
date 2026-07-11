# OpenStack Migration UI and Operator

## Overview

The `OpenStackMigration` CR (`hybridsovereign.redhat/v1alpha1`) requests migration of a VM from an MTV `Provider` to a target `CloudOSO` environment. The operator emits `OpenStackMigrationRequested` events; EDA launches the central AAP job template `openstack-migration-dummy` with extra vars derived from the CR spec.

## MTV catalog ConfigMap

| Field | Location |
|-------|----------|
| ConfigMap | `sovereign-cloud/mtv-migration-catalog` |
| Key | `catalog.json` |
| Populated by | `job-mtv-catalog-sync` sovereign Job on central |

Schema (populated from central `forklift-inventory` REST API per MTV `Provider` CR):

```json
{
  "providers": [
    {
      "name": "vmware-vcenter",
      "namespace": "openshift-mtv",
      "type": "vsphere",
      "inventoryId": "6d2b9198-45f3-4636-91dd-543a7e9e7d64"
    }
  ],
  "vms": {"vmware-vcenter": ["vm-a", "vm-b"]},
  "vmDetails": {
    "vmware-vcenter": [
      {"name": "vm-a", "id": "vm-1", "powerState": "poweredOn"}
    ]
  },
  "syncedAt": "2026-06-25T00:00:00Z"
}
```

## UI

- Console plugin: **Sovereign Cloud → Migrate to OpenStack**
- Submit creates **one CR per selected VM**; each triggers a separate dummy AAP job
- List page shows `status.edaJobs` with links to AAP job output

## CloudOSO VRF fields (Phase 1)

| Spec field | Type | Ansible fact |
|------------|------|--------------|
| `enableVRF` | boolean | `ep_enable_vrf` |
| `vrfId` | string | `ep_vrf_id` |

Passed through in `environmentprep.yml`; no OpenStack mutation until a future phase.
