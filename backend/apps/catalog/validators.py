from __future__ import annotations

import re
from pathlib import PurePosixPath
from typing import Any
from urllib.parse import parse_qs, urlparse

from django.core.exceptions import ValidationError

MAX_IMAGE_BYTES = 2 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

_YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"}
_VIMEO_HOSTS = {"vimeo.com", "www.vimeo.com", "player.vimeo.com"}
_YOUTUBE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
_VIMEO_ID_RE = re.compile(r"^\d{1,12}$")


def validate_chapter_image(value: Any) -> None:
    if not value:
        raise ValidationError("An image file is required.")

    name = getattr(value, "name", "") or ""
    extension = PurePosixPath(name).suffix.lower().lstrip(".")
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError("Only JPEG, PNG, and WebP images are allowed.")

    content_type = (getattr(value, "content_type", "") or "").split(";")[0].lower()
    if content_type and content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValidationError("The image content type is not allowed.")

    size = getattr(value, "size", None)
    if size is not None and size > MAX_IMAGE_BYTES:
        raise ValidationError("Images must be 2 MB or smaller.")

    position = value.tell() if hasattr(value, "tell") else None
    try:
        if hasattr(value, "open") and callable(value.open):
            value.open("rb")
        elif hasattr(value, "seek"):
            value.seek(0)
        header = value.read(16)
    except OSError, ValueError:
        raise ValidationError("The image could not be read.") from None
    finally:
        if position is not None and hasattr(value, "seek"):
            value.seek(position)

    if not _has_image_signature(header, extension):
        raise ValidationError("The image contents do not match its file extension.")


def _has_image_signature(header: bytes, extension: str) -> bool:
    if extension in {"jpg", "jpeg"}:
        return header.startswith(b"\xff\xd8\xff")
    if extension == "png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    if extension == "webp":
        return len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP"
    return False


def parse_video_url(url: str) -> tuple[str, str]:
    try:
        parsed = urlparse(str(url or "").strip())
    except ValueError:
        raise ValidationError("Enter a valid video URL.") from None

    if parsed.scheme != "https" or not parsed.netloc:
        raise ValidationError("Video URLs must use HTTPS.")
    if parsed.username or parsed.password or parsed.port or parsed.fragment:
        raise ValidationError("Video URLs must not include credentials, ports, or fragments.")

    host = (parsed.hostname or "").lower().rstrip(".")
    path = parsed.path.rstrip("/") or "/"
    query = parse_qs(parsed.query, keep_blank_values=True)

    if host in _YOUTUBE_HOSTS:
        if host == "youtu.be":
            if query:
                raise ValidationError("Short YouTube URLs must not include query parameters.")
            video_id = path.lstrip("/")
        elif path == "/watch":
            if set(query) != {"v"} or len(query["v"]) != 1:
                raise ValidationError("Use a YouTube watch URL with a single video ID.")
            video_id = query["v"][0]
        elif path.startswith("/embed/"):
            if query:
                raise ValidationError("YouTube embed URLs must not include query parameters.")
            video_id = path.removeprefix("/embed/")
        else:
            raise ValidationError("Only standard YouTube video URLs are allowed.")
        if not _YOUTUBE_ID_RE.fullmatch(video_id):
            raise ValidationError("The YouTube video ID is invalid.")
        return "youtube", video_id

    if host in _VIMEO_HOSTS:
        parts = [part for part in path.split("/") if part]
        if host == "player.vimeo.com":
            if len(parts) != 2 or parts[0] != "video":
                raise ValidationError("Use a standard Vimeo player URL.")
            video_id = parts[1]
        else:
            if len(parts) not in (1, 2):
                raise ValidationError("Use a standard Vimeo video URL.")
            video_id = parts[0]
        if query or not _VIMEO_ID_RE.fullmatch(video_id):
            raise ValidationError("The Vimeo video ID is invalid.")
        return "vimeo", video_id

    raise ValidationError("Only YouTube and Vimeo video URLs are allowed.")


def video_embed_url(provider: str, video_id: str) -> str:
    if provider == "youtube":
        return f"https://www.youtube.com/embed/{video_id}"
    if provider == "vimeo":
        return f"https://player.vimeo.com/video/{video_id}"
    raise ValidationError("The video provider is not allowed.")
