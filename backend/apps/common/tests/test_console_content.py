from __future__ import annotations

import json

import pytest
from django.urls import reverse

from apps.accounts.tests.factories import AdminFactory, EditorFactory, UserFactory
from apps.catalog.tests.factories import CategoryFactory, PublishedChapterFactory, TutorialFactory
from apps.common.models import AdministrativeAuditLog


def post_json(client, name: str, payload: dict):
    return client.post(reverse(name), data=json.dumps(payload), content_type="application/json")


def patch_json(client, name: str, pk: int, payload: dict):
    return client.patch(
        reverse(name, args=[pk]), data=json.dumps(payload), content_type="application/json"
    )


@pytest.mark.django_db
def test_console_content_list_requires_console_access(client):
    assert client.get(reverse("console-categories")).status_code == 401

    client.force_login(UserFactory())
    assert client.get(reverse("console-categories")).status_code == 403

    client.force_login(UserFactory(role="moderator", is_staff=True))
    assert client.get(reverse("console-categories")).status_code == 200


@pytest.mark.django_db
def test_moderator_cannot_change_content(client):
    client.force_login(UserFactory(role="moderator", is_staff=True))

    response = post_json(client, "console-categories", {"name": "Systems"})

    assert response.status_code == 403


@pytest.mark.django_db
def test_editor_creates_category_with_generated_slug_and_audit(client):
    editor = EditorFactory()
    client.force_login(editor)

    response = post_json(
        client,
        "console-categories",
        {"name": "Data Systems", "description": "Storage and databases", "display_order": 4},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["slug"] == "data-systems"
    assert body["status"] == "draft"
    assert AdministrativeAuditLog.objects.filter(
        actor=editor, action="create", model_label="catalog.category", object_id=str(body["id"])
    ).exists()


@pytest.mark.django_db
def test_editor_cannot_publish_or_delete_without_admin_rights(client):
    category = CategoryFactory(status="draft")
    client.force_login(EditorFactory())

    response = patch_json(client, "console-category-detail", category.pk, {"status": "published"})
    assert response.status_code == 200
    category.refresh_from_db()
    assert category.status == "draft"

    assert client.delete(reverse("console-category-detail", args=[category.pk])).status_code == 403

    client.force_login(AdminFactory())
    response = patch_json(client, "console-category-detail", category.pk, {"status": "published"})
    assert response.status_code == 200
    category.refresh_from_db()
    assert category.status == "published"


@pytest.mark.django_db
def test_tutorial_create_assigns_author_and_rejects_early_publication(client):
    editor = EditorFactory()
    category = CategoryFactory()
    client.force_login(editor)

    response = post_json(
        client,
        "console-tutorials",
        {
            "category": category.pk,
            "title": "Working With Git",
            "summary": "A practical introduction to version control.",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["slug"] == "working-with-git"
    assert body["author"]["id"] == editor.pk
    assert body["status"] == "draft"

    client.force_login(AdminFactory())
    response = patch_json(client, "console-tutorial-detail", body["id"], {"status": "published"})
    assert response.status_code == 400
    assert "status" in response.json()["error"]["details"]


@pytest.mark.django_db
def test_admin_publishes_tutorial_with_published_chapter(client):
    tutorial = TutorialFactory()
    PublishedChapterFactory(tutorial=tutorial)
    client.force_login(AdminFactory())

    response = patch_json(client, "console-tutorial-detail", tutorial.pk, {"status": "published"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "published"
    assert body["published_at"] is not None
    assert body["estimated_reading_time"] >= 1


@pytest.mark.django_db
def test_chapter_create_sets_reading_time_and_rejects_duplicate_order(client):
    tutorial = TutorialFactory()
    client.force_login(EditorFactory())

    response = post_json(
        client,
        "console-chapters",
        {
            "tutorial": tutorial.pk,
            "title": "Opening A Connection",
            "summary": "Connect to the database.",
            "content": "A short lesson body.",
            "order": 1,
        },
    )

    assert response.status_code == 201, response.json()
    body = response.json()
    assert body["slug"] == "opening-a-connection"
    assert body["estimated_reading_time"] == 1

    duplicate = post_json(
        client,
        "console-chapters",
        {"tutorial": tutorial.pk, "title": "Second Lesson", "content": "More content", "order": 1},
    )
    assert duplicate.status_code == 400


@pytest.mark.django_db
def test_admin_cannot_delete_last_published_chapter_of_live_tutorial(client):
    chapter = PublishedChapterFactory()
    client.force_login(AdminFactory())

    response = client.delete(reverse("console-chapter-detail", args=[chapter.pk]))

    assert response.status_code == 400
    assert chapter.__class__.objects.filter(pk=chapter.pk).exists()


@pytest.mark.django_db
def test_admin_can_delete_draft_category(client):
    category = CategoryFactory()
    admin = AdminFactory()
    client.force_login(admin)

    response = client.delete(reverse("console-category-detail", args=[category.pk]))

    assert response.status_code == 204
    assert AdministrativeAuditLog.objects.filter(
        actor=admin, action="delete", model_label="catalog.category", object_id=str(category.pk)
    ).exists()
