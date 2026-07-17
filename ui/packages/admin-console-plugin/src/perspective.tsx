import * as React from 'react';

/** Perspective icon — named export matching OpenShift console.perspective CodeRef pattern */
export const icon: React.FC = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2 2 7l10 5 10-5-10-5zm0 9.5L4.21 8.14 12 12l7.79-3.86L12 11.5zM4 10.5v5.5l8 4 8-4v-5.5l-8 4-8-4z" />
  </svg>
);

export const getLandingPageURL = (
  _flags: { [key: string]: boolean },
  _isFirstVisit: boolean,
): string => '/hybridsovereign/overview';

export const getImportRedirectURL = (_namespace: string): string => '/hybridsovereign/overview';

/** @deprecated Prefer named `icon` / `getLandingPageURL` CodeRefs */
export const perspectiveLandingPage = getLandingPageURL;
/** @deprecated Prefer `getImportRedirectURL` */
export const perspectiveImportRedirect = getImportRedirectURL;
