#!/usr/bin/env python3
"""Remove duplicate Extract services cluster connection details blocks."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOCK = re.compile(
    r"\n    - name: Extract services cluster connection details\n"
    r"      ansible\.builtin\.set_fact:\n"
    r"        services_bearer_token: >-\n"
    r"          \{\{ \(argocd_cluster_secret\.resources\[0\]\.data\.config \| b64decode \| from_json\)\.bearerToken \}\}\n"
    r"        services_api_host: >-\n"
    r"          \{\{ argocd_cluster_secret\.resources\[0\]\.data\.server \| b64decode\n"
    r"             \| default\(lookup\('env', 'OCP_SERVICES_SERVER'\), true\) \}\}\n"
    r"      no_log: true\n"
)


def main() -> None:
    updated = 0
    for main_yml in ROOT.rglob("tasks/main.yml"):
        text = main_yml.read_text()
        new_text, n = BLOCK.subn("", text, count=1)
        if n:
            main_yml.write_text(new_text)
            print(f"updated {main_yml.relative_to(ROOT)}")
            updated += 1
    print(f"done: {updated} files")


if __name__ == "__main__":
    main()
