#!/usr/bin/env python3
"""Migrate and sanitize sample CRs into hybridcloud/samples/."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
SAMPLES_OUT = ROOT / "samples"

OPERATOR_SAMPLE_DIRS = [
    ROOT.parent / "Entity/config/samples",
    ROOT.parent / "Team/config/samples",
    ROOT.parent / "Assignment/config/samples",
    ROOT.parent / "Projects/config/samples",
    ROOT.parent / "Persona/config/samples",
    ROOT.parent / "PlatformOpenshift/config/samples",
    ROOT.parent / "CloudOSO/config/samples",
    ROOT.parent / "CloudAWS/config/samples",
    ROOT.parent / "OpenStackMigration/config/samples",
    ROOT.parent / "plugin_aap/config/samples",
    ROOT.parent / "plugin_quay/config/samples",
    ROOT.parent / "plugin_rbac/config/samples",
    ROOT.parent / "plugin_vault/config/samples",
    ROOT.parent / "plugin_iaac/config/samples",
]

BOOTSTRAP_TEMPLATE_DIRS = [
    ROOT.parent / "bootstrap/samples/templates",
    ROOT / "bootstrap/samples/templates",
]

KIND_DIRS = {
    "Entity": "entity",
    "Team": "team",
    "Assignment": "assignment",
    "Project": "project",
    "Persona": "persona",
    "PlatformOpenshift": "platformopenshift",
    "CloudOSO": "cloudoso",
    "CloudAWS": "cloudaws",
    "OpenStackMigration": "openstackmigration",
    "AAPConfig": "aapconfig",
    "AAPOrg": "aaporg",
    "QuayConfig": "quayconfig",
    "QuayOrg": "quayorg",
    "RbacConfig": "rbacconfig",
    "Rbac": "rbac",
    "Vault": "vault",
    "VaultKV": "vaultkv",
    "Iaac": "iaac",
}

SANITIZE_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b\d{12}\b"), "000000000000"),  # AWS account IDs
    (re.compile(r"390403869973"), "000000000000"),
    (re.compile(r"lab\.signal9\.gg", re.I), "lab.example.com"),
    (re.compile(r"central\.lab\.signal9\.gg", re.I), "api.central.example.com"),
    (re.compile(r"services\.lab\.signal9\.gg", re.I), "api.services.example.com"),
    (re.compile(r"quay\.signal9\.gg", re.I), "quay.example.com"),
    (re.compile(r"[\w.-]+\.signal9\.gg", re.I), "lab.example.com"),
    (re.compile(r"sandbox\d+\.opentlc\.com", re.I), "sandbox.example.com"),
    (re.compile(r"[\w.-]+\.opentlc\.com", re.I), "sandbox.example.com"),
    (re.compile(r"shc_admin"), "example-admin"),
    (re.compile(r"shc_domain"), "example_domain"),
    (re.compile(r"oso/accounts/shc_admin"), "oso/accounts/example-admin"),
    (re.compile(r"aws/accounts/shc_admin"), "aws/accounts/example-admin"),
]

SENSITIVE_KEY_RE = re.compile(
    r"(password|token|secret|api[_-]?key|private[_-]?key|credential|access[_-]?key)",
    re.I,
)


def strip_helm_template(content: str) -> str | None:
    """Remove Helm template directives and return YAML body."""
    lines = []
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("{{") and stripped.endswith("}}"):
            continue
        if "{{" in line or "}}" in line:
            return None
        lines.append(line)
    body = "\n".join(lines).strip()
    return body or None


def sanitize_text(text: str) -> str:
    for pattern, replacement in SANITIZE_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def sanitize_document(doc: dict) -> dict:
    """Redact sensitive spec keys and sanitize string values."""

    def walk(obj):
        if isinstance(obj, dict):
            result = {}
            for key, value in obj.items():
                if SENSITIVE_KEY_RE.search(key) and isinstance(value, str):
                    result[key] = "REDACTED"
                else:
                    result[key] = walk(value)
            return result
        if isinstance(obj, list):
            return [walk(item) for item in obj]
        if isinstance(obj, str):
            return sanitize_text(obj)
        return obj

    return walk(doc)


def parse_yaml_documents(content: str) -> list[dict]:
    docs = []
    for doc in yaml.safe_load_all(content):
        if isinstance(doc, dict) and doc.get("kind"):
            docs.append(doc)
    return docs


def kind_dir(kind: str) -> str:
    return KIND_DIRS.get(kind, kind.lower())


def load_file(path: Path) -> list[tuple[dict, str]]:
    raw = path.read_text(encoding="utf-8")
    body = strip_helm_template(raw)
    if body is None:
        return []
    try:
        docs = parse_yaml_documents(body)
    except yaml.YAMLError:
        return []
    return [(doc, body) for doc in docs]


def collect_samples() -> dict[tuple[str, str], tuple[dict, str, str, Path]]:
    """Collect samples keyed by (kind_dir, metadata.name). Operator samples win over bootstrap."""
    collected: dict[tuple[str, str], tuple[dict, str, str, int, Path]] = {}

    def ingest(path: Path, priority: int):
        for doc, _raw in load_file(path):
            kind = doc.get("kind", "")
            name = doc.get("metadata", {}).get("name", "")
            if not kind or not name:
                continue
            key = (kind_dir(kind), name)
            existing = collected.get(key)
            if existing is None or priority > existing[3]:
                collected[key] = (doc, kind, name, priority, path)

    for sample_dir in OPERATOR_SAMPLE_DIRS:
        if not sample_dir.is_dir():
            continue
        for path in sorted(sample_dir.glob("*.yaml")):
            ingest(path, priority=2)

    for template_dir in BOOTSTRAP_TEMPLATE_DIRS:
        if not template_dir.is_dir():
            continue
        for path in sorted(template_dir.glob("*.yaml")):
            ingest(path, priority=1)

    return {
        key: (doc, kind, name, src)
        for key, (doc, kind, name, _pri, src) in collected.items()
    }


def write_sample(kind_folder: str, name: str, doc: dict, src: Path) -> Path:
    out_dir = SAMPLES_OUT / kind_folder
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{name}.yaml"

    sanitized = sanitize_document(doc)
    header = (
        f"# Sample {sanitized.get('kind', 'CR')} — {name}\n"
        f"# Source: {src.relative_to(ROOT.parent) if src.is_relative_to(ROOT.parent) else src.name}\n"
        f"# Apply manually to services cluster (NOT via ArgoCD):\n"
        f"#   oc apply -f samples/{kind_folder}/{name}.yaml --context=services-admin\n"
        f"---\n"
    )
    yaml_body = yaml.dump(
        sanitized,
        default_flow_style=False,
        sort_keys=False,
        allow_unicode=True,
    )
    out_path.write_text(header + yaml_body, encoding="utf-8")
    return out_path


def write_kustomization(written: list[Path]) -> None:
    resources = sorted(
        str(p.relative_to(SAMPLES_OUT)) for p in written
    )
    content = (
        "# Kustomization index for all sample CRs.\n"
        "# Usage: oc apply -k samples/ --context=services-admin\n"
        "apiVersion: kustomize.config.k8s.io/v1beta1\n"
        "kind: Kustomization\n"
        "resources:\n"
    )
    content += "".join(f"  - {r}\n" for r in resources)
    (SAMPLES_OUT / "kustomization.yaml").write_text(content, encoding="utf-8")


def write_readme(counts: dict[str, int], total: int) -> None:
    lines = [
        "# Sample Custom Resources",
        "",
        "Sanitized sample CRs migrated from frozen sovereign operator repos and bootstrap samples.",
        "These are intended for **manual apply** on the services cluster — they are **not** managed by ArgoCD.",
        "",
        "## Prerequisites",
        "",
        "- Hybrid Sovereign operator deployed (`sovereign-cloud`, `sovereign-cloud-plugins`)",
        "- Target entity namespace exists (e.g. `entity-acme-corp`) for namespace-scoped CRs",
        "- Vault paths referenced in samples must exist with placeholder credentials",
        "",
        "## Apply instructions",
        "",
        "### Single sample",
        "",
        "```bash",
        "oc apply -f samples/entity/acme-corp.yaml --context=services-admin",
        "```",
        "",
        "### All samples (kustomize)",
        "",
        "```bash",
        "oc apply -k samples/ --context=services-admin",
        "```",
        "",
        "### Recommended apply order",
        "",
        "1. **Entity** — creates entity namespace via primary operator",
        "2. **RbacConfig** — cluster-wide Keycloak RBAC (plugins namespace)",
        "3. **Rbac** — entity-scoped group definitions",
        "4. **Team**, **Project**, **Persona**",
        "5. **CloudOSO** / **CloudAWS** — cloud environments",
        "6. **PlatformOpenshift** — after cloud env is `status.ready`",
        "7. **Assignment** — binds teams to clusters",
        "8. Plugin CRs: **AAPConfig**, **AAPOrg**, **QuayConfig**, **QuayOrg**, **Vault**, **VaultKV**",
        "9. **OpenStackMigration**, **Iaac** (optional)",
        "",
        "## Sanitization",
        "",
        "The following were stripped or replaced in all samples:",
        "",
        "- AWS account IDs → `000000000000`",
        "- Real hostnames (`*.example.com`, `*.opentlc.com`) → `*.example.com`",
        "- Environment-specific Vault paths (`shc_admin`) → `example-admin`",
        "- Credential fields → `REDACTED`",
        "",
        "## Sample inventory",
        "",
        f"**Total samples:** {total}",
        "",
        "| Kind | Count |",
        "|------|-------|",
    ]
    for kind, count in sorted(counts.items()):
        lines.append(f"| `{kind}/` | {count} |")

    lines.extend(
        [
            "",
            "## Directory layout",
            "",
            "```",
            "samples/",
            "├── kustomization.yaml",
            "├── README.md",
            "├── entity/",
            "├── team/",
            "├── assignment/",
            "└── ...",
            "```",
            "",
        ]
    )
    (SAMPLES_OUT / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    if SAMPLES_OUT.exists():
        for path in SAMPLES_OUT.rglob("*.yaml"):
            if path.name != "kustomization.yaml":
                path.unlink()
        for path in sorted(SAMPLES_OUT.iterdir()):
            if path.is_dir():
                for f in path.iterdir():
                    f.unlink()
                path.rmdir()

    collected = collect_samples()
    written: list[Path] = []
    counts: dict[str, int] = {}

    for (kind_folder, name), (doc, _kind, _name, src) in sorted(collected.items()):
        out = write_sample(kind_folder, name, doc, src)
        written.append(out)
        counts[kind_folder] = counts.get(kind_folder, 0) + 1

    write_kustomization(written)
    write_readme(counts, len(written))

    print(f"Migrated {len(written)} samples into {SAMPLES_OUT}")
    for kind, count in sorted(counts.items()):
        print(f"  {kind}: {count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
