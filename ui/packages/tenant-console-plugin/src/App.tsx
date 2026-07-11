import React from 'react';
import {
  Page,
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
} from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
import { SovereignThemeProvider, useTheme } from '@hybridsovereign/shared';
import TenantOverviewPage from './components/TenantOverviewPage';

function ThemeToggle(): React.ReactElement {
  const { mode, toggleTheme } = useTheme();
  return (
    <Button
      variant="plain"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      icon={mode === 'dark' ? <SunIcon /> : <MoonIcon />}
    />
  );
}

/** Standalone preview shell for local development outside the OCP console */
export function App(): React.ReactElement {
  return (
    <SovereignThemeProvider>
      <Page>
        <PageSection variant="light">
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <Title headingLevel="h1" size="2xl">Tenant Console Plugin Preview</Title>
              </ToolbarItem>
              <ToolbarItem align={{ default: 'alignEnd' }}>
                <ThemeToggle />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </PageSection>
        <TenantOverviewPage />
      </Page>
    </SovereignThemeProvider>
  );
}
