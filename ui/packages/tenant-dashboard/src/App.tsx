import React, { useMemo, useState } from 'react';
import {
  Page,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  PageSection,
  Button,
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
  ClusterIcon,
  CloudIcon,
  TopologyIcon,
  OutlinedBellIcon,
  QuestionCircleIcon,
  UserIcon,
  ProjectDiagramIcon,
  BarsIcon,
} from '@patternfly/react-icons';
import { NavLink, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  SovereignThemeProvider,
  useTheme,
  useEntityNamespace,
  NamespaceContextBar,
} from '@hybridsovereign/shared';
import { TenantOverviewPage } from './pages/TenantOverviewPage';
import { TenantResourcePage } from './pages/TenantResourcePage';
import { SelfServiceFormPage } from './pages/SelfServiceFormPage';

const DEV_USER_GROUPS = ['acme-corp-platform-engineering-admins'];

type NavEntry =
  | {
      type: 'link';
      path: string;
      label: string;
      icon: React.ComponentType;
      end?: boolean;
      kind?: string;
      form?: string;
    }
  | { type: 'sep'; label: string };

const NAV: NavEntry[] = [
  { type: 'link', path: '/', label: 'Overview', icon: TachometerAltIcon, end: true },
  { type: 'sep', label: 'Tenancy' },
  { type: 'link', path: '/teams', label: 'Teams', icon: UsersIcon, kind: 'Team', form: 'team' },
  { type: 'link', path: '/projects', label: 'Projects', icon: CubesIcon, kind: 'Project', form: 'project' },
  {
    type: 'link',
    path: '/platforms',
    label: 'Platform Openshift',
    icon: ClusterIcon,
    kind: 'PlatformOpenshift',
  },
  { type: 'link', path: '/cloudoso', label: 'Cloud OSO', icon: CloudIcon, kind: 'CloudOSO', form: 'cloudoso' },
  { type: 'link', path: '/cloudaws', label: 'Cloud AWS', icon: CloudIcon, kind: 'CloudAWS', form: 'cloudaws' },
  {
    type: 'link',
    path: '/assignments',
    label: 'Assignments',
    icon: ProjectDiagramIcon,
    kind: 'Assignment',
    form: 'assignment',
  },
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { namespace: tenantNamespace } = useEntityNamespace({
    userGroups: DEV_USER_GROUPS,
  });

  const header = (
    <Masthead className="sc-pf-masthead">
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setSidebarOpen((o) => !o)}
          id="tenant-nav-toggle"
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <NavLink to="/" className="sc-masthead-brand">
            <TopologyIcon className="sc-masthead-brand__icon" />
            <span>Sovereign Cloud</span>
          </NavLink>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar id="tenant-masthead-toolbar" isFullHeight isStatic>
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
                  tenant
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar theme="dark" isSidebarOpen={isSidebarOpen} id="tenant-sidebar">
      <PageSidebarBody>
        <div className="sc-sidebar-title">Sovereign Cloud</div>
        <Nav theme="dark" aria-label="Tenant navigation">
          <NavList>
            {NAV.map((item, idx) => {
              if (item.type === 'sep') {
                return (
                  <li key={`sep-${item.label}-${idx}`} className="sc-nav-separator" role="presentation">
                    {item.label}
                  </li>
                );
              }
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
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  const resourceRoutes = useMemo(
    () => NAV.filter((i): i is Extract<NavEntry, { type: 'link' }> => i.type === 'link' && !!i.kind),
    [],
  );

  return (
    <Page header={header} sidebar={sidebar} isManagedSidebar>
      <PageSection padding={{ default: 'noPadding' }} className="sc-ns-section">
        <div className="sc-page">
          <NamespaceContextBar
            namespace={tenantNamespace}
            onTopologyClick={() => navigate('/')}
          />
        </div>
      </PageSection>
      <PageSection isFilled className="sc-page-section sc-page-section--dashboard">
        <div className="sc-page">
          <Routes>
            <Route path="/" element={<TenantOverviewPage namespace={tenantNamespace} />} />
            {resourceRoutes.map((item) => (
              <Route
                key={item.path}
                path={item.path}
                element={
                  <TenantResourcePage
                    kind={item.kind as 'Team'}
                    title={item.label}
                    namespace={tenantNamespace}
                    formType={item.form as 'team' | undefined}
                  />
                }
              />
            ))}
            <Route path="/create/:formType" element={<SelfServiceFormPage namespace={tenantNamespace} />} />
          </Routes>
        </div>
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
