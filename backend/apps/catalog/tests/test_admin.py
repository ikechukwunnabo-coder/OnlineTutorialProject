from __future__ import annotations

import pytest
from django.contrib import admin
from django.test import RequestFactory

from apps.accounts.tests.factories import AdminFactory, EditorFactory, UserFactory
from apps.catalog.admin import CategoryAdmin, TagAdmin, TutorialAdmin
from apps.catalog.models import Category, Tag, Tutorial
from apps.catalog.tests.factories import CategoryFactory, TagFactory, TutorialFactory


def _request(user):
    request = RequestFactory().get("/admin/")
    request.user = user
    return request


@pytest.mark.django_db
def test_editor_can_change_but_not_delete_content():
    editor = EditorFactory()
    category = CategoryFactory()
    model_admin = CategoryAdmin(Category, admin.site)
    request = _request(editor)

    assert model_admin.has_change_permission(request, category) is True
    assert model_admin.has_delete_permission(request, category) is False


@pytest.mark.django_db
def test_admin_can_delete_content():
    user = AdminFactory()
    category = CategoryFactory()
    model_admin = CategoryAdmin(Category, admin.site)
    request = _request(user)

    assert model_admin.has_delete_permission(request, category) is True


@pytest.mark.django_db
def test_learner_cannot_access_content_admin():
    learner = UserFactory()
    model_admin = CategoryAdmin(Category, admin.site)
    request = _request(learner)

    assert model_admin.has_module_permission(request) is False
    assert model_admin.has_view_permission(request) is False


@pytest.mark.django_db
def test_editor_cannot_edit_publication_fields():
    editor = EditorFactory()
    tutorial = TutorialFactory()
    model_admin = TutorialAdmin(Tutorial, admin.site)
    readonly = model_admin.get_readonly_fields(_request(editor), tutorial)

    assert "status" in readonly
    assert "published_at" in readonly
    assert "is_demo" in readonly


@pytest.mark.django_db
def test_admin_can_edit_publication_fields():
    user = AdminFactory()
    tutorial = TutorialFactory()
    model_admin = TutorialAdmin(Tutorial, admin.site)
    readonly = model_admin.get_readonly_fields(_request(user), tutorial)

    assert "status" not in readonly
    assert "published_at" not in readonly


@pytest.mark.django_db
def test_tag_admin_does_not_add_unknown_readonly_fields_for_editors():
    editor = EditorFactory()
    tag = TagFactory()
    model_admin = TagAdmin(Tag, admin.site)
    readonly = model_admin.get_readonly_fields(_request(editor), tag)

    assert readonly == []


@pytest.mark.django_db
def test_admin_save_sets_published_at_for_published_content():
    user = AdminFactory()
    tutorial = TutorialFactory(estimated_reading_time=1)
    tutorial.status = "published"
    tutorial.published_at = None
    model_admin = TutorialAdmin(Tutorial, admin.site)
    request = _request(user)

    class Form:
        cleaned_data = {}

    model_admin.save_model(request, tutorial, Form(), change=True)
    tutorial.refresh_from_db()
    assert tutorial.published_at is not None
