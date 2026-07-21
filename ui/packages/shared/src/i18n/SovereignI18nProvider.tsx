import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { initI18n } from './index';

export interface SovereignI18nProviderProps {
  children: React.ReactNode;
}

/** Ensures i18n is initialized and provides react-i18next context. */
export function SovereignI18nProvider({ children }: SovereignI18nProviderProps): React.ReactElement {
  const i18n = initI18n();
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
