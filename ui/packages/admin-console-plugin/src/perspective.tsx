/** Landing / redirect helpers for console.perspective (function CodeRefs). */

export const getLandingPageURL = (
  _flags: { [key: string]: boolean },
  _isFirstVisit: boolean,
): string => '/hybridsovereign/overview';

export const getImportRedirectURL = (_namespace: string): string => '/hybridsovereign/overview';
