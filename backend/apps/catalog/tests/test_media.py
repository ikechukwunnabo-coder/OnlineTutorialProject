from __future__ import annotations

import pytest
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from apps.catalog.admin import ChapterAdmin
from apps.catalog.models import Chapter, ChapterImage, VideoEmbed
from apps.catalog.tests.factories import (
    ChapterFactory,
    ChapterImageFactory,
    VideoEmbedFactory,
)
from apps.catalog.tests.test_api import make_tutorial
from apps.catalog.validators import (
    MAX_IMAGE_BYTES,
    parse_video_url,
    validate_chapter_image,
    video_embed_url,
)

PNG_DATA = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489")
JPEG_DATA = bytes.fromhex("ffd8ffe000104a4649460001")
WEBP_DATA = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBPVP8 " + b"payload"


@pytest.mark.django_db
def test_chapter_image_requires_alt_text_unless_decorative():
    chapter = ChapterFactory()
    image = ChapterImageFactory.build(chapter=chapter, alt_text="", decorative=False)

    with pytest.raises(ValidationError):
        image.full_clean()


@pytest.mark.django_db
def test_decorative_image_must_not_have_alt_text():
    chapter = ChapterFactory()
    image = ChapterImageFactory.build(chapter=chapter, alt_text="Decorative", decorative=True)

    with pytest.raises(ValidationError):
        image.full_clean()


@pytest.mark.parametrize(
    ("name", "content_type", "data"),
    [
        ("photo.jpg", "image/jpeg", JPEG_DATA),
        ("photo.png", "image/png", PNG_DATA),
        ("photo.webp", "image/webp", WEBP_DATA),
    ],
)
def test_validate_chapter_image_accepts_allowed_formats(name, content_type, data):
    validate_chapter_image(SimpleUploadedFile(name, data, content_type=content_type))


@pytest.mark.parametrize(
    ("name", "content_type", "data"),
    [
        ("photo.gif", "image/gif", PNG_DATA),
        ("photo.svg", "image/svg+xml", PNG_DATA),
        ("photo.png", "text/html", PNG_DATA),
        ("photo.png", "image/png", b"not an image"),
        ("photo.png", "image/png", PNG_DATA + b"x" * (MAX_IMAGE_BYTES + 1)),
    ],
)
def test_validate_chapter_image_rejects_unsafe_uploads(name, content_type, data):
    with pytest.raises(ValidationError):
        validate_chapter_image(SimpleUploadedFile(name, data, content_type=content_type))


@pytest.mark.parametrize(
    ("url", "provider", "video_id"),
    [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ", "youtube", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/embed/dQw4w9WgXcQ", "youtube", "dQw4w9WgXcQ"),
        ("https://vimeo.com/123456789", "vimeo", "123456789"),
        ("https://vimeo.com/123456789/sample", "vimeo", "123456789"),
        ("https://player.vimeo.com/video/123456789", "vimeo", "123456789"),
    ],
)
def test_parse_video_url_accepts_allowlisted_sources(url, provider, video_id):
    assert parse_video_url(url) == (provider, video_id)


@pytest.mark.parametrize(
    "url",
    [
        "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://evil.example/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=short",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10",
        "https://www.youtube.com/results?search_query=django",
        "https://vimeo.com/abc",
        "<iframe src='https://evil.example'></iframe>",
    ],
)
def test_parse_video_url_rejects_arbitrary_or_malformed_sources(url):
    with pytest.raises(ValidationError):
        parse_video_url(url)


@pytest.mark.django_db
def test_video_embed_stores_only_parsed_provider_and_id():
    embed = VideoEmbedFactory(source_url="https://vimeo.com/123456789/sample")

    assert embed.provider == "vimeo"
    assert embed.video_id == "123456789"
    assert embed.embed_url == "https://player.vimeo.com/video/123456789"


def test_video_embed_url_rejects_unknown_provider():
    with pytest.raises(ValidationError):
        video_embed_url("evil", "123")


@pytest.mark.django_db
def test_chapter_detail_exposes_validated_media(client):
    tutorial, first, _ = make_tutorial()
    image = ChapterImageFactory(chapter=first, alt_text="A labelled diagram", order=1)
    VideoEmbedFactory(chapter=first)

    response = client.get(reverse("chapter-detail", args=[tutorial.slug, first.slug]))

    assert response.status_code == 200
    body = response.json()
    assert body["images"] == [
        {
            "url": image.image.url,
            "alt_text": "A labelled diagram",
            "decorative": False,
            "caption": "",
            "order": 1,
        }
    ]
    assert body["video_embeds"] == [
        {
            "provider": "youtube",
            "title": "Lesson video",
            "embed_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "order": 1,
        }
    ]


def test_chapter_admin_includes_media_inlines():
    model_admin = ChapterAdmin(Chapter, admin.site)

    assert any(issubclass(inline.model, ChapterImage) for inline in model_admin.inlines)
    assert any(issubclass(inline.model, VideoEmbed) for inline in model_admin.inlines)
