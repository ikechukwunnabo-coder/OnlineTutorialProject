from __future__ import annotations

import pytest
from django.core.cache import cache
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from apps.accounts.tests.factories import VerifiedUserFactory
from apps.catalog.tests.factories import CategoryFactory, TagFactory
from apps.catalog.tests.test_api import make_tutorial
from apps.learning.models import Bookmark, UserProgress


@pytest.mark.django_db
def test_catalog_query_budgets(client):
    category = CategoryFactory()
    tag = TagFactory()
    tutorial, first, _ = make_tutorial(category=category)
    tutorial.tags.add(tag)
    user = VerifiedUserFactory()
    Bookmark.objects.create(user=user, chapter=first)
    UserProgress.objects.create(user=user, chapter=first, completed=True)

    def assert_budget(url, budget, *, authenticated=False):
        cache.clear()
        if authenticated:
            client.force_login(user)
        else:
            client.logout()
        with CaptureQueriesContext(connection) as queries:
            response = client.get(url)
        assert response.status_code == 200
        assert len(queries) <= budget, (url, len(queries), budget)

    assert_budget(reverse("home"), 6)
    assert_budget(reverse("categories"), 3)
    assert_budget(reverse("category-detail", args=[category.slug]), 4)
    assert_budget(reverse("tutorials"), 4)
    assert_budget(reverse("tutorial-detail", args=[tutorial.slug]), 6)
    assert_budget(reverse("tutorial-detail", args=[tutorial.slug]), 6, authenticated=True)
    assert_budget(reverse("chapter-detail", args=[tutorial.slug, first.slug]), 9)
    assert_budget(
        reverse("chapter-detail", args=[tutorial.slug, first.slug]),
        9,
        authenticated=True,
    )
    assert_budget(reverse("tags"), 3)


@pytest.mark.django_db
def test_learning_query_budgets(client):
    _, first, _ = make_tutorial()
    user = VerifiedUserFactory()
    Bookmark.objects.create(user=user, chapter=first)
    UserProgress.objects.create(user=user, chapter=first, completed=True)
    cache.clear()
    client.force_login(user)

    for url, budget in ((reverse("bookmarks"), 3), (reverse("progress"), 4)):
        with CaptureQueriesContext(connection) as queries:
            response = client.get(url)
        assert response.status_code == 200
        assert len(queries) <= budget, (url, len(queries), budget)
