import * as React from 'react';

/**
 * Perspective icon MUST be a default export.
 * OpenShift resolves console.perspective icon CodeRefs as LazyComponent:
 *   icon().then((m) => m.default)
 */
const PerspectiveIcon: React.FC = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2 2 7l10 5 10-5-10-5z" opacity="0.95" />
    <path d="M4 10.5v5.5l8 4v-5.5l-8-4z" opacity="0.75" />
    <path d="M20 10.5v5.5l-8 4v-5.5l8-4z" opacity="0.55" />
  </svg>
);

export default PerspectiveIcon;
