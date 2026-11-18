from __future__ import annotations

import json
import logging
import threading
from urllib.request import Request, urlopen

from django.conf import settings

logger = logging.getLogger(__name__)


def send_revalidation(tags: list[str], paths: list[str]) -> None:
    """Notify the Next.js frontend after catalog content changes.

    Delivery is best-effort and runs off the request thread. TTL-based ISR
    remains the fallback when the frontend is unavailable.
    """
    url = settings.REVALIDATE_URL
    secret = settings.REVALIDATE_SECRET
    if not url or not secret:
        return

    payload = json.dumps({"tags": tags, "paths": paths}).encode("utf-8")

    def deliver() -> None:
        request = Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Revalidate-Secret": secret,
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=5) as response:
                response.read()
        except Exception:
            logger.warning("Next.js revalidation webhook failed", exc_info=True)

    threading.Thread(target=deliver, daemon=True, name="next-revalidate").start()
