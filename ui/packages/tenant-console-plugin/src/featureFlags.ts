import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { createAccessFlagHook } from '@hybridsovereign/shared';

const postSar = (body: Record<string, unknown>) =>
  consoleFetchJSON.post(
    '/api/kubernetes/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
    body,
  ) as Promise<{ status?: { allowed?: boolean } }>;

/** Tenant perspective — gate nav on list access for tenancy CRs */
export const useSovereignAccessFlags = createAccessFlagHook(
  [
    { flag: 'SOVEREIGN_CAN_LIST_TEAMS', kind: 'Team' },
    { flag: 'SOVEREIGN_CAN_LIST_PROJECTS', kind: 'Project' },
    { flag: 'SOVEREIGN_CAN_LIST_PLATFORMS', kind: 'PlatformOpenshift' },
    { flag: 'SOVEREIGN_CAN_LIST_CLOUDOSOS', kind: 'CloudOSO' },
    { flag: 'SOVEREIGN_CAN_LIST_CLOUDAWS', kind: 'CloudAWS' },
    { flag: 'SOVEREIGN_CAN_LIST_MIGRATIONS', kind: 'OpenStackMigration' },
    { flag: 'SOVEREIGN_CAN_LIST_ASSIGNMENTS', kind: 'Assignment' },
    { flag: 'SOVEREIGN_CAN_LIST_PERSONAS', kind: 'Persona' },
    { flag: 'SOVEREIGN_CAN_LIST_RBACS', kind: 'Rbac' },
    { flag: 'SOVEREIGN_CAN_LIST_VAULTS', kind: 'Vault' },
    { flag: 'SOVEREIGN_CAN_LIST_VAULTKVS', kind: 'VaultKV' },
    { flag: 'SOVEREIGN_CAN_LIST_AAPORGS', kind: 'AAPOrg' },
    { flag: 'SOVEREIGN_CAN_LIST_QUAYORGS', kind: 'QuayOrg' },
  ],
  postSar,
);
