from __future__ import annotations

import pytest
from django.urls import reverse

from apps.accounts.tests.factories import UserFactory, VerifiedUserFactory
from apps.catalog.models import Chapter
from apps.catalog.tests.factories import (
    CategoryFactory,
    PublishedChapterFactory,
    PublishedTutorialFactory,
    TagFactory,
    TutorialFactory,
)
from apps.common.choices import PublicationStatus
from apps.learning.models import Bookmark, UserProgress
from apps.seo.models import SlugRedirect


def make_tutorial(*, title="HTML Basics", slug="html-basics", category=None, **kwargs):
    category = category or CategoryFactory()
    tutorial = PublishedTutorialFactory(
        title=title,
        slug=slug,
        category=category,
        summary="Learn the basics of HTML.",
        **kwargs,
    )
    first = PublishedChapterFactory(
        tutorial=tutorial,
        title="Introduction",
        slug="introduction",
        order=1,
        summary="Start here.",
        content="## What is HTML?\n\n<script>alert('x')</script>\n\nHTML is the structure of a page.",
    )
    second = PublishedChapterFactory(
        tutorial=tutorial,
        title="Your First Page",
        slug="your-first-page",
        order=2,
        summary="Build a page.",
        content="Write a paragraph.",
    )
    tutorial.refresh_from_db()
    return tutorial, first, second


@pytest.mark.django_db
def test_home_returns_published_content_and_real_stats(client):
    category = CategoryFactory(name="Web Development", slug="web-development")
    tutorial, _, _ = make_tutorial(category=category)
    TutorialFactory(
        title="Draft tutorial",
        slug="draft-tutorial",
        category=category,
        status=PublicationStatus.DRAFT,
    )
    PublishedTutorialFactory(
        title="Demo tutorial",
        slug="demo-tutorial",
        category=category,
        is_demo=True,
    )

    response = client.get(reverse("home"))

    assert response.status_code == 200
    body = response.json()
    assert body["site_name"] == "Ben Digital Solution"
    assert body["stats"] == {
        "published_tutorials": 1,
        "published_chapters": 2,
        "published_categories": 1,
    }
    assert [item["slug"] for item in body["latest_tutorials"]] == [tutorial.slug]
    assert response["Cache-Control"].startswith("public, max-age=60")


@pytest.mark.django_db
def test_categories_list_counts_only_published_tutorials(client):
    category = CategoryFactory(name="Web Development", slug="web-development")
    make_tutorial(category=category)
    TutorialFactory(category=category, status=PublicationStatus.DRAFT)

    response = client.get(reverse("categories"))

    assert response.status_code == 200
    assert response.json()[0]["tutorial_count"] == 1
    assert response["Cache-Control"].startswith("public, max-age=300")


@pytest.mark.django_db
def test_category_detail_lists_published_tutorials(client):
    category = CategoryFactory(name="Web Development", slug="web-development")
    tutorial, _, _ = make_tutorial(category=category)

    response = client.get(reverse("category-detail", args=[category.slug]))

    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == category.slug
    assert body["tutorials"][0]["slug"] == tutorial.slug
    assert body["tutorials"][0]["chapter_count"] == 2


@pytest.mark.django_db
def test_category_detail_hides_unpublished_category(client):
    category = CategoryFactory(slug="hidden", status=PublicationStatus.DRAFT)

    response = client.get(reverse("category-detail", args=[category.slug]))

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


@pytest.mark.django_db
def test_tutorial_list_filters_and_orders(client):
    category = CategoryFactory(slug="web-development")
    tag = TagFactory(name="HTML", slug="html")
    first, _, _ = make_tutorial(title="Alpha", slug="alpha", category=category)
    first.tags.add(tag)
    make_tutorial(title="Beta", slug="beta", category=category, difficulty="advanced")

    response = client.get(reverse("tutorials"), {"category": category.slug, "tag": tag.slug})
    assert response.status_code == 200
    assert [item["slug"] for item in response.json()["results"]] == ["alpha"]

    response = client.get(reverse("tutorials"), {"ordering": "title"})
    assert [item["slug"] for item in response.json()["results"]] == ["alpha", "beta"]

    response = client.get(reverse("tutorials"), {"ordering": "bogus"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"

    response = client.get(reverse("tutorials"), {"difficulty": "impossible"})
    assert response.status_code == 400


@pytest.mark.django_db
def test_tutorial_detail_includes_learner_progress(client):
    user = VerifiedUserFactory()
    tutorial, first, _ = make_tutorial()
    UserProgress.objects.create(user=user, chapter=first, completed=True)
    client.force_login(user)

    response = client.get(reverse("tutorial-detail", args=[tutorial.slug]))

    assert response.status_code == 200
    body = response.json()
    assert body["progress"] == {
        "completed_chapters": 1,
        "total_chapters": 2,
        "percent": 50,
    }
    assert response["Cache-Control"] == "private, no-store"
    assert "Cookie" in response["Vary"]


@pytest.mark.django_db
def test_tutorial_detail_returns_null_progress_for_anonymous(client):
    tutorial, _, _ = make_tutorial()

    response = client.get(reverse("tutorial-detail", args=[tutorial.slug]))

    assert response.status_code == 200
    assert response.json()["progress"] is None
    assert response["Cache-Control"].startswith("public, max-age=300")


@pytest.mark.django_db
def test_chapter_detail_renders_sanitised_content_and_learner_state(client):
    user = VerifiedUserFactory()
    tutorial, first, _ = make_tutorial()
    Bookmark.objects.create(user=user, chapter=first)
    UserProgress.objects.create(
        user=user,
        chapter=first,
        completed=True,
        reading_position=80,
    )
    client.force_login(user)

    response = client.get(reverse("chapter-detail", args=[tutorial.slug, first.slug]))

    assert response.status_code == 200
    body = response.json()
    assert "<script" not in body["content_html"]
    assert body["toc"] == [{"id": "what-is-html", "text": "What is HTML?", "level": 2}]
    assert body["navigation"]["previous"] is None
    assert body["navigation"]["next"]["url"] == f"/tutorials/{tutorial.slug}/your-first-page"
    assert body["bookmark"] == {"saved": True}
    assert body["progress"] == {"completed": True, "reading_position": 80}
    assert body["tutorial"]["chapter_count"] == 2
    assert response["Cache-Control"] == "private, no-store"


@pytest.mark.django_db
def test_chapter_detail_returns_404_for_draft_chapter(client):
    tutorial = PublishedTutorialFactory()
    draft = Chapter.objects.create(
        tutorial=tutorial,
        title="Draft",
        slug="draft",
        content="Not ready",
        order=1,
        status=PublicationStatus.DRAFT,
    )

    response = client.get(reverse("chapter-detail", args=[tutorial.slug, draft.slug]))

    assert response.status_code == 404


@pytest.mark.django_db
def test_tags_count_published_tutorials(client):
    tag = TagFactory(name="HTML", slug="html")
    tutorial, _, _ = make_tutorial()
    tutorial.tags.add(tag)
    TutorialFactory(status=PublicationStatus.DRAFT).tags.add(tag)

    response = client.get(reverse("tags"))

    assert response.status_code == 200
    assert response.json()[0]["tutorial_count"] == 1


@pytest.mark.django_db
def test_redirects_return_active_redirect(client):
    SlugRedirect.objects.create(old_path="/old", new_path="/new", status_code=301)

    response = client.get(reverse("redirects"), {"path": "/old"})

    assert response.status_code == 200
    assert response.json()["redirect"] == {
        "old_path": "/old",
        "new_path": "/new",
        "status_code": 301,
    }


@pytest.mark.django_db
def test_redirects_return_404_for_unknown_path(client):
    response = client.get(reverse("redirects"), {"path": "/missing"})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


@pytest.mark.django_db
def test_unverified_user_does_not_receive_learner_fields(client):
    user = UserFactory()
    tutorial, first, _ = make_tutorial()
    client.force_login(user)

    response = client.get(reverse("chapter-detail", args=[tutorial.slug, first.slug]))

    assert response.status_code == 200
    assert response.json()["bookmark"] == {"saved": False}
    assert response.json()["progress"] is None
    assert response["Cache-Control"] == "private, no-store"
