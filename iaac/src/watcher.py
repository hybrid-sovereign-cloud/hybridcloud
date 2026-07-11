"""Lightweight CR change polling."""

from __future__ import annotations

import logging
import time

from config import Settings

logger = logging.getLogger(__name__)


class CRWatcher:
    def __init__(self, settings: Settings, on_change) -> None:
        self.settings = settings
        self.on_change = on_change
        self._last_poll = 0.0
        self._poll_interval = 30

    def poll_once(self) -> None:
        now = time.time()
        if now - self._last_poll < self._poll_interval:
            return
        self._last_poll = now
        logger.debug("poll triggered full sync")
        self.on_change()
