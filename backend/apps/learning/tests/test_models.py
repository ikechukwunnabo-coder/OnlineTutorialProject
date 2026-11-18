from __future__ import annotations

import pytest
from django.db import IntegrityError, transaction

from apps.accounts.tests.factories import UserFactory
from apps.catalog.tests.factories import ChapterFactory
from apps.learning.models import Bookmark, UserProgress


@pytest.mark.django_db
def test_bookmark_is_unique_per_user_and_chapter():
    user = UserFactory()
    chapter = ChapterFactory()
    Bookmark.objects.create(user=user, chapter=chapter)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            Bookmark.objects.create(user=user, chapter=chapter)


@pytest.mark.django_db
def test_progress_is_unique_per_user_and_chapter():
    user = UserFactory()
    chapter = ChapterFactory()
    UserProgress.objects.create(user=user, chapter=chapter)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            UserProgress.objects.create(user=user, chapter=chapter)


@pytest.mark.django_db
def test_progress_position_is_limited_to_100():
    user = UserFactory()
    chapter = ChapterFactory()
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            UserProgress.objects.create(user=user, chapter=chapter, reading_position=101)


@pytest.mark.django_db
def test_completing_progress_sets_timestamp_and_uncompleting_clears_it():
    user = UserFactory()
    chapter = ChapterFactory()
    progress = UserProgress.objects.create(user=user, chapter=chapter, completed=True)
    assert progress.completed_at is not None

    progress.completed = False
    progress.save()
    assert progress.completed_at is None
