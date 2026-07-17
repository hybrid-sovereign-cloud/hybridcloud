import React from 'react';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { KindIcon } from '../icons';
import { HybridSovereignKind } from '../types';

export interface InventoryCardProps {
  title: string;
  count: number | string;
  hint?: string;
  /** Legacy free-form icon node; prefer `kind` for accent tiles */
  icon?: React.ReactNode;
  kind?: HybridSovereignKind | string;
  href?: string;
  status?: 'success' | 'danger' | 'warning' | 'default';
}

/** OpenShift Overview–style inventory tile with kind accent iconography */
export function InventoryCard({
  title,
  count,
  hint,
  icon,
  kind,
  href,
  status = 'default',
}: InventoryCardProps): React.ReactElement {
  const iconNode = kind ? <KindIcon kind={kind} size="md" /> : icon;

  const inner = (
    <Card isCompact isFullHeight className={`sc-inventory-card sc-inventory-card--${status}`}>
      <CardTitle>
        <span className="sc-inventory-card__icon" aria-hidden>
          {iconNode}
        </span>
        <span className="sc-inventory-card__title-text">{title}</span>
      </CardTitle>
      <CardBody>
        <div className="sc-inventory-card__count">{count}</div>
        {hint && <div className="sc-inventory-card__hint">{hint}</div>}
      </CardBody>
    </Card>
  );
  if (href) {
    return (
      <a href={href} className="sc-card-link">
        {inner}
      </a>
    );
  }
  return inner;
}
