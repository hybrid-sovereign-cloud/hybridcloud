import React from 'react';

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  /** Optional wrapper — parent supplies Link/NavLink when needed */
  children?: never;
}

export function StatTile({ label, value, hint }: StatTileProps): React.ReactElement {
  return (
    <div className="sc-stat-tile">
      <div className="sc-stat-tile__label">{label}</div>
      <div className="sc-stat-tile__value">{value}</div>
      {hint && <div className="sc-stat-tile__hint">{hint}</div>}
    </div>
  );
}

export interface HealthStripTile extends StatTileProps {
  key?: string;
  href?: string;
  onClick?: () => void;
}

export interface HealthStripProps {
  tiles: HealthStripTile[];
}

export function HealthStrip({ tiles }: HealthStripProps): React.ReactElement {
  return (
    <div className="sc-health-strip" role="list" aria-label="Platform health">
      {tiles.map((t) => {
        const tile = <StatTile label={t.label} value={t.value} hint={t.hint} />;
        return (
          <div key={t.key ?? t.label} role="listitem">
            {t.href ? (
              <a href={t.href} className="sc-card-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                {tile}
              </a>
            ) : t.onClick ? (
              <button
                type="button"
                className="sc-card-link"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={t.onClick}
              >
                {tile}
              </button>
            ) : (
              tile
            )}
          </div>
        );
      })}
    </div>
  );
}
