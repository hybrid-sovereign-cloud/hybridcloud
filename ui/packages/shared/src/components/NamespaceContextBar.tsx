import React from 'react';
import { Button, Title } from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';

export interface NamespaceContextBarProps {
  namespace: string;
  entityName?: string;
  billingId?: string;
  resourceCount?: number;
  healthyPercent?: number;
  onTopologyClick?: () => void;
  actions?: React.ReactNode;
}

/** Tenant namespace context strip from DESIGN_UI_Existing §5.1 */
export function NamespaceContextBar({
  namespace,
  entityName,
  billingId,
  resourceCount,
  healthyPercent,
  onTopologyClick,
  actions,
}: NamespaceContextBarProps): React.ReactElement {
  const displayEntity = entityName ?? namespace.replace(/^entity-/, '');
  return (
    <div className="sc-ns-bar" aria-label="Entity namespace context">
      <div>
        <Title headingLevel="h2" size="md" style={{ margin: 0 }}>
          Entity namespace · {displayEntity}
        </Title>
        <div className="sc-ns-bar__meta" style={{ marginTop: '0.35rem' }}>
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
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {onTopologyClick && (
          <Button variant="secondary" icon={<TopologyIcon />} onClick={onTopologyClick}>
            Topology
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
