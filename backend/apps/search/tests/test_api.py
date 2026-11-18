from __future__ import annotations

import pytest
from django.urls import reverse

from apps.catalog.tests.factories import (
    CategoryFactory,
    PublishedTutorialFactory,
    TutorialFactory,
)
from apps.catalog.tests.test_api import make_tutorial


@pytest.mark.django_db
def test_search_requires_a_valid_query(client):
    response = client.get(reverse("search"), {"q": "h"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "search_query_invalid"

    response = client.get(reverse("search"))
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "search_query_invalid"


@pytest.mark.django_db
def test_search_returns_matching_published_content(client):
    category = CategoryFactory(
        name="Web Development",
        slug="web-development",
        description="Learn HTML and CSS.",
    )
    tutorial, chapter, _ = make_tutorial(category=category)
    TutorialFactory(
        title="HTML draft",
        slug="html-draft",
        category=category,
        summary="Draft HTML",
    )

    response = client.get(reverse("search"), {"q": "HTML"})

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 3
    assert {item["type"] for item in body["results"]} == {"category", "tutorial", "chapter"}
    assert all(item["url"] for item in body["results"])
    assert any("<mark>HTML</mark>" in item["excerpt"] for item in body["results"])
    assert response["Cache-Control"] == "no-store"


@pytest.mark.django_db
def test_search_can_filter_to_chapters(client):
    make_tutorial()

    response = client.get(reverse("search"), {"q": "HTML", "type": "chapters"})

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["type"] == "chapter"
    assert body["results"][0]["tutorial"]["slug"] == "html-basics"


@pytest.mark.django_db
def test_search_rejects_unknown_type(client):
    response = client.get(reverse("search"), {"q": "HTML", "type": "videos"})

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


@pytest.mark.django_db
def test_search_suggestions_return_prefix_matches(client):
    PublishedTutorialFactory(title="HTML Basics", slug="html-basics")
    PublishedTutorialFactory(title="CSS Basics", slug="css-basics")

    response = client.get(reverse("search-suggestions"), {"q": "HT"})

    assert response.status_code == 200
    assert response.json()["suggestions"] == [
        {
            "title": "HTML Basics",
            "url": "/tutorials/html-basics",
            "type": "tutorial",
        }
    ]


@pytest.mark.django_db
def test_search_excludes_demo_content(client):
    PublishedTutorialFactory(title="HTML demo", slug="html-demo", is_demo=True)

    response = client.get(reverse("search"), {"q": "HTML"})

    assert response.status_code == 200
    assert response.json()["count"] == 0


@pytest.mark.django_db
def test_search_query_budget(client, django_assert_num_queries):
    make_tutorial()
    with django_assert_num_queries(3):
        response = client.get(reverse("search"), {"q": "HTML"})
    assert response.status_code == 200


@pytest.mark.django_db
def test_search_suggestion_query_budget(client, django_assert_num_queries):
    make_tutorial()
    with django_assert_num_queries(3):
        response = client.get(reverse("search-suggestions"), {"q": "HT"})
    assert response.status_code == 200
