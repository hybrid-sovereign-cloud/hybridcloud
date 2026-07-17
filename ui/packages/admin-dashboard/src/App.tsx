import React from 'react';
import {
  Page,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  PageSection,
  Button,
  EmptyState,
  EmptyStateBody,
  Title,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  MastheadToggle,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
} from '@patternfly/react-core';
import {
  MoonIcon,
  SunIcon,
  TachometerAltIcon,
  CubesIcon,
  UsersIcon,
  CatalogIcon,
  ClusterIcon,
  CloudIcon,
  TopologyIcon,
  CogIcon,
  OutlinedBellIcon,
  QuestionCircleIcon,
  UserIcon,
  ProjectDiagramIcon,
  BuildingIcon,
  BarsIcon,
  GlobeIcon,
} from '@patternfly/react-icons';
import { NavLink, Routes, Route, useLocation } from 'react-router-dom';
import { SovereignThemeProvider, useTheme } from '@hybridsovereign/shared';
import { OverviewPage } from './pages/OverviewPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { ServicesPage } from './pages/ServicesPage';
import { CreateResourcePage } from './pages/CreateResourcePage';

type NavEntry =
  | { type: 'link'; path: string; label: string; icon: React.ComponentType; end?: boolean }
  | { type: 'sep'; label: string };

const NAV: NavEntry[] = [
  { type: 'link', path: '/', label: 'Overview', icon: TachometerAltIcon, end: true },
  { type: 'link', path: '/entities', label: 'Entities', icon: BuildingIcon },
  { type: 'link', path: '/personas', label: 'Personas', icon: UsersIcon },
  { type: 'sep', label: 'Platform' },
  { type: 'link', path: '/services', label: 'Service URLs', icon: GlobeIcon },
  { type: 'link', path: '/operators', label: 'Operators', icon: CogIcon },
  { type: 'sep', label: 'Tenancy (read)' },
  { type: 'link', path: '/teams', label: 'Teams', icon: UsersIcon },
  { type: 'link', path: '/projects', label: 'Projects', icon: CubesIcon },
  { type: 'link', path: '/platforms', label: 'Platform Openshift', icon: ClusterIcon },
  { type: 'link', path: '/clouds', label: 'Cloud Environments', icon: CloudIcon },
  { type: 'link', path: '/assignments', label: 'Assignments', icon: ProjectDiagramIcon },
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

function AdminNav(): React.ReactElement {
  const location = useLocation();
  const groups = React.useMemo(() => {
    const result: { title?: string; items: Extract<NavEntry, { type: 'link' }>[] }[] = [];
    let current: { title?: string; items: Extract<NavEntry, { type: 'link' }>[] } = { items: [] };
    for (const entry of NAV) {
      if (entry.type === 'sep') {
        if (current.items.length) result.push(current);
        current = { title: entry.label, items: [] };
      } else {
        current.items.push(entry);
      }
    }
    if (current.items.length) result.push(current);
    return result;
  }, []);

  return (
    <Nav theme="dark" aria-label="Sovereign Admin navigation">
      {groups.map((group, gi) => (
        <NavList key={group.title ?? `group-${gi}`}>
          {group.title ? (
            <li className="sc-nav-separator" role="presentation">
              {group.title}
            </li>
          ) : null}
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = item.end
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <NavItem key={item.path} isActive={active}>
                <NavLink to={item.path} end={item.end} className="sc-nav-link">
                  <span className="sc-nav-link__icon">
                    <Icon />
                  </span>
                  {item.label}
                </NavLink>
              </NavItem>
            );
          })}
        </NavList>
      ))}
    </Nav>
  );
}

function AdminLayout(): React.ReactElement {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);

  const header = (
    <Masthead className="sc-pf-masthead">
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setSidebarOpen((o) => !o)}
          id="admin-nav-toggle"
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <NavLink to="/" className="sc-masthead-brand">
            <TopologyIcon className="sc-masthead-brand__icon" />
            <span>
              Sovereign Admin Console
            </span>
          </NavLink>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar id="admin-masthead-toolbar" isFullHeight isStatic>
          <ToolbarContent>
            <ToolbarGroup align={{ default: 'alignRight' }}>
              <ToolbarItem>
                <Button variant="plain" aria-label="Notifications" icon={<OutlinedBellIcon />} />
              </ToolbarItem>
              <ToolbarItem>
                <Button variant="plain" aria-label="Help" icon={<QuestionCircleIcon />} />
              </ToolbarItem>
              <ToolbarItem>
                <ThemeToggle />
              </ToolbarItem>
              <ToolbarItem>
                <Button variant="plain" aria-label="User" icon={<UserIcon />}>
                  admin
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar theme="dark" isSidebarOpen={isSidebarOpen} id="admin-sidebar">
      <PageSidebarBody>
        <div className="sc-sidebar-title">Sovereign Admin</div>
        <AdminNav />
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page header={header} sidebar={sidebar} isManagedSidebar>
      <PageSection isFilled className="sc-page-section sc-page-section--dashboard">
        <div className="sc-page">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route
              path="/entities"
              element={<ResourceListPage kind="Entity" title="Entities" createPath="/create/entity" />}
            />
            <Route path="/teams" element={<ResourceListPage kind="Team" title="Teams" />} />
            <Route path="/assignments" element={<ResourceListPage kind="Assignment" title="Assignments" />} />
            <Route path="/projects" element={<ResourceListPage kind="Project" title="Projects" />} />
            <Route
              path="/personas"
              element={<ResourceListPage kind="Persona" title="Personas" createPath="/create/persona" />}
            />
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
            <Route path="/create/:kind" element={<CreateResourcePage />} />
            <Route
              path="*"
              element={
                <EmptyState>
                  <Title headingLevel="h4" size="lg">
                    Page not found
                  </Title>
                  <EmptyStateBody>Select a resource from the Sovereign Admin navigation.</EmptyStateBody>
                </EmptyState>
              }
            />
          </Routes>
        </div>
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
