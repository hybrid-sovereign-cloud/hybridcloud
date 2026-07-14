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
import { NavLink, Routes, Route } from 'react-router-dom';
import { SovereignThemeProvider, useTheme, useEntityNamespace, EntityTopology } from '@hybridsovereign/shared';
import { TenantOverviewPage } from './pages/TenantOverviewPage';
import { TenantResourcePage } from './pages/TenantResourcePage';
import { SelfServiceFormPage } from './pages/SelfServiceFormPage';

/** Fallback when OIDC groups are unavailable (local dev) */
const DEV_USER_GROUPS = ['acme-corp-platform-engineering-admins'];

const NAV_ITEMS = [
  { path: '/', label: 'Overview', end: true },
  { path: '/teams', label: 'My Teams', kind: 'Team' as const, form: 'team' as const },
  { path: '/projects', label: 'My Projects', kind: 'Project' as const, form: 'project' as const },
  { path: '/assignments', label: 'Assignments', kind: 'Assignment' as const, form: 'assignment' as const },
  { path: '/cloudoso', label: 'CloudOSO', kind: 'CloudOSO' as const, form: 'cloudoso' as const },
  { path: '/cloudaws', label: 'Cloud AWS', kind: 'CloudAWS' as const, form: 'cloudaws' as const },
  { path: '/platforms', label: 'Platforms', kind: 'PlatformOpenshift' as const },
];

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

function TenantLayout(): React.ReactElement {
  const { namespace: tenantNamespace } = useEntityNamespace({
    userGroups: DEV_USER_GROUPS,
  });

  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        <Nav aria-label="Tenant navigation">
          <NavList>
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  style={({ isActive }) => ({
                    color: 'inherit',
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 400,
                  })}
                >
                  {item.label}
                </NavLink>
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page sidebar={sidebar}>
      <PageSection variant="light" isWidthLimited>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Title headingLevel="h1" size="2xl">
                Tenant Dashboard
              </Title>
            </ToolbarItem>
            <ToolbarItem>
              <span style={{ opacity: 0.7 }}>Namespace: {tenantNamespace}</span>
            </ToolbarItem>
            <ToolbarItem align={{ default: 'alignEnd' }}>
              <ThemeToggle />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </PageSection>
      <PageSection isFilled>
        <Routes>
          <Route path="/" element={<TenantOverviewPage namespace={tenantNamespace} />} />
          {NAV_ITEMS.filter((i) => i.kind).map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                <TenantResourcePage
                  kind={item.kind!}
                  title={item.label}
                  namespace={tenantNamespace}
                  formType={item.form}
                />
              }
            />
          ))}
          <Route
            path="/create/:formType"
            element={<SelfServiceFormPage namespace={tenantNamespace} />}
          />
        </Routes>
      </PageSection>
    </Page>
  );
}

export function App(): React.ReactElement {
  return (
    <SovereignThemeProvider>
      <TenantLayout />
    </SovereignThemeProvider>
  );
}

export { DEV_USER_GROUPS as TENANT_NAMESPACE };
