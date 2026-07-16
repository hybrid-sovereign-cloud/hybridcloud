import React from 'react';
import { Button, Title } from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';
import { K8sResource } from '../types';

export interface NamespaceContextBarProps {
  namespace: string;
  entityName?: string;
  billingId?: string;
  resourceCount?: number;
  healthyPercent?: number;
  onTopologyClick?: () => void;
  actions?: React.ReactNode;
  /** Available entities for switching */
  entities?: K8sResource[];
  onSelectEntity?: (entityName: string) => void;
}

/** Tenant namespace context strip — compact entity switcher (DESIGN_UI_Existing §5.1) */
export function NamespaceContextBar({
  namespace,
  entityName,
  billingId,
  resourceCount,
  healthyPercent,
  onTopologyClick,
  actions,
  entities = [],
  onSelectEntity,
}: NamespaceContextBarProps): React.ReactElement {
  const displayEntity = entityName ?? namespace.replace(/^entity-/, '');
  const currentSlug = namespace.replace(/^entity-/, '');

  return (
    <div className="sc-ns-bar" aria-label="Entity namespace context">
      <div className="sc-ns-bar__main">
        <div className="sc-ns-bar__title-row">
          <Title headingLevel="h2" size="md" className="sc-ns-bar__title">
            Entity namespace
          </Title>
          {onSelectEntity && entities.length > 0 ? (
            <div className="sc-entity-switcher" role="group" aria-label="Switch entity">
              {entities.slice(0, 6).map((ent) => {
                const slug = ent.metadata.name;
                const active = slug === currentSlug;
                return (
                  <Button
                    key={slug}
                    variant={active ? 'primary' : 'secondary'}
                    size="sm"
                    className={active ? 'sc-entity-chip sc-entity-chip--active' : 'sc-entity-chip'}
                    onClick={() => onSelectEntity(slug)}
                  >
                    {slug}
                  </Button>
                );
              })}
              {entities.length > 6 && (
                <select
                  className="sc-entity-select"
                  aria-label="More entities"
                  value={currentSlug}
                  onChange={(e) => onSelectEntity(e.target.value)}
                >
                  {entities.map((ent) => (
                    <option key={ent.metadata.name} value={ent.metadata.name}>
                      {ent.metadata.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <strong className="sc-ns-bar__entity">{displayEntity}</strong>
          )}
        </div>
        <div className="sc-ns-bar__meta">
          <span>
            <strong>{namespace}</strong>
          </span>
          {billingId && (
            <span>
              Billing: <strong>{billingId}</strong>
            </span>
          )}
          {typeof resourceCount === 'number' && (
            <span>
              <strong>{resourceCount}</strong> resources
            </span>
          )}
          {typeof healthyPercent === 'number' && (
            <span>
              <strong>{healthyPercent}%</strong> healthy
            </span>
          )}
        </div>
      </div>
      <div className="sc-ns-bar__actions">
        {onTopologyClick && (
          <Button variant="secondary" size="sm" icon={<TopologyIcon />} onClick={onTopologyClick}>
            Topology
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
