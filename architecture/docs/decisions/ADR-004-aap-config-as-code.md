# ADR-004: AAP Configuration as Code

**Status**: Accepted  
**Date**: 2026-07-11  
**Deciders**: Platform architecture team

---

## Context

AAP Controller and EDA configuration was previously managed by imperative Ansible roles deployed as one-off Jobs:

- `bootstrap/ansible/roles/aap-controller-config/` — job templates, projects, credentials
- `bootstrap/ansible/roles/eda-config/` — decision environments, rulebook activations, event streams

These roles mixed configuration data with execution logic, were difficult to diff in code review, and duplicated structure between controller and EDA domains. Changes required editing embedded YAML inside Ansible task files.

Credentials (AAP admin password, EDA tokens, controller host URLs) were passed via environment variables at Job runtime from Vault — but the configuration shape itself was not version-controlled in a reviewable format.

---

## Decision

Adopt the `infra.aap_configuration` Ansible collection with declarative YAML inventories in `hybridcloud/aap-config/`:

```
hybridcloud/aap-config/
├── playbook.yml                    # Single entrypoint
├── requirements.yml                # Collection dependencies
├── controller/
│   ├── organizations.yml
│   ├── credentials.yml             # Structure only — secrets from Vault env vars
│   ├── projects.yml
│   ├── job_templates.yml
│   └── inventories.yml
└── eda/
    ├── credentials.yml
    ├── decision_environments.yml
    ├── event_streams.yml
    └── rulebook_activations.yml    # 34 activations (create + delete per kind)
```

### Execution

A sovereign Job in `sovereign-cloud-jobs` (central cluster) runs `playbook.yml` after AAP license Jobs complete. Environment variables provide runtime credentials:

| Variable | Source |
|----------|--------|
| `AAP_CONTROLLER_HOST` | Vault / bootstrap env |
| `AAP_ADMIN_PASSWORD` | Vault (never in `aap-config/`) |
| `EDA_CONTROLLER_HOST` | Vault / bootstrap env |
| `EDA_ADMIN_PASSWORD` | Vault (never in `aap-config/`) |

`aap_configuration_secure_logging: true` prevents credential leakage in Job logs.

### Relationship to EDA rulebooks

- **Configuration** (activations, DEs, event streams): `hybridcloud/aap-config/eda/`
- **Automation logic** (Ansible roles): `hybridcloud/eda/<domain>/`
- **Rulebook YAML**: `hybridcloud/eda/<domain>/rulebooks/`

The AAP config Job registers activations pointing to rulebooks in the `sovereign-eda-rulebooks` Gitea project. Rulebook content is synced from the monorepo, not embedded in the config YAML.

---

## Consequences

### Positive

- Configuration changes are Git-diffable and reviewable in PRs
- Idempotent: re-running the Job converges AAP/EDA to declared state
- Separates "what to configure" from "how to configure" (playbook logic)
- 34 rulebook activations declared in one file instead of scattered tasks
- Aligns with monorepo: `aap-config/` + `eda/` updated in same commit

### Negative

- Requires `infra.aap_configuration` collection version pinning
- Job must re-run after every `aap-config/` change (no hot-reload)
- Credential env vars still needed at Job runtime (acceptable — not in Git)

### Neutral

- Legacy `eda-config` and `aap-controller-config` bootstrap roles are deprecated
- Bootstrap ansible role list in `bootstrap/ansible/roles/eda-config/tasks/main.yml` maps old names to new rulebook files for migration reference

---

## References

- [c4/components/event-system.md](../c4/components/event-system.md)
- Spec 026: AAP Config as Code (`hybridcloud/specs/026-aap-config-as-code/spec.md`)
- `hybridcloud/aap-config/playbook.yml`
