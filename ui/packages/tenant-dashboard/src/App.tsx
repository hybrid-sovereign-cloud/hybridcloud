import React, { useMemo, useState } from 'react';
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
} from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
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
  | { type: 'link'; path: string; label: string; end?: boolean; kind?: string; form?: string }
  | { type: 'sep'; label: string };

const NAV: NavEntry[] = [
  { type: 'link', path: '/', label: 'Entity Overview', end: true },
  { type: 'sep', label: 'Tenancy' },
  { type: 'link', path: '/teams', label: 'Teams', kind: 'Team', form: 'team' },
  { type: 'link', path: '/projects', label: 'Projects', kind: 'Project', form: 'project' },
  { type: 'link', path: '/platforms', label: 'Platform Openshift', kind: 'PlatformOpenshift' },
  { type: 'link', path: '/cloudoso', label: 'Cloud OSO', kind: 'CloudOSO', form: 'cloudoso' },
  { type: 'link', path: '/cloudaws', label: 'Cloud AWS', kind: 'CloudAWS', form: 'cloudaws' },
  { type: 'link', path: '/assignments', label: 'Assignments', kind: 'Assignment', form: 'assignment' },
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
        <span className="sc-masthead__subtitle">Tenant</span>
      </NavLink>
      <div style={{ marginLeft: 'auto' }}>
        <ThemeToggle />
      </div>
    </header>
  );
}

function TenantLayout(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { namespace: tenantNamespace } = useEntityNamespace({
    userGroups: DEV_USER_GROUPS,
  });
  const [showTopoHint, setShowTopoHint] = useState(false);

  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        <NavGroup title="Sovereign Cloud">
          <Nav className="sc-nav" aria-label="Tenant navigation">
            <NavList>
              {NAV.map((item, idx) => {
                if (item.type === 'sep') {
                  return (
                    <div key={`sep-${item.label}-${idx}`} className="sc-nav-separator" role="presentation">
                      {item.label}
                    </div>
                  );
                }
                const active = item.end
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
        </NavGroup>
      </PageSidebarBody>
    </PageSidebar>
  );

  const resourceRoutes = useMemo(
    () => NAV.filter((i): i is Extract<NavEntry, { type: 'link' }> => i.type === 'link' && !!i.kind),
    [],
  );

  return (
    <>
      <Masthead />
      <Page sidebar={sidebar} isManagedSidebar>
        <PageSection padding={{ default: 'noPadding' }}>
          <div className="sc-page" style={{ paddingTop: '1rem', paddingInline: '1.5rem' }}>
            <NamespaceContextBar
              namespace={tenantNamespace}
              onTopologyClick={() => {
                setShowTopoHint(true);
                navigate('/');
              }}
            />
            {showTopoHint && location.pathname === '/' && (
              <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.75 }}>
                Showing live entity topology for {tenantNamespace}
              </div>
            )}
          </div>
        </PageSection>
        <PageSection isFilled className="sc-page-section">
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
              <Route
                path="/create/:formType"
                element={<SelfServiceFormPage namespace={tenantNamespace} />}
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
      <TenantLayout />
    </SovereignThemeProvider>
  );
}

export { DEV_USER_GROUPS as TENANT_NAMESPACE };
