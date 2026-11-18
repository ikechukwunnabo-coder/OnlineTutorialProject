from __future__ import annotations

import base64

import factory
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from factory.django import DjangoModelFactory

from apps.accounts.tests.factories import UserFactory
from apps.catalog.models import (
    Category,
    Chapter,
    ChapterImage,
    CodeExample,
    Tag,
    Tutorial,
    VideoEmbed,
)
from apps.common.choices import PublicationStatus


class CategoryFactory(DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f"Category {n}")
    slug = factory.Sequence(lambda n: f"category-{n}")
    status = PublicationStatus.PUBLISHED
    is_demo = False


class TagFactory(DjangoModelFactory):
    class Meta:
        model = Tag

    name = factory.Sequence(lambda n: f"Tag {n}")
    slug = factory.Sequence(lambda n: f"tag-{n}")


class TutorialFactory(DjangoModelFactory):
    class Meta:
        model = Tutorial

    category = factory.SubFactory(CategoryFactory)
    author = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Tutorial {n}")
    slug = factory.Sequence(lambda n: f"tutorial-{n}")
    summary = "A short tutorial summary."
    difficulty = "beginner"
    status = PublicationStatus.DRAFT
    published_at = None


class ChapterFactory(DjangoModelFactory):
    class Meta:
        model = Chapter

    tutorial = factory.SubFactory(TutorialFactory)
    title = factory.Sequence(lambda n: f"Chapter {n}")
    slug = factory.Sequence(lambda n: f"chapter-{n}")
    content = "A short demo chapter body with enough words to read."
    order = factory.Sequence(lambda n: n + 1)
    status = PublicationStatus.DRAFT
    published_at = None


class PublishedTutorialFactory(TutorialFactory):
    status = PublicationStatus.PUBLISHED
    published_at = factory.LazyFunction(timezone.now)
    estimated_reading_time = 1


class PublishedChapterFactory(ChapterFactory):
    tutorial = factory.SubFactory(PublishedTutorialFactory)
    status = PublicationStatus.PUBLISHED
    published_at = factory.LazyFunction(timezone.now)


class CodeExampleFactory(DjangoModelFactory):
    class Meta:
        model = CodeExample

    chapter = factory.SubFactory(ChapterFactory)
    language = "python"
    title = "Example"
    source = "print('hello')"
    order = 1


def png_upload(name: str = "sample.png") -> SimpleUploadedFile:
    data = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9mTf8AAAAASUVORK5CYII="
    )
    return SimpleUploadedFile(name, data, content_type="image/png")


class ChapterImageFactory(DjangoModelFactory):
    class Meta:
        model = ChapterImage

    chapter = factory.SubFactory(ChapterFactory)
    image = factory.LazyFunction(png_upload)
    alt_text = "A labelled diagram"
    decorative = False
    caption = ""
    order = 1


class VideoEmbedFactory(DjangoModelFactory):
    class Meta:
        model = VideoEmbed

    chapter = factory.SubFactory(ChapterFactory)
    title = "Lesson video"
    source_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    order = 1
