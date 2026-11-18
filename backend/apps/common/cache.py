from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_PREFIX = "bds:v1"
CONTENT_VERSION_KEY = f"{CACHE_PREFIX}:content_version"
HOME_KEY = f"{CACHE_PREFIX}:home"
CATEGORIES_KEY = f"{CACHE_PREFIX}:categories"
TAGS_KEY = f"{CACHE_PREFIX}:tags"
REDIRECTS_KEY = f"{CACHE_PREFIX}:redirects"


def content_version() -> int:
    try:
        value = cache.get(CONTENT_VERSION_KEY)
        if value is None:
            cache.add(CONTENT_VERSION_KEY, 1, timeout=None)
            value = cache.get(CONTENT_VERSION_KEY, 1)
        return int(value)
    except Exception:
        logger.warning("Unable to read the content cache version", exc_info=True)
        return 1


def bump_content_version() -> None:
    try:
        if cache.add(CONTENT_VERSION_KEY, 1, timeout=None):
            return
        cache.incr(CONTENT_VERSION_KEY)
    except ValueError:
        cache.set(CONTENT_VERSION_KEY, 1, timeout=None)
    except Exception:
        logger.warning("Unable to bump the content cache version", exc_info=True)


def cache_get(key: str) -> Any | None:
    try:
        return cache.get(key)
    except Exception:
        logger.warning("Cache read failed for %s", key, exc_info=True)
        return None


def cache_set(key: str, value: Any, timeout: int) -> None:
    try:
        cache.set(key, value, timeout=timeout)
    except Exception:
        logger.warning("Cache write failed for %s", key, exc_info=True)


def cache_delete(*keys: str) -> None:
    if not keys:
        return
    try:
        cache.delete_many(list(keys))
    except Exception:
        logger.warning("Cache invalidation failed for %s", keys, exc_info=True)


def list_cache_key(prefix: str, params: dict[str, Any]) -> str:
    digest = hashlib.sha256(
        json.dumps(params, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()[:20]
    return f"{CACHE_PREFIX}:{prefix}:{content_version()}:{digest}"


def category_key(slug: str) -> str:
    return f"{CACHE_PREFIX}:category:{slug}"


def tutorial_key(slug: str) -> str:
    return f"{CACHE_PREFIX}:tutorial:{slug}"


def chapter_key(tutorial_slug: str, chapter_slug: str) -> str:
    return f"{CACHE_PREFIX}:chapter:{tutorial_slug}:{chapter_slug}"
