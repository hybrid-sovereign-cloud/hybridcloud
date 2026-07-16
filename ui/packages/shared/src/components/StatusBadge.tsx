import React from 'react';
import { Label, Popover, DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription } from '@patternfly/react-core';

export type ResourceHealth = 'ready' | 'pending' | 'failed' | 'reconciling' | 'unknown';

const COLOR: Record<ResourceHealth, 'green' | 'orange' | 'red' | 'blue' | 'grey'> = {
  ready: 'green',
  pending: 'orange',
  failed: 'red',
  reconciling: 'blue',
  unknown: 'grey',
};

export interface StatusBadgeProps {
  status?: string | null;
  ready?: boolean;
  message?: string;
  lastTransition?: string;
}

export function normalizeHealth(ready?: boolean, status?: string | null): ResourceHealth {
  const s = (status ?? '').toLowerCase();
  if (ready === true || s === 'ready' || s === 'success') return 'ready';
  if (s === 'failed' || s === 'error') return 'failed';
  if (s === 'reconciling' || s === 'running') return 'reconciling';
  if (s === 'pending' || s === '') return ready === false ? 'pending' : 'pending';
  return 'unknown';
}

/** Compact OCP-style status label with optional conditions popover */
export function StatusBadge({
  status,
  ready,
  message,
  lastTransition,
}: StatusBadgeProps): React.ReactElement {
  const health = normalizeHealth(ready, status);
  const label = <Label color={COLOR[health]}>{health}</Label>;

  if (!message && !lastTransition) {
    return label;
  }

  return (
    <Popover
      headerContent="Status"
      bodyContent={
        <DescriptionList isCompact isHorizontal>
          {message && (
            <DescriptionListGroup>
              <DescriptionListTerm>Message</DescriptionListTerm>
              <DescriptionListDescription>{message}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {lastTransition && (
            <DescriptionListGroup>
              <DescriptionListTerm>Last transition</DescriptionListTerm>
              <DescriptionListDescription>{lastTransition}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      }
    >
      <span style={{ cursor: 'pointer' }}>{label}</span>
    </Popover>
  );
}
