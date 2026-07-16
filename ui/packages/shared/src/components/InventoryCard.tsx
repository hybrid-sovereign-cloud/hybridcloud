import React from 'react';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';

export interface InventoryCardProps {
  title: string;
  count: number | string;
  hint?: string;
  icon: React.ReactNode;
  href?: string;
  status?: 'success' | 'danger' | 'warning' | 'default';
}

/** OpenShift Overview–style inventory tile with icon */
export function InventoryCard({
  title,
  count,
  hint,
  icon,
  href,
  status = 'default',
}: InventoryCardProps): React.ReactElement {
  const inner = (
    <Card isCompact isFullHeight className={`sc-inventory-card sc-inventory-card--${status}`}>
      <CardTitle>
        <span className="sc-inventory-card__icon" aria-hidden>
          {icon}
        </span>
        {title}
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
