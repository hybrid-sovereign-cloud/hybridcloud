"""Gitea REST API client."""

from __future__ import annotations

import base64
import json
import logging
from typing import Any
from urllib.parse import quote

import requests

logger = logging.getLogger(__name__)


class GiteaClient:
    def __init__(self, base_url: str, token: str, owner: str, repo: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.owner = owner
        self.repo = repo
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"token {token}"})
        self.session.verify = False  # internal lab certs

    def _contents_url(self, path: str) -> str:
        return f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/contents/{quote(path, safe='/')}"

    def get_file(self, path: str) -> dict[str, Any] | None:
        resp = self.session.get(self._contents_url(path), timeout=30)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()

    def upsert_file(self, path: str, content: str, message: str) -> None:
        existing = self.get_file(path)
        payload = {
            "content": base64.b64encode(content.encode()).decode(),
            "message": message,
        }
        if existing:
            payload["sha"] = existing["sha"]
            resp = self.session.put(self._contents_url(path), json=payload, timeout=30)
        else:
            resp = self.session.post(self._contents_url(path), json=payload, timeout=30)
        resp.raise_for_status()

    def delete_file(self, path: str, message: str) -> None:
        existing = self.get_file(path)
        if not existing:
            return
        payload = {"sha": existing["sha"], "message": message}
        resp = self.session.delete(self._contents_url(path), json=payload, timeout=30)
        resp.raise_for_status()
