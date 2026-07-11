# Dashboard API Reference

## Overview

The dashboard backend exposes a REST API that proxies requests to the Kubernetes API server. All endpoints are protected by the `oauth-proxy` sidecar — unauthenticated requests never reach the backend.

## Authentication

Authentication is handled entirely by the `ose-oauth-proxy` sidecar. The proxy injects user identity via headers:

| Header | Description |
|---|---|
| `X-Forwarded-User` | OpenShift username |
| `X-Forwarded-Email` | User email address |
| `X-Forwarded-Access-Token` | OAuth access token (not used for K8s API) |

All Kubernetes API calls use the pod's **ServiceAccount token**, not the user's OAuth token.

## Health Endpoint

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/healthz` | GET | No (skipped by proxy) | Liveness/readiness probe |

## User Endpoint

| Endpoint | Method | Description |
|---|---|---|
| `/api/user` | GET | Returns authenticated user info from forwarded headers |

## Entity Endpoints

All entity endpoints proxy to `apis/hybridsovereign.redhat/v1alpha1/namespaces/sovereign-cloud/entities`.

| Endpoint | Method | Description |
|---|---|---|
| `/api/entities` | GET | List all Entity CRs |
| `/api/entities/:name` | GET | Get a single Entity |
| `/api/entities` | POST | Create a new Entity |
| `/api/entities/:name` | DELETE | Delete an Entity |

### POST /api/entities

Request body:

```json
{
  "name": "acme-corp",
  "spec": {
    "description": "ACME Corporation tenant",
    "billingID": "BILL-ACME-001",
    "websiteLink": "https://acme-corp.example.com"
  }
}
```

### Input Validation (server-side)

| Field | Rules |
|---|---|
| `name` | Required, lowercase alphanumeric + hyphens, max 253 chars |
| `billingID` | Required, alphanumeric + `._-`, max 63 chars |
| `description` | Required, string |
| `websiteLink` | Optional, string |

### Response Format

Returns Kubernetes API responses directly. Each Entity object includes `metadata`, `spec`, and `status` fields.

### Error Responses

| Code | Meaning |
|---|---|
| 400 | Validation error (invalid name, missing fields) |
| 401 | Not authenticated (proxy will redirect before this) |
| 403 | Forbidden (insufficient RBAC) |
| 409 | Conflict (Entity already exists) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
