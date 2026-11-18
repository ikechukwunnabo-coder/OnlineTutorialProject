from __future__ import annotations

import pytest
from django.urls import reverse

from apps.accounts.tests.factories import AdminFactory, EditorFactory, UserFactory
from apps.catalog.tests.factories import (
    CategoryFactory,
    PublishedChapterFactory,
    PublishedTutorialFactory,
)
from apps.common.models import AdministrativeAuditLog
from apps.contact.models import ContactMessage


@pytest.mark.django_db
def test_console_overview_requires_authentication(client):
    response = client.get(reverse("admin-overview"))
    assert response.status_code == 401


@pytest.mark.django_db
def test_console_overview_rejects_learners(client):
    client.force_login(UserFactory())
    response = client.get(reverse("admin-overview"))
    assert response.status_code == 403


@pytest.mark.django_db
def test_console_overview_allows_unverified_admin(client):
    admin = AdminFactory(email_verified_at=None)
    client.force_login(admin)
    response = client.get(reverse("admin-overview"))
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


@pytest.mark.django_db
def test_console_overview_allows_editors(client):
    client.force_login(EditorFactory())
    response = client.get(reverse("admin-overview"))
    assert response.status_code == 200


@pytest.mark.django_db
def test_console_overview_reports_counts_and_activity(client):
    admin = AdminFactory()
    category = CategoryFactory()
    tutorial = PublishedTutorialFactory(category=category, author=admin)
    PublishedChapterFactory(tutorial=tutorial, is_demo=True)
    ContactMessage.objects.create(
        name="Visitor",
        email="visitor@example.com",
        subject="Question",
        message="How do I start?",
    )
    AdministrativeAuditLog.objects.create(
        actor=admin,
        action="changed",
        model_label="catalog.Tutorial",
        object_id=str(tutorial.pk),
        changes={"title": {"before": "Old", "after": tutorial.title}},
    )
    client.force_login(admin)

    response = client.get(reverse("admin-overview"))
    body = response.json()

    assert response.status_code == 200
    assert body["counts"]["categories"] == 1
    assert body["counts"]["tutorials"] == 1
    assert body["counts"]["chapters"] == 1
    assert body["counts"]["users"] == 1
    assert body["counts"]["contact_messages"] == 1
    assert body["counts"]["published"] == 3
    assert body["counts"]["demo_content"] == 1
    assert {row["status"] for row in body["content_by_status"]} == {
        "draft",
        "published",
        "archived",
    }
    assert len(body["recent_content"]) == 2
    assert body["recent_activity"][0]["actor"] == admin.email
    assert body["recent_activity"][0]["model_label"] == "catalog.Tutorial"
    assert response["Cache-Control"] == "no-store"
