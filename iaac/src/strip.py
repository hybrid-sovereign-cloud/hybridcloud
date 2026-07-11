"""Strip CR fields for Gitea sync."""

from typing import Any


def strip_cr(obj: dict[str, Any]) -> dict[str, Any]:
    metadata = obj.get("metadata", {})
    stripped_meta: dict[str, Any] = {}
    for key in ("name", "namespace", "labels"):
        if metadata.get(key):
            stripped_meta[key] = metadata[key]

    result: dict[str, Any] = {
        "apiVersion": obj.get("apiVersion"),
        "kind": obj.get("kind"),
        "metadata": stripped_meta,
        "spec": obj.get("spec") or {},
    }
    return result


def entity_from_namespace(namespace: str) -> str:
    if namespace == "sovereign-cloud-plugins":
        return namespace
    if namespace.startswith("entity-"):
        return namespace.removeprefix("entity-")
    return namespace


def gitea_path(entity: str, kind: str, name: str) -> str:
    return f"{entity}/{kind}/{name}.yaml"
