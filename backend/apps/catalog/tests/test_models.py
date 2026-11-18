from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.catalog.models import Chapter, calculate_reading_time
from apps.catalog.tests.factories import (
    ChapterFactory,
    CodeExampleFactory,
    TutorialFactory,
)
from apps.common.choices import PublicationStatus


@pytest.mark.django_db
def test_reading_time_has_a_minimum_of_one_minute():
    assert calculate_reading_time("") == 1
    assert calculate_reading_time("short text") == 1


@pytest.mark.django_db
def test_reading_time_rounds_up_at_200_words_per_minute():
    assert calculate_reading_time("word " * 200) == 1
    assert calculate_reading_time("word " * 201) == 2
    assert calculate_reading_time("word " * 401) == 3


@pytest.mark.django_db
def test_chapter_save_computes_reading_time():
    chapter = ChapterFactory(content="word " * 400)
    chapter.refresh_from_db()
    assert chapter.estimated_reading_time == 2


@pytest.mark.django_db
def test_tutorial_reading_time_is_sum_of_chapters():
    tutorial = TutorialFactory()
    ChapterFactory(tutorial=tutorial, order=1, content="word " * 200)
    ChapterFactory(tutorial=tutorial, order=2, content="word " * 200)
    tutorial.refresh_from_db()
    assert tutorial.estimated_reading_time == 2


@pytest.mark.django_db
def test_deleting_chapter_recalculates_tutorial_reading_time():
    tutorial = TutorialFactory()
    first = ChapterFactory(tutorial=tutorial, order=1, content="word " * 200)
    ChapterFactory(tutorial=tutorial, order=2, content="word " * 200)
    tutorial.refresh_from_db()
    assert tutorial.estimated_reading_time == 2
    first.delete()
    tutorial.refresh_from_db()
    assert tutorial.estimated_reading_time == 1


@pytest.mark.django_db
def test_published_tutorial_requires_published_at():
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            TutorialFactory(
                status=PublicationStatus.PUBLISHED,
                published_at=None,
                estimated_reading_time=1,
            )


@pytest.mark.django_db
def test_published_tutorial_requires_reading_time():
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            TutorialFactory(
                status=PublicationStatus.PUBLISHED,
                published_at=timezone.now(),
                estimated_reading_time=0,
            )


@pytest.mark.django_db
def test_tutorial_slug_is_globally_unique():
    TutorialFactory(slug="same-slug")
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            TutorialFactory(slug="same-slug")


@pytest.mark.django_db
def test_chapter_slug_is_unique_per_tutorial_only():
    first = ChapterFactory(slug="introduction", order=1)
    second = ChapterFactory(slug="introduction", order=1, tutorial=TutorialFactory())
    assert first.slug == second.slug

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            ChapterFactory(tutorial=first.tutorial, slug="introduction", order=2)


@pytest.mark.django_db
def test_chapter_order_is_unique_per_tutorial():
    tutorial = TutorialFactory()
    ChapterFactory(tutorial=tutorial, order=1)
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            ChapterFactory(tutorial=tutorial, order=1, slug="other")


@pytest.mark.django_db
def test_chapter_order_must_be_positive():
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            ChapterFactory(order=0)


@pytest.mark.django_db
def test_code_example_order_is_unique_per_chapter():
    chapter = ChapterFactory()
    CodeExampleFactory(chapter=chapter, order=1)
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            CodeExampleFactory(chapter=chapter, order=1)


@pytest.mark.django_db
def test_publishing_empty_tutorial_is_rejected_by_validation():
    tutorial = TutorialFactory()
    tutorial.status = PublicationStatus.PUBLISHED
    tutorial.published_at = timezone.now()
    with pytest.raises(ValidationError):
        tutorial.full_clean()


@pytest.mark.django_db
def test_tutorial_reading_time_uses_published_chapters_when_published():
    tutorial = TutorialFactory()
    ChapterFactory(
        tutorial=tutorial,
        order=1,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
        content="word " * 200,
    )
    ChapterFactory(
        tutorial=tutorial, order=2, status=PublicationStatus.DRAFT, content="word " * 400
    )
    tutorial.refresh_from_db()
    assert tutorial.estimated_reading_time == 1


@pytest.mark.django_db
def test_tutorial_and_chapter_string_representations():
    tutorial = TutorialFactory(title="Demo: HTML")
    chapter = ChapterFactory(tutorial=tutorial, title="Demo: Intro")
    assert str(tutorial) == "Demo: HTML"
    assert str(chapter) == "Demo: HTML: Demo: Intro"
    assert isinstance(chapter, Chapter)


@pytest.mark.django_db
def test_last_published_chapter_cannot_be_unpublished_while_tutorial_is_live():
    tutorial = TutorialFactory(
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
        estimated_reading_time=1,
    )
    chapter = ChapterFactory(
        tutorial=tutorial,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    chapter.status = PublicationStatus.DRAFT
    with pytest.raises(ValidationError):
        chapter.full_clean()


@pytest.mark.django_db
def test_last_published_chapter_cannot_be_deleted_while_tutorial_is_live():
    tutorial = TutorialFactory(
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
        estimated_reading_time=1,
    )
    chapter = ChapterFactory(
        tutorial=tutorial,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    with pytest.raises(ValidationError):
        chapter.delete()
