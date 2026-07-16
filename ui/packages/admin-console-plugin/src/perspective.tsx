/** Landing / redirect helpers for console.perspective (function CodeRefs, not components) */

export const perspectiveLandingPage = (
  _flags: { [key: string]: boolean },
  _isFirstVisit: boolean,
): string => '/hybridsovereign/overview';

export const perspectiveImportRedirect = (_namespace: string): string =>
  '/hybridsovereign/overview';
