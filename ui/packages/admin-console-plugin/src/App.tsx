import React from 'react';
import {
  Page,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
} from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
import { SovereignThemeProvider, useTheme } from '@hybridsovereign/shared';
import AdminOverviewPage from './components/AdminOverviewPage';

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
  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        <Nav aria-label="Console plugin preview">
          <NavList>
            <NavItem itemId="overview" isActive>Overview</NavItem>
            <NavItem itemId="entities">Entities</NavItem>
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <SovereignThemeProvider>
      <Page sidebar={sidebar}>
        <PageSection variant="light">
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <Title headingLevel="h1" size="2xl">Admin Console Plugin Preview</Title>
              </ToolbarItem>
              <ToolbarItem align={{ default: 'alignEnd' }}>
                <ThemeToggle />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </PageSection>
        <AdminOverviewPage />
      </Page>
    </SovereignThemeProvider>
  );
}
