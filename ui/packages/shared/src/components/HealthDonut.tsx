import React, { useMemo } from 'react';

export interface HealthDonutProps {
  ready: number;
  failed: number;
  pending: number;
  title?: string;
}

/** Lightweight SVG donut — OpenShift Overview style without chart deps */
export function HealthDonut({
  ready,
  failed,
  pending,
  title = 'Health',
}: HealthDonutProps): React.ReactElement {
  const total = ready + failed + pending;
  const pct = total === 0 ? 0 : Math.round((ready / total) * 100);

  const segments = useMemo(() => {
    const r = 42;
    const c = 2 * Math.PI * r;
    const parts = [
      { key: 'ready', value: ready, color: 'var(--pf-v5-global--success-color--100, #3e8635)' },
      { key: 'failed', value: failed, color: 'var(--pf-v5-global--danger-color--100, #c9190b)' },
      { key: 'pending', value: pending, color: 'var(--pf-v5-global--warning-color--100, #f0ab00)' },
    ];
    let offset = 0;
    return parts.map((p) => {
      const len = total === 0 ? 0 : (p.value / total) * c;
      const seg = { ...p, dash: `${len} ${c - len}`, offset: -offset };
      offset += len;
      return seg;
    });
  }, [ready, failed, pending, total]);

  return (
    <div className="sc-health-donut" aria-label={`${title} ${pct}% healthy`}>
      <div className="sc-health-donut__chart">
        <svg viewBox="0 0 120 120" width="180" height="180" role="img">
          <circle cx="60" cy="60" r="42" fill="none" stroke="var(--pf-v5-global--BorderColor--100)" strokeWidth="12" />
          {segments.map((s) =>
            s.value > 0 ? (
              <circle
                key={s.key}
                cx="60"
                cy="60"
                r="42"
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={s.dash}
                strokeDashoffset={s.offset}
                transform="rotate(-90 60 60)"
              />
            ) : null,
          )}
          <text x="60" y="56" textAnchor="middle" className="sc-health-donut__total">
            {total}
          </text>
          <text x="60" y="74" textAnchor="middle" className="sc-health-donut__sub">
            {total === 0 ? 'No data' : `${pct}% healthy`}
          </text>
        </svg>
      </div>
      <ul className="sc-health-donut__legend">
        <li>
          <span className="sc-dot sc-dot--ready" /> Ready <strong>{ready}</strong>
        </li>
        <li>
          <span className="sc-dot sc-dot--failed" /> Failed <strong>{failed}</strong>
        </li>
        <li>
          <span className="sc-dot sc-dot--pending" /> Pending / other <strong>{pending}</strong>
        </li>
      </ul>
    </div>
  );
}
