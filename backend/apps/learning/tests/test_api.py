from __future__ import annotations

import json

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.tests.factories import UserFactory, VerifiedUserFactory
from apps.catalog.tests.factories import PublishedChapterFactory
from apps.catalog.tests.test_api import make_tutorial
from apps.learning.models import Bookmark, UserProgress


def post_json(client, url, data):
    return client.post(url, data=json.dumps(data), content_type="application/json")


def put_json(client, url, data):
    return client.put(url, data=json.dumps(data), content_type="application/json")


@pytest.mark.django_db
def test_bookmarks_require_authentication(client):
    response = client.get(reverse("bookmarks"))
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "authentication_required"


@pytest.mark.django_db
def test_bookmarks_require_verified_email(client):
    client.force_login(UserFactory())
    response = client.get(reverse("bookmarks"))
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "email_not_verified"


@pytest.mark.django_db
def test_bookmark_create_is_idempotent(client):
    user = VerifiedUserFactory()
    _, chapter, _ = make_tutorial()
    client.force_login(user)

    response = post_json(client, reverse("bookmarks"), {"chapter": chapter.pk})
    assert response.status_code == 201
    assert response.json()["chapter"]["id"] == chapter.pk

    response = post_json(client, reverse("bookmarks"), {"chapter": chapter.pk})
    assert response.status_code == 200
    assert Bookmark.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_bookmark_create_rejects_unpublished_chapter(client):
    user = VerifiedUserFactory()
    chapter = PublishedChapterFactory(status="draft", published_at=None)
    client.force_login(user)

    response = post_json(client, reverse("bookmarks"), {"chapter": chapter.pk})

    assert response.status_code == 404


@pytest.mark.django_db
def test_bookmark_list_and_delete(client):
    user = VerifiedUserFactory()
    _, chapter, _ = make_tutorial()
    Bookmark.objects.create(user=user, chapter=chapter)
    client.force_login(user)

    response = client.get(reverse("bookmarks"))
    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert response.json()["results"][0]["chapter"]["id"] == chapter.pk

    response = client.delete(reverse("bookmark-detail", args=[chapter.pk]))
    assert response.status_code == 204
    assert not Bookmark.objects.filter(user=user).exists()

    response = client.delete(reverse("bookmark-detail", args=[chapter.pk]))
    assert response.status_code == 204


@pytest.mark.django_db
def test_progress_summary_and_upsert(client):
    user = VerifiedUserFactory()
    tutorial, first, second = make_tutorial()
    client.force_login(user)

    response = client.get(reverse("progress"))
    assert response.status_code == 200
    assert response.json()["overall"] == {
        "completed_chapters": 0,
        "started_tutorials": 0,
        "percent_complete": 0,
    }

    response = put_json(
        client,
        reverse("progress-detail", args=[first.pk]),
        {"completed": True, "reading_position": 80},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["completed"] is True
    assert body["reading_position"] == 80
    assert body["completed_at"] is not None

    response = client.get(reverse("progress"))
    body = response.json()
    assert body["overall"] == {
        "completed_chapters": 1,
        "started_tutorials": 1,
        "percent_complete": 50,
    }
    assert body["tutorials"][0]["tutorial"]["slug"] == tutorial.slug
    assert body["tutorials"][0]["completed_chapters"] == 1
    assert body["tutorials"][0]["total_chapters"] == 2
    assert body["tutorials"][0]["percent"] == 50

    response = put_json(
        client,
        reverse("progress-detail", args=[first.pk]),
        {"reading_position": 20},
    )
    assert response.status_code == 200
    assert response.json()["completed"] is True
    assert response.json()["reading_position"] == 20

    response = put_json(
        client,
        reverse("progress-detail", args=[second.pk]),
        {"completed": False},
    )
    assert response.status_code == 200
    assert response.json()["completed_at"] is None


@pytest.mark.django_db
def test_progress_requires_at_least_one_field(client):
    user = VerifiedUserFactory()
    _, chapter, _ = make_tutorial()
    client.force_login(user)

    response = put_json(client, reverse("progress-detail", args=[chapter.pk]), {})

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


@pytest.mark.django_db
def test_progress_rejects_invalid_position(client):
    user = VerifiedUserFactory()
    _, chapter, _ = make_tutorial()
    client.force_login(user)

    response = put_json(
        client,
        reverse("progress-detail", args=[chapter.pk]),
        {"reading_position": 101},
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_progress_rejects_unknown_chapter(client):
    user = VerifiedUserFactory()
    client.force_login(user)

    response = put_json(client, reverse("progress-detail", args=[999999]), {"completed": True})

    assert response.status_code == 404


@pytest.mark.django_db
def test_completed_timestamp_is_kept_on_repeat(client):
    user = VerifiedUserFactory()
    _, chapter, _ = make_tutorial()
    progress = UserProgress.objects.create(user=user, chapter=chapter, completed=True)
    completed_at = progress.completed_at
    assert completed_at is not None
    client.force_login(user)

    response = put_json(
        client,
        reverse("progress-detail", args=[chapter.pk]),
        {"completed": True},
    )

    assert response.status_code == 200
    progress.refresh_from_db()
    assert progress.completed_at == completed_at
    assert progress.completed_at <= timezone.now()
