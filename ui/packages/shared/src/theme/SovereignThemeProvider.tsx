import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'hybridsovereign-theme';

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyPfTheme(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', mode === 'dark' ? 'dark' : 'light');
  document.documentElement.classList.toggle('pf-v5-theme-dark', mode === 'dark');
}

export interface SovereignThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

/** PatternFly 5 theme provider with persisted dark/light mode toggle */
export function SovereignThemeProvider({
  children,
  defaultMode,
}: SovereignThemeProviderProps): React.ReactElement {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode ?? getInitialMode);

  useEffect(() => {
    applyPfTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setTheme = useCallback((next: ThemeMode) => setModeState(next), []);
  const toggleTheme = useCallback(
    () => setModeState((m) => (m === 'light' ? 'dark' : 'light')),
    [],
  );

  const value = useMemo(
    () => ({ mode, toggleTheme, setTheme }),
    [mode, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within SovereignThemeProvider');
  }
  return ctx;
}
