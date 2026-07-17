import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { createAccessFlagHook } from '@hybridsovereign/shared';

const postSar = (body: Record<string, unknown>) =>
  consoleFetchJSON.post(
    '/api/kubernetes/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
    body,
  ) as Promise<{ status?: { allowed?: boolean } }>;

/** Admin perspective — gate nav on list access for platform CRs */
export const useSovereignAccessFlags = createAccessFlagHook(
  [
    { flag: 'SOVEREIGN_CAN_LIST_ENTITIES', kind: 'Entity', namespace: 'sovereign-cloud' },
    { flag: 'SOVEREIGN_CAN_LIST_PERSONAS', kind: 'Persona' },
    { flag: 'SOVEREIGN_CAN_LIST_AAPCONFIGS', kind: 'AAPConfig' },
    { flag: 'SOVEREIGN_CAN_LIST_RBACCONFIGS', kind: 'RbacConfig' },
  ],
  postSar,
);
