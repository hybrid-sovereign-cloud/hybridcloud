import { HybridSovereignKind } from '../types';

export type SpecFieldWidget =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'stringList'
  | 'cidrList'
  | 'select'
  | 'json';

export interface SpecFieldMeta {
  /** Dot path under spec, e.g. features.istio or backend.name */
  path: string;
  labelKey: string;
  widget: SpecFieldWidget;
  immutable?: boolean;
  options?: Array<{ value: string; labelKey: string }>;
  helpKey?: string;
}

export interface KindSpecMeta {
  fields: SpecFieldMeta[];
}

/** Editable / immutable field registry for tenancy + admin detail editors */
export const KIND_SPEC_META: Partial<Record<HybridSovereignKind, KindSpecMeta>> = {
  Team: {
    fields: [
      { path: 'features.istio', labelKey: 'fields.istio', widget: 'boolean' },
      { path: 'features.argo', labelKey: 'fields.argo', widget: 'boolean' },
    ],
  },
  Project: {
    fields: [{ path: 'description', labelKey: 'fields.description', widget: 'textarea' }],
  },
  Assignment: {
    fields: [
      { path: 'team', labelKey: 'fields.team', widget: 'text' },
      { path: 'projects', labelKey: 'fields.projects', widget: 'stringList' },
      { path: 'openshift', labelKey: 'fields.openshift', widget: 'text' },
      { path: 'aws', labelKey: 'fields.aws', widget: 'text' },
    ],
  },
  Persona: {
    fields: [
      { path: 'rbac', labelKey: 'fields.rbac', widget: 'text', immutable: true },
      { path: 'type', labelKey: 'fields.personaType', widget: 'text', immutable: true },
    ],
  },
  Rbac: {
    fields: [
      { path: 'config', labelKey: 'fields.rbacConfig', widget: 'text', immutable: true },
      { path: 'description', labelKey: 'fields.description', widget: 'textarea' },
    ],
  },
  CloudOSO: {
    fields: [
      { path: 'vaultPath', labelKey: 'fields.vaultPath', widget: 'text' },
      { path: 'baseDomain', labelKey: 'fields.baseDomain', widget: 'text' },
    ],
  },
  CloudAWS: {
    fields: [
      { path: 'account', labelKey: 'fields.account', widget: 'text' },
      { path: 'vaultPath', labelKey: 'fields.vaultPath', widget: 'text' },
      { path: 'baseDomain', labelKey: 'fields.baseDomain', widget: 'text' },
    ],
  },
  Vault: {
    fields: [
      { path: 'ha', labelKey: 'fields.ha', widget: 'boolean' },
      { path: 'rbacConfig', labelKey: 'fields.rbacConfig', widget: 'text', immutable: true },
    ],
  },
  VaultKV: {
    fields: [
      { path: 'vault', labelKey: 'fields.vault', widget: 'text', immutable: true },
      { path: 'vaultAdminRbac', labelKey: 'fields.vaultAdminRbac', widget: 'stringList' },
      { path: 'vaultReaderRbac', labelKey: 'fields.vaultReaderRbac', widget: 'stringList' },
    ],
  },
  AAPOrg: {
    fields: [
      { path: 'aapConfig', labelKey: 'fields.aapConfig', widget: 'text', immutable: true },
      { path: 'aapAdminRbac', labelKey: 'fields.aapAdminRbac', widget: 'stringList' },
      { path: 'aapJobExecutorRbac', labelKey: 'fields.aapJobExecutorRbac', widget: 'stringList' },
    ],
  },
  QuayOrg: {
    fields: [
      { path: 'quayConfig', labelKey: 'fields.quayConfig', widget: 'text', immutable: true },
      { path: 'quayAdminRbac', labelKey: 'fields.quayAdminRbac', widget: 'stringList' },
      { path: 'quayCreatorRbac', labelKey: 'fields.quayCreatorRbac', widget: 'stringList' },
      { path: 'quayMemberRbac', labelKey: 'fields.quayMemberRbac', widget: 'stringList' },
    ],
  },
  HybridNetwork: {
    fields: [
      { path: 'description', labelKey: 'fields.description', widget: 'textarea' },
      { path: 'networkViewerRbac', labelKey: 'fields.networkViewerRbac', widget: 'stringList' },
    ],
  },
  NetworkPlacement: {
    fields: [
      { path: 'network', labelKey: 'fields.network', widget: 'text', immutable: true },
      { path: 'backend.kind', labelKey: 'fields.backendKind', widget: 'text', immutable: true },
      { path: 'backend.name', labelKey: 'fields.backendName', widget: 'text', immutable: true },
      { path: 'prefixes', labelKey: 'fields.prefixes', widget: 'cidrList' },
      {
        path: 'state',
        labelKey: 'fields.state',
        widget: 'select',
        options: [
          { value: 'present', labelKey: 'fields.statePresent' },
          { value: 'absent', labelKey: 'fields.stateAbsent' },
        ],
      },
    ],
  },
  HybridFabric: {
    fields: [
      { path: 'enabled', labelKey: 'fields.enabled', widget: 'boolean' },
      { path: 'domainAsn', labelKey: 'fields.domainAsn', widget: 'number' },
      { path: 'vniPool.start', labelKey: 'fields.vniStart', widget: 'number' },
      { path: 'vniPool.end', labelKey: 'fields.vniEnd', widget: 'number' },
      {
        path: 'transportDefaults.defaultTunnelType',
        labelKey: 'fields.defaultTunnelType',
        widget: 'select',
        options: [
          { value: 'wireguard', labelKey: 'fields.tunnelWireguard' },
          { value: 'ipsec', labelKey: 'fields.tunnelIpsec' },
          { value: 'macsec', labelKey: 'fields.tunnelMacsec' },
          { value: 'none', labelKey: 'fields.tunnelNone' },
        ],
      },
    ],
  },
  CloudGateway: {
    fields: [
      { path: 'enabled', labelKey: 'fields.enabled', widget: 'boolean' },
      { path: 'cloud', labelKey: 'fields.cloud', widget: 'text', immutable: true },
      { path: 'region', labelKey: 'fields.region', widget: 'text' },
      { path: 'domainAsn', labelKey: 'fields.domainAsn', widget: 'number' },
      { path: 'fabricRef', labelKey: 'fields.fabricRef', widget: 'text', immutable: true },
    ],
  },
  TransportLink: {
    fields: [
      { path: 'enabled', labelKey: 'fields.enabled', widget: 'boolean' },
      { path: 'fabricRef', labelKey: 'fields.fabricRef', widget: 'text', immutable: true },
      { path: 'cloudGatewayRef', labelKey: 'fields.cloudGatewayRef', widget: 'text', immutable: true },
      {
        path: 'tunnelType',
        labelKey: 'fields.tunnelType',
        widget: 'select',
        options: [
          { value: 'wireguard', labelKey: 'fields.tunnelWireguard' },
          { value: 'ipsec', labelKey: 'fields.tunnelIpsec' },
          { value: 'macsec', labelKey: 'fields.tunnelMacsec' },
          { value: 'none', labelKey: 'fields.tunnelNone' },
        ],
      },
      { path: 'vaultConfigRef', labelKey: 'fields.vaultConfigRef', widget: 'text' },
    ],
  },
  UIHealthChecker: {
    fields: [
      { path: 'url', labelKey: 'fields.url', widget: 'text' },
      { path: 'displayName', labelKey: 'fields.displayName', widget: 'text' },
      { path: 'description', labelKey: 'fields.description', widget: 'textarea' },
      { path: 'group', labelKey: 'fields.group', widget: 'text' },
      { path: 'expectedStatus', labelKey: 'fields.expectedStatus', widget: 'number' },
      { path: 'timeoutSeconds', labelKey: 'fields.timeoutSeconds', widget: 'number' },
    ],
  },
};

export function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function setAtPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split('.');
  const root = { ...obj };
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = cursor[key];
    const copy =
      next && typeof next === 'object' && !Array.isArray(next)
        ? { ...(next as Record<string, unknown>) }
        : {};
    cursor[key] = copy;
    cursor = copy;
  }
  cursor[parts[parts.length - 1]] = value;
  return root;
}
