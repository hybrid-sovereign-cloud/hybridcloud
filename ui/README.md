# Hybrid Sovereign UI

PatternFly 5 monorepo for Hybrid Sovereign Cloud dashboards and OpenShift console plugins.

## Packages

| Package | Description |
|---------|-------------|
| `@hybridsovereign/shared` | CRD TypeScript types, K8s API hooks, theme provider |
| `@hybridsovereign/admin-dashboard` | Platform operator dashboard (React 18 + Vite) |
| `@hybridsovereign/tenant-dashboard` | Tenant self-service dashboard |
| `@hybridsovereign/admin-console-plugin` | OCP 4.x admin console dynamic plugin |
| `@hybridsovereign/tenant-console-plugin` | OCP 4.x tenant console dynamic plugin |

## CRD Types

All types target `hybridsovereign.redhat/v1alpha1`:

Entity, Team, Assignment, Project, Persona, PlatformOpenshift, CloudOSO, CloudAWS, OpenStackMigration, Rbac, RbacConfig, AAPOrg, AAPConfig, QuayOrg, QuayConfig, Vault, VaultKV

## Quick Start

```bash
cd hybridcloud/ui
make install
make build
```

### Development servers

```bash
make dev-admin    # http://localhost:3000
make dev-tenant   # http://localhost:3001
```

## Architecture

```
ui/
├── packages/
│   ├── shared/                 # Types, hooks, SovereignThemeProvider
│   ├── admin-dashboard/        # Operator views (11 pages)
│   ├── tenant-dashboard/       # Self-service forms + scoped lists
│   ├── admin-console-plugin/   # OCP console — platform nav
│   └── tenant-console-plugin/  # OCP console — tenant nav
├── package.json                # npm workspaces root
└── Makefile
```

Dashboards proxy K8s API calls to `/api/k8s` (backed by the dashboard K8s proxy server in production).

## Migration Notes

This monorepo replaces the legacy `user_dashboard` and `tenancy_dashboard` React apps and console plugin sources. Helm chart packaging remains in `bootstrap/helm/charts/`.
