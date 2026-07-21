#!/usr/bin/env python3
"""Unseal central Vault (if sealed) and upload lab-config from .env via port-forward.

Does not print unseal keys or tokens. Requires oc kubeconfig with access to central-vault.
"""
from __future__ import annotations

import base64
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def oc(args: list[str], timeout: int = 90) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["oc", *args], capture_output=True, text=True, timeout=timeout
    )


def http_json(
    method: str,
    url: str,
    body: dict | None = None,
    token: str | None = None,
    timeout: int = 20,
) -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("X-Vault-Token", token)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode() or "{}"
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw[:400]}


def wait_pf(port: int, seconds: float = 20.0) -> bool:
    deadline = time.time() + seconds
    while time.time() < deadline:
        try:
            http_json("GET", f"http://127.0.0.1:{port}/v1/sys/seal-status", timeout=2)
            return True
        except urllib.error.HTTPError:
            return True
        except Exception:
            time.sleep(0.4)
    return False


def with_port_forward(target: str, local_port: int):
    class _PF:
        def __enter__(self):
            self.proc = subprocess.Popen(
                [
                    "oc",
                    "port-forward",
                    "-n",
                    "central-vault",
                    target,
                    f"{local_port}:8200",
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            if not wait_pf(local_port):
                self.proc.terminate()
                raise RuntimeError(f"port-forward to {target} did not become ready")
            return local_port

        def __exit__(self, *exc):
            self.proc.terminate()
            try:
                self.proc.wait(timeout=5)
            except Exception:
                self.proc.kill()

    return _PF()


def unseal_pod(pod: str, port: int, keys: list[str]) -> bool:
    print(f"unseal {pod}", flush=True)
    with with_port_forward(f"pod/{pod}", port) as p:
        code, st = http_json("GET", f"http://127.0.0.1:{p}/v1/sys/seal-status")
        print(
            f"  status sealed={st.get('sealed')} progress={st.get('progress')}/{st.get('t')}",
            flush=True,
        )
        if not st.get("sealed"):
            return True
        for i, key in enumerate(keys[:3]):
            code, st = http_json(
                "PUT", f"http://127.0.0.1:{p}/v1/sys/unseal", {"key": key}
            )
            print(
                f"  step {i + 1} sealed={st.get('sealed')} progress={st.get('progress')}",
                flush=True,
            )
            if not st.get("sealed"):
                return True
        return not bool(st.get("sealed"))


def main() -> int:
    if not ENV_FILE.exists():
        print(f"missing {ENV_FILE}", file=sys.stderr)
        return 1

    print("reading vault-init-secrets", flush=True)
    r = oc(
        [
            "get",
            "secret",
            "vault-init-secrets",
            "-n",
            "central-vault",
            "-o",
            "json",
            "--request-timeout=60s",
        ],
        timeout=90,
    )
    if r.returncode != 0:
        print((r.stderr or r.stdout)[-400:], file=sys.stderr)
        return 1

    data = json.loads(r.stdout)["data"]
    keys = json.loads(base64.b64decode(data["unseal_keys"]).decode())
    token = base64.b64decode(data["root_token"]).decode()
    print(f"loaded {len(keys)} unseal keys", flush=True)

    results = []
    for pod, port in (("vault-0", 18200), ("vault-1", 18201), ("vault-2", 18202)):
        try:
            results.append(unseal_pod(pod, port, keys))
        except Exception as e:
            print(f"  skip {pod}: {e}", flush=True)
            results.append(False)
    print(f"unseal ok={results}", flush=True)
    if not any(results):
        print("all vault pods still sealed", file=sys.stderr)
        return 1

    env = load_env(ENV_FILE)
    lab_keys = [
        "LAB_DOMAIN",
        "BASE_DOMAIN",
        "CENTRAL_CLUSTER_NAME",
        "SERVICES_CLUSTER_NAME",
        "APPS_SUBDOMAIN",
        "OCI_REPOSITORY_BASE",
        "CENTRAL_APPS_DOMAIN",
        "SERVICES_APPS_DOMAIN",
        "OCI_HOST",
        "DNS_FORWARDER_ZONE",
        "DNS_FORWARDER_IPS",
        "OCP_CENTRAL_SERVER",
        "OCP_SERVICES_SERVER",
        "VAULT_CENTRAL_URL",
        "VAULT_SERVICES_URL",
        "RHBK_CENTRAL_URL",
        "RHBK_SERVICES_URL",
        "GITEA_URL",
        "KAFKA_EXTERNAL_BOOTSTRAP",
        "KAFKA_BOOTSTRAP_HOST",
        "AAP_CENTRAL_GATEWAY_URL",
        "AAP_CENTRAL_CONTROLLER_URL",
        "AAP_SERVICES_GATEWAY_URL",
        "AAP_SERVICES_CONTROLLER_URL",
        "QUAY_CENTRAL_URL",
        "QUAY_SERVICES_URL",
        "ACS_CENTRAL_URL",
        "S3_ENDPOINT",
        "VMWARE_VCENTER_URL",
        "CLUSTER_BUILDS_REPO_URL",
    ]
    payload = {"data": {k.lower(): env[k] for k in lab_keys if env.get(k)}}
    print(f"writing {len(payload['data'])} keys to central/data/lab-config", flush=True)

    # Prefer active service; fall back to vault-0
    targets = ["svc/vault-active", "pod/vault-0"]
    written = False
    for target in targets:
        try:
            with with_port_forward(target, 18210) as p:
                code, out = http_json(
                    "POST",
                    f"http://127.0.0.1:{p}/v1/central/data/lab-config",
                    payload,
                    token=token,
                    timeout=30,
                )
                if code in (200, 204):
                    print(
                        f"VAULT_WRITE_OK via {target} version={out.get('data', {}).get('version')}",
                        flush=True,
                    )
                    code, got = http_json(
                        "GET",
                        f"http://127.0.0.1:{p}/v1/central/data/lab-config",
                        token=token,
                    )
                    d = got.get("data", {}).get("data", {})
                    print(
                        f"VERIFY keys={len(d)} lab_domain={d.get('lab_domain')} oci_host={d.get('oci_host')}",
                        flush=True,
                    )
                    written = True
                    break
                print(f"write via {target} failed http={code} {out}", flush=True)
        except Exception as e:
            print(f"write via {target} error: {e}", flush=True)

    if not written:
        return 1

    # Refresh ConfigMap as well
    cm_args: list[str] = []
    for k, v in payload["data"].items():
        cm_args.extend([f"--from-literal={k}={v}"])
    r = oc(
        [
            "create",
            "configmap",
            "lab-config",
            "-n",
            "openshift-gitops",
            *cm_args,
            "--dry-run=client",
            "-o",
            "yaml",
        ],
        timeout=60,
    )
    if r.returncode != 0:
        print("configmap dry-run failed", (r.stderr or "")[-200:], file=sys.stderr)
        return 1
    apply = subprocess.run(
        ["oc", "apply", "-f", "-"],
        input=r.stdout,
        capture_output=True,
        text=True,
        timeout=60,
    )
    print(apply.stdout.strip() or apply.stderr.strip(), flush=True)
    print("DONE", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
