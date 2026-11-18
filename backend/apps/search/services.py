from __future__ import annotations

from typing import Any

from django.db import connection
from django.db.models import Q

from apps.catalog.models import Category, Chapter, Tutorial
from apps.common.choices import PublicationStatus
from apps.common.markdown import make_excerpt

PUBLISHED = PublicationStatus.PUBLISHED
MAX_PER_TYPE = 100


def _published_categories():
    return Category.objects.filter(status=PUBLISHED, is_demo=False)


def _published_tutorials():
    return Tutorial.objects.filter(
        status=PUBLISHED,
        is_demo=False,
        category__status=PUBLISHED,
    )


def _published_chapters():
    return Chapter.objects.filter(
        status=PUBLISHED,
        is_demo=False,
        tutorial__status=PUBLISHED,
        tutorial__is_demo=False,
        tutorial__category__status=PUBLISHED,
    )


def _postgres_results(
    queryset, fields: list[tuple[str, str]], query: str, ordering: tuple[str, ...]
):
    from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

    vector: Any = None
    for field, weight in fields:
        part = SearchVector(field, weight=weight, config="english")
        vector = part if vector is None else vector + part
    search_query = SearchQuery(query, search_type="websearch", config="english")
    return (
        queryset.annotate(rank=SearchRank(vector, search_query))
        .filter(rank__gt=0)
        .order_by(*ordering)[:MAX_PER_TYPE]
    )


def _sqlite_results(queryset, fields: list[str], query: str):
    terms = [term for term in query.split() if term]
    condition = Q()
    for term in terms:
        for field in fields:
            condition |= Q(**{f"{field}__icontains": term})
    return queryset.filter(condition)[:MAX_PER_TYPE]


def _score(title: str, query: str) -> float:
    title_lower = title.lower()
    query_lower = query.lower()
    if title_lower == query_lower:
        return 1.0
    if title_lower.startswith(query_lower):
        return 0.9
    if query_lower in title_lower:
        return 0.7
    return 0.5


def _category_results(query: str) -> list[dict[str, Any]]:
    if connection.vendor == "postgresql":
        queryset = _postgres_results(
            _published_categories(),
            [("name", "A"), ("description", "B")],
            query,
            ("-rank", "name"),
        )
        return [
            {
                "type": "category",
                "title": item.name,
                "excerpt": make_excerpt(item.description or item.name, query),
                "url": f"/categories/{item.slug}",
                "tutorial": None,
                "score": round(float(item.rank), 3),
                "_sort": (float(item.rank), item.created_at.timestamp()),
            }
            for item in queryset
        ]

    queryset = _sqlite_results(_published_categories(), ["name", "description"], query)
    return [
        {
            "type": "category",
            "title": item.name,
            "excerpt": make_excerpt(item.description or item.name, query),
            "url": f"/categories/{item.slug}",
            "tutorial": None,
            "score": _score(item.name, query),
            "_sort": (_score(item.name, query), item.created_at.timestamp()),
        }
        for item in queryset
    ]


def _tutorial_results(query: str) -> list[dict[str, Any]]:
    if connection.vendor == "postgresql":
        queryset = _postgres_results(
            _published_tutorials(),
            [("title", "A"), ("summary", "B")],
            query,
            ("-rank", "-published_at", "id"),
        )
        return [
            {
                "type": "tutorial",
                "title": item.title,
                "excerpt": make_excerpt(item.summary, query),
                "url": f"/tutorials/{item.slug}",
                "tutorial": None,
                "score": round(float(item.rank), 3),
                "_sort": (
                    float(item.rank),
                    item.published_at.timestamp() if item.published_at else 0,
                ),
            }
            for item in queryset
        ]

    queryset = _sqlite_results(_published_tutorials(), ["title", "summary"], query)
    return [
        {
            "type": "tutorial",
            "title": item.title,
            "excerpt": make_excerpt(item.summary, query),
            "url": f"/tutorials/{item.slug}",
            "tutorial": None,
            "score": _score(item.title, query),
            "_sort": (
                _score(item.title, query),
                item.published_at.timestamp() if item.published_at else 0,
            ),
        }
        for item in queryset
    ]


def _chapter_results(query: str) -> list[dict[str, Any]]:
    if connection.vendor == "postgresql":
        queryset = _postgres_results(
            _published_chapters().select_related("tutorial"),
            [("title", "A"), ("summary", "A"), ("content", "B")],
            query,
            ("-rank", "-published_at", "id"),
        )
        return [
            {
                "type": "chapter",
                "title": item.title,
                "excerpt": make_excerpt(item.summary or item.content, query),
                "url": f"/tutorials/{item.tutorial.slug}/{item.slug}",
                "tutorial": {"title": item.tutorial.title, "slug": item.tutorial.slug},
                "score": round(float(item.rank), 3),
                "_sort": (
                    float(item.rank),
                    item.published_at.timestamp() if item.published_at else 0,
                ),
            }
            for item in queryset
        ]

    queryset = _sqlite_results(
        _published_chapters().select_related("tutorial"),
        ["title", "summary", "content"],
        query,
    )
    return [
        {
            "type": "chapter",
            "title": item.title,
            "excerpt": make_excerpt(item.summary or item.content, query),
            "url": f"/tutorials/{item.tutorial.slug}/{item.slug}",
            "tutorial": {"title": item.tutorial.title, "slug": item.tutorial.slug},
            "score": _score(item.title, query),
            "_sort": (
                _score(item.title, query),
                item.published_at.timestamp() if item.published_at else 0,
            ),
        }
        for item in queryset
    ]


def search_content(query: str, result_type: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    if result_type in {"all", "categories"}:
        results.extend(_category_results(query))
    if result_type in {"all", "tutorials"}:
        results.extend(_tutorial_results(query))
    if result_type in {"all", "chapters"}:
        results.extend(_chapter_results(query))
    results.sort(key=lambda item: item["_sort"], reverse=True)
    for item in results:
        item.pop("_sort", None)
    return results


def suggestions(query: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for category in _published_categories().filter(name__istartswith=query).order_by("name")[:8]:
        items.append(
            {
                "title": category.name,
                "url": f"/categories/{category.slug}",
                "type": "category",
            }
        )
    for tutorial in _published_tutorials().filter(title__istartswith=query).order_by("title")[:8]:
        items.append(
            {
                "title": tutorial.title,
                "url": f"/tutorials/{tutorial.slug}",
                "type": "tutorial",
            }
        )
    for chapter in (
        _published_chapters()
        .select_related("tutorial")
        .filter(title__istartswith=query)
        .order_by("title")[:8]
    ):
        items.append(
            {
                "title": chapter.title,
                "url": f"/tutorials/{chapter.tutorial.slug}/{chapter.slug}",
                "type": "chapter",
            }
        )
    items.sort(key=lambda item: item["title"].lower())
    return items[:8]
