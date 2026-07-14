export {
  configureK8sClient,
  useCanI,
  useK8sResource,
  useK8sResourceList,
} from './k8s';
export type {
  K8sClientConfig,
  UseK8sResourceListOptions,
  UseK8sResourceListResult,
  UseK8sResourceOptions,
  UseK8sResourceResult,
} from './k8s';
export { usePermissions, useCanListKind, configurePermissionsClient } from './permissions';
export type { K8sVerb, PermissionCheck, UsePermissionsResult } from './permissions';
export { useEntityNamespace } from './entityNamespace';
export type { UseEntityNamespaceOptions, UseEntityNamespaceResult } from './entityNamespace';
