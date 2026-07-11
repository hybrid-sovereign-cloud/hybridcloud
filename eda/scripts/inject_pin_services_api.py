#!/usr/bin/env python3
"""Inject pin_reachable_services_api include after Extract services cluster block."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = "pin_reachable_services_api"
EXTRACT = "Extract services cluster connection details"

PIN_RULEBOOKS = """
    - name: Pin services API host to reachable IP (skip stale DNS A records)
      ansible.builtin.include_tasks: "{{ role_path }}/../../common/tasks/pin_reachable_services_api.yml"
"""

PIN_DEFAULT = """
    - name: Pin services API host to reachable IP (skip stale DNS A records)
      ansible.builtin.include_tasks: "{{ role_path }}/../../../common/tasks/pin_reachable_services_api.yml"
"""

PATTERN = re.compile(
    r"(    - name: Extract services cluster connection details\n"
    r"(?:      .*\n)*?"
    r"      no_log: true\n)"
)


def pin_snippet(path: Path) -> str:
    if "rulebooks/roles/" in path.as_posix():
        return PIN_RULEBOOKS
    return PIN_DEFAULT


def main() -> None:
    updated = 0
    for main_yml in ROOT.rglob("tasks/main.yml"):
        text = main_yml.read_text()
        if EXTRACT not in text or MARKER in text:
            continue
        new_text, n = PATTERN.subn(r"\1" + pin_snippet(main_yml), text, count=1)
        if n:
            main_yml.write_text(new_text)
            print(f"updated {main_yml.relative_to(ROOT)}")
            updated += 1
    print(f"done: {updated} files updated")


if __name__ == "__main__":
    main()
