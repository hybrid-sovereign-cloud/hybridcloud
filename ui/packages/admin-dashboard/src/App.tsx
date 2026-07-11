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
  Spinner,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
import { NavLink, Routes, Route } from 'react-router-dom';
import { SovereignThemeProvider, useTheme } from '@hybridsovereign/shared';
import { OverviewPage } from './pages/OverviewPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { ServicesPage } from './pages/ServicesPage';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', end: true },
  { path: '/entities', label: 'Entities', kind: 'Entity' as const },
  { path: '/teams', label: 'Teams', kind: 'Team' as const },
  { path: '/assignments', label: 'Assignments', kind: 'Assignment' as const },
  { path: '/projects', label: 'Projects', kind: 'Project' as const },
  { path: '/personas', label: 'Personas', kind: 'Persona' as const },
  { path: '/platforms', label: 'Platforms', kind: 'PlatformOpenshift' as const },
  { path: '/clouds', label: 'Clouds', kinds: ['CloudOSO', 'CloudAWS'] as const },
  { path: '/migrations', label: 'Migrations', kind: 'OpenStackMigration' as const },
  { path: '/operators', label: 'Operators', kinds: ['Rbac', 'RbacConfig'] as const },
  { path: '/services', label: 'Services' },
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

function AdminLayout(): React.ReactElement {
  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        <Nav aria-label="Admin navigation">
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

  const header = (
    <PageSection variant="light" isWidthLimited>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <Title headingLevel="h1" size="2xl">
              Hybrid Sovereign Admin
            </Title>
          </ToolbarItem>
          <ToolbarItem align={{ default: 'alignEnd' }}>
            <ThemeToggle />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    </PageSection>
  );

  return (
    <Page sidebar={sidebar}>
      {header}
      <PageSection isFilled>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/entities" element={<ResourceListPage kind="Entity" title="Entities" />} />
          <Route path="/teams" element={<ResourceListPage kind="Team" title="Teams" />} />
          <Route path="/assignments" element={<ResourceListPage kind="Assignment" title="Assignments" />} />
          <Route path="/projects" element={<ResourceListPage kind="Project" title="Projects" />} />
          <Route path="/personas" element={<ResourceListPage kind="Persona" title="Personas" />} />
          <Route path="/platforms" element={<ResourceListPage kind="PlatformOpenshift" title="Platforms" />} />
          <Route
            path="/clouds"
            element={
              <ResourceListPage
                kind="CloudOSO"
                title="Cloud Environments"
                subtitle="CloudOSO and CloudAWS resources"
                secondaryKind="CloudAWS"
              />
            }
          />
          <Route path="/migrations" element={<ResourceListPage kind="OpenStackMigration" title="Migrations" />} />
          <Route
            path="/operators"
            element={
              <ResourceListPage
                kind="Rbac"
                title="Operators"
                subtitle="RBAC roles and configs"
                secondaryKind="RbacConfig"
              />
            }
          />
          <Route path="/services" element={<ServicesPage />} />
          <Route
            path="*"
            element={
              <EmptyState>
                <Title headingLevel="h4" size="lg">Page not found</Title>
                <EmptyStateBody>Select a resource from the sidebar.</EmptyStateBody>
              </EmptyState>
            }
          />
        </Routes>
      </PageSection>
    </Page>
  );
}

export function App(): React.ReactElement {
  return (
    <SovereignThemeProvider>
      <AdminLayout />
    </SovereignThemeProvider>
  );
}

export { Spinner };
