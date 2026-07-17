import React from 'react';
import {
  BuildingIcon,
  UsersIcon,
  FolderOpenIcon,
  ClusterIcon,
  CloudIcon,
  AwsIcon,
  ProjectDiagramIcon,
  UserEditIcon,
  LockIcon,
  SecurityIcon,
  KeyIcon,
  ProcessAutomationIcon,
  BundleIcon,
  MigrationIcon,
  CogIcon,
  GlobeIcon,
  TachometerAltIcon,
  CatalogIcon,
  ServerIcon,
  LayerGroupIcon,
} from '@patternfly/react-icons';
import { HybridSovereignKind } from '../types';

export type KindAccent = 'red' | 'blue' | 'teal' | 'green' | 'orange' | 'purple' | 'grey' | 'cyan';

export interface KindVisual {
  icon: React.ComponentType<{ className?: string }>;
  accent: KindAccent;
  label: string;
}

/** Distinctive icon + accent per CR kind (and nav aliases). */
export const KIND_VISUALS: Record<string, KindVisual> = {
  Overview: { icon: TachometerAltIcon, accent: 'red', label: 'Overview' },
  Entity: { icon: BuildingIcon, accent: 'red', label: 'Entity' },
  Team: { icon: UsersIcon, accent: 'blue', label: 'Team' },
  Project: { icon: FolderOpenIcon, accent: 'teal', label: 'Project' },
  PlatformOpenshift: { icon: ClusterIcon, accent: 'red', label: 'Platform Openshift' },
  CloudOSO: { icon: LayerGroupIcon, accent: 'cyan', label: 'Cloud OSO' },
  CloudAWS: { icon: AwsIcon, accent: 'orange', label: 'Cloud AWS' },
  Cloud: { icon: CloudIcon, accent: 'cyan', label: 'Cloud' },
  Assignment: { icon: ProjectDiagramIcon, accent: 'purple', label: 'Assignment' },
  Persona: { icon: UserEditIcon, accent: 'blue', label: 'Persona' },
  Rbac: { icon: LockIcon, accent: 'grey', label: 'RBAC' },
  Vault: { icon: SecurityIcon, accent: 'green', label: 'Vault' },
  VaultKV: { icon: KeyIcon, accent: 'teal', label: 'Vault KV' },
  AAPOrg: { icon: ProcessAutomationIcon, accent: 'orange', label: 'AAP Org' },
  QuayOrg: { icon: BundleIcon, accent: 'purple', label: 'Quay Org' },
  OpenStackMigration: { icon: MigrationIcon, accent: 'cyan', label: 'Migration' },
  AAPConfig: { icon: GlobeIcon, accent: 'blue', label: 'Service URL' },
  RbacConfig: { icon: CogIcon, accent: 'grey', label: 'Operator' },
  QuayConfig: { icon: CatalogIcon, accent: 'purple', label: 'Quay Config' },
  Server: { icon: ServerIcon, accent: 'red', label: 'Server' },
};

export function getKindVisual(kind: HybridSovereignKind | string): KindVisual {
  return KIND_VISUALS[kind] ?? { icon: CatalogIcon, accent: 'grey', label: String(kind) };
}

export interface KindIconProps {
  kind: HybridSovereignKind | string;
  /** When true, wraps icon in a colored tile */
  tiled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

/** Kind-aware icon with optional accent tile for lists, cards, and nav. */
export function KindIcon({
  kind,
  tiled = false,
  size = 'md',
  className = '',
  title,
}: KindIconProps): React.ReactElement {
  const visual = getKindVisual(kind);
  const Icon = visual.icon;
  const classes = [
    'sc-kind-icon',
    tiled ? 'sc-kind-icon--tiled' : '',
    `sc-kind-icon--${visual.accent}`,
    `sc-kind-icon--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} title={title ?? visual.label} aria-hidden={!title}>
      <Icon />
    </span>
  );
}
