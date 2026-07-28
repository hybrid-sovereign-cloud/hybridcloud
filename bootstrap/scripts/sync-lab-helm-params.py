#!/usr/bin/env python3
"""Patch ApplicationSet / sovereign-central-apps with lab helm.parameters from env."""
from __future__ import annotations

import json
import os
import subprocess
import sys


def main() -> int:
    params = [
        ("servicesCluster.server", os.environ.get("OCP_SERVICES_SERVER", "")),
        ("oci.registry", os.environ.get("OCI_HOST", "")),
        ("oci.repositoryBase", os.environ.get("OCI_REPOSITORY_BASE") or "hybrid-sovereign"),
        ("lab.domain", os.environ.get("LAB_DOMAIN", "")),
        ("lab.baseDomain", os.environ.get("BASE_DOMAIN", "")),
        ("lab.centralClusterName", os.environ.get("CENTRAL_CLUSTER_NAME", "")),
        ("lab.servicesClusterName", os.environ.get("SERVICES_CLUSTER_NAME", "")),
        ("lab.centralAppsDomain", os.environ.get("CENTRAL_APPS_DOMAIN", "")),
        ("lab.servicesAppsDomain", os.environ.get("SERVICES_APPS_DOMAIN", "")),
        ("lab.dnsForwarderZone", os.environ.get("DNS_FORWARDER_ZONE", "")),
    ]
    helm_params = [{"name": n, "value": v} for n, v in params if v]
    patch = {
        "spec": {
            "template": {
                "spec": {
                    "source": {
                        "helm": {
                            "parameters": helm_params,
                        }
                    }
                }
            }
        }
    }
    subprocess.run(
        [
            "oc",
            "patch",
            "applicationset",
            "sovereign-central-appset",
            "-n",
            "openshift-gitops",
            "--type=merge",
            "-p",
            json.dumps(patch),
        ],
        check=False,
    )
    app_patch = {"spec": {"source": {"helm": {"parameters": helm_params}}}}
    subprocess.run(
        [
            "oc",
            "patch",
            "application",
            "sovereign-central-apps",
            "-n",
            "openshift-gitops",
            "--type=merge",
            "-p",
            json.dumps(app_patch),
        ],
        check=False,
    )
    print(f"Applied {len(helm_params)} lab helm.parameters")
    return 0


if __name__ == "__main__":
    sys.exit(main())
