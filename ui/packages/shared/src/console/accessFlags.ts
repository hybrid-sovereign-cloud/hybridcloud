import { useEffect } from 'react';
import { API_GROUP, KIND_PLURALS, HybridSovereignKind } from '../types';

export type SetFeatureFlag = (flag: string, enabled: boolean) => void;

export type AccessCheck = {
  flag: string;
  kind: HybridSovereignKind;
  /** When set, SAR is namespaced; omit for cluster-wide list permission */
  namespace?: string;
};

export type PostSelfSubjectAccessReview = (
  body: Record<string, unknown>,
) => Promise<{ status?: { allowed?: boolean } }>;

async function canList(
  postSar: PostSelfSubjectAccessReview,
  kind: HybridSovereignKind,
  namespace?: string,
): Promise<boolean> {
  const resource = KIND_PLURALS[kind];
  const body: Record<string, unknown> = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    spec: {
      resourceAttributes: {
        group: API_GROUP,
        resource,
        verb: 'list',
        ...(namespace ? { namespace } : {}),
      },
    },
  };
  try {
    const result = await postSar(body);
    return !!result?.status?.allowed;
  } catch {
    return false;
  }
}

/**
 * Returns a console.flag/hookProvider handler that sets SOVEREIGN_CAN_LIST_* flags
 * from SelfSubjectAccessReview for the logged-in user.
 */
export function createAccessFlagHook(
  checks: AccessCheck[],
  postSar: PostSelfSubjectAccessReview,
): (setFlag: SetFeatureFlag) => void {
  return (setFlag: SetFeatureFlag): void => {
    // OpenShift invokes hookProvider handlers as React hooks.
    useEffect(() => {
      checks.forEach(({ flag, kind, namespace }) => {
        setFlag(flag, false);
        void canList(postSar, kind, namespace).then((allowed) => setFlag(flag, allowed));
      });
    }, [setFlag]);
  };
}
