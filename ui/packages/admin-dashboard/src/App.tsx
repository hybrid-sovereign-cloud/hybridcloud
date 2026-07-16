import React from 'react';
import {
  Page,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  NavGroup,
  PageSection,
  Button,
  EmptyState,
  EmptyStateBody,
  Title,
} from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
import { NavLink, Routes, Route, useLocation } from 'react-router-dom';
import { SovereignThemeProvider, useTheme } from '@hybridsovereign/shared';
import { OverviewPage } from './pages/OverviewPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { ServicesPage } from './pages/ServicesPage';

type NavEntry =
  | { type: 'link'; path: string; label: string; end?: boolean }
  | { type: 'sep'; label: string };

const NAV: NavEntry[] = [
  { type: 'link', path: '/', label: 'Overview', end: true },
  { type: 'link', path: '/entities', label: 'Entities' },
  { type: 'link', path: '/personas', label: 'Personas' },
  { type: 'sep', label: 'Platform' },
  { type: 'link', path: '/services', label: 'Service URLs' },
  { type: 'link', path: '/operators', label: 'Operators' },
  { type: 'sep', label: 'Tenancy' },
  { type: 'link', path: '/teams', label: 'Teams' },
  { type: 'link', path: '/projects', label: 'Projects' },
  { type: 'link', path: '/platforms', label: 'Platform Openshift' },
  { type: 'link', path: '/clouds', label: 'Cloud Environments' },
  { type: 'link', path: '/assignments', label: 'Assignments' },
  { type: 'link', path: '/migrations', label: 'Migrate to OpenStack' },
];

function ThemeToggle(): React.ReactElement {
  const { mode, toggleTheme } = useTheme();
  return (
    <Button
      variant="plain"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      icon={mode === 'dark' ? <SunIcon /> : <MoonIcon />}
      style={{ color: 'inherit' }}
    />
  );
}

function Masthead(): React.ReactElement {
  return (
    <header className="sc-masthead">
      <NavLink to="/" className="sc-masthead__brand">
        <span className="sc-masthead__mark" aria-hidden />
        Sovereign Cloud
        <span className="sc-masthead__subtitle">Admin</span>
      </NavLink>
      <div style={{ marginLeft: 'auto' }}>
        <ThemeToggle />
      </div>
    </header>
  );
}

function AdminNav(): React.ReactElement {
  const location = useLocation();
  return (
    <Nav className="sc-nav" aria-label="Sovereign Cloud admin navigation">
      <NavList>
        {NAV.map((item, idx) => {
          if (item.type === 'sep') {
            return (
              <div key={`sep-${item.label}-${idx}`} className="sc-nav-separator" role="presentation">
                {item.label}
              </div>
            );
          }
          const active =
            item.end
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <NavItem key={item.path} isActive={active}>
              <NavLink to={item.path} end={item.end}>
                {item.label}
              </NavLink>
            </NavItem>
          );
        })}
      </NavList>
    </Nav>
  );
}

function AdminLayout(): React.ReactElement {
  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        <NavGroup title="Sovereign Cloud">
          <AdminNav />
        </NavGroup>
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <>
      <Masthead />
      <Page sidebar={sidebar} isManagedSidebar>
        <PageSection isFilled className="sc-page-section">
          <div className="sc-page">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/entities" element={<ResourceListPage kind="Entity" title="Entities" />} />
              <Route path="/teams" element={<ResourceListPage kind="Team" title="Teams" />} />
              <Route path="/assignments" element={<ResourceListPage kind="Assignment" title="Assignments" />} />
              <Route path="/projects" element={<ResourceListPage kind="Project" title="Projects" />} />
              <Route path="/personas" element={<ResourceListPage kind="Persona" title="Personas" />} />
              <Route
                path="/platforms"
                element={<ResourceListPage kind="PlatformOpenshift" title="Platform Openshift" />}
              />
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
              <Route
                path="/migrations"
                element={<ResourceListPage kind="OpenStackMigration" title="Migrate to OpenStack" />}
              />
              <Route
                path="/operators"
                element={
                  <ResourceListPage
                    kind="Rbac"
                    title="Operators"
                    subtitle="RBAC roles and platform operator configs"
                    secondaryKind="RbacConfig"
                  />
                }
              />
              <Route path="/services" element={<ServicesPage />} />
              <Route
                path="*"
                element={
                  <EmptyState>
                    <Title headingLevel="h4" size="lg">
                      Page not found
                    </Title>
                    <EmptyStateBody>Select a resource from the Sovereign Cloud navigation.</EmptyStateBody>
                  </EmptyState>
                }
              />
            </Routes>
          </div>
        </PageSection>
      </Page>
    </>
  );
}

export function App(): React.ReactElement {
  return (
    <SovereignThemeProvider>
      <AdminLayout />
    </SovereignThemeProvider>
  );
}
