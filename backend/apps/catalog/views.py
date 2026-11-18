from __future__ import annotations

from typing import Any

from django.conf import settings
from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.cache import (
    CATEGORIES_KEY,
    HOME_KEY,
    TAGS_KEY,
    cache_get,
    cache_set,
    category_key,
    chapter_key,
    list_cache_key,
    tutorial_key,
)
from apps.common.choices import PublicationStatus
from apps.common.http import private_no_store, public_cache
from apps.common.markdown import render_markdown
from apps.common.pagination import TutorialPagination
from apps.common.throttles import AnonUserRateThrottle
from apps.learning.models import Bookmark, UserProgress
from apps.seo.models import SlugRedirect

from .models import Category, Chapter, Tag, Tutorial
from .serializers import (
    CategoryDetailSerializer,
    CategoryListSerializer,
    ChapterDetailSerializer,
    HomeSerializer,
    RedirectResponseSerializer,
    TagListSerializer,
    TutorialDetailSerializer,
    TutorialListPageSerializer,
    TutorialListSerializer,
)

PUBLISHED = PublicationStatus.PUBLISHED
ORDERING_FIELDS = {
    "-published_at": "-published_at",
    "published_at": "published_at",
    "title": "title",
    "estimated_reading_time": "estimated_reading_time",
}
PUBLIC_CACHE_SECONDS = 300


def is_verified(user: Any) -> bool:
    return bool(
        getattr(user, "is_authenticated", False)
        and getattr(user, "is_active", False)
        and getattr(user, "email_verified", False)
    )


def public_tutorials():
    return Tutorial.objects.filter(
        status=PUBLISHED,
        is_demo=False,
        category__status=PUBLISHED,
    )


def published_chapters():
    return Chapter.objects.filter(status=PUBLISHED, is_demo=False).order_by("order", "id")


class HomeView(APIView):
    permission_classes: list = []
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(responses=HomeSerializer)
    def get(self, request):
        data = cache_get(HOME_KEY)
        if data is None:
            featured = list(
                Category.objects.filter(status=PUBLISHED, is_demo=False).order_by(
                    "display_order", "name"
                )[:4]
            )
            latest = list(
                public_tutorials().select_related("category").order_by("-published_at")[:6]
            )
            data = HomeSerializer(
                {
                    "site_name": settings.SITE_NAME,
                    "featured_categories": featured,
                    "latest_tutorials": latest,
                    "stats": {
                        "published_tutorials": public_tutorials().count(),
                        "published_chapters": Chapter.objects.filter(
                            status=PUBLISHED,
                            is_demo=False,
                            tutorial__status=PUBLISHED,
                            tutorial__is_demo=False,
                            tutorial__category__status=PUBLISHED,
                        ).count(),
                        "published_categories": Category.objects.filter(
                            status=PUBLISHED, is_demo=False
                        ).count(),
                    },
                }
            ).data
            cache_set(HOME_KEY, data, 60)
        return public_cache(Response(data), 60)


class CategoryListView(APIView):
    permission_classes: list = []
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(responses=CategoryListSerializer(many=True))
    def get(self, request):
        data = cache_get(CATEGORIES_KEY)
        if data is None:
            categories = (
                Category.objects.filter(status=PUBLISHED, is_demo=False)
                .annotate(
                    tutorial_count=Count(
                        "tutorials",
                        filter=Q(
                            tutorials__status=PUBLISHED,
                            tutorials__is_demo=False,
                        ),
                    )
                )
                .order_by("display_order", "name")
            )
            data = CategoryListSerializer(categories, many=True).data
            cache_set(CATEGORIES_KEY, data, PUBLIC_CACHE_SECONDS)
        return public_cache(Response(data), PUBLIC_CACHE_SECONDS)


class CategoryDetailView(APIView):
    permission_classes: list = []
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(responses=CategoryDetailSerializer)
    def get(self, request, slug: str):
        key = category_key(slug)
        data = cache_get(key)
        if data is None:
            category = get_object_or_404(Category, slug=slug, status=PUBLISHED, is_demo=False)
            vars(category)["published_tutorials"] = list(
                public_tutorials()
                .filter(category=category)
                .annotate(
                    chapter_count=Count(
                        "chapters", filter=Q(chapters__status=PUBLISHED, chapters__is_demo=False)
                    )
                )
                .order_by("-published_at", "id")
            )
            data = CategoryDetailSerializer(category).data
            cache_set(key, data, PUBLIC_CACHE_SECONDS)
        return public_cache(Response(data), PUBLIC_CACHE_SECONDS)


class TutorialListView(APIView):
    permission_classes: list = []
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(
        parameters=[
            OpenApiParameter("category", str),
            OpenApiParameter("difficulty", str),
            OpenApiParameter("tag", str),
            OpenApiParameter("ordering", str),
            OpenApiParameter("page", int),
            OpenApiParameter("page_size", int),
        ],
        responses=TutorialListPageSerializer,
        operation_id="tutorials_list",
    )
    def get(self, request):
        params = request.query_params
        ordering = params.get("ordering", "-published_at")
        if ordering not in ORDERING_FIELDS:
            raise ValidationError({"ordering": ["Unknown ordering value."]})
        difficulty = params.get("difficulty")
        if difficulty and difficulty not in {
            "beginner",
            "intermediate",
            "advanced",
        }:
            raise ValidationError({"difficulty": ["Unknown difficulty value."]})

        queryset = public_tutorials().select_related("category").prefetch_related("tags")
        if category_slug := params.get("category"):
            queryset = queryset.filter(category__slug=category_slug)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if tag_slug := params.get("tag"):
            queryset = queryset.filter(tags__slug=tag_slug)
        queryset = queryset.annotate(
            chapter_count=Count(
                "chapters",
                filter=Q(chapters__status=PUBLISHED, chapters__is_demo=False),
            )
        ).order_by(ORDERING_FIELDS[ordering], "id")

        key = list_cache_key(
            "tutorials",
            {"host": request.get_host(), "query": params.urlencode()},
        )
        data = cache_get(key)
        if data is None:
            paginator = TutorialPagination()
            page = paginator.paginate_queryset(queryset, request, view=self)
            serializer = TutorialListSerializer(page, many=True)
            data = paginator.get_paginated_response(serializer.data).data
            cache_set(key, data, PUBLIC_CACHE_SECONDS)
        return public_cache(Response(data), PUBLIC_CACHE_SECONDS)


class TutorialDetailView(APIView):
    permission_classes: list = []
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(operation_id="tutorials_retrieve", responses=TutorialDetailSerializer)
    def get(self, request, slug: str):
        authenticated = bool(getattr(request.user, "is_authenticated", False))
        key = tutorial_key(slug)
        data = None if authenticated else cache_get(key)
        if data is None:
            tutorial = get_object_or_404(
                public_tutorials()
                .select_related("category", "author__profile")
                .prefetch_related(
                    "tags",
                    Prefetch(
                        "chapters", queryset=published_chapters(), to_attr="published_chapters"
                    ),
                ),
                slug=slug,
            )
            progress = None
            if is_verified(request.user):
                chapters = getattr(tutorial, "published_chapters", [])
                total = len(chapters)
                completed = UserProgress.objects.filter(
                    user=request.user,
                    chapter_id__in=[chapter.pk for chapter in chapters],
                    completed=True,
                ).count()
                progress = {
                    "completed_chapters": completed,
                    "total_chapters": total,
                    "percent": round(completed / total * 100) if total else 0,
                }
            data = TutorialDetailSerializer(tutorial, context={"progress": progress}).data
            if not authenticated:
                cache_set(key, data, PUBLIC_CACHE_SECONDS)
        response = Response(data)
        response["Vary"] = "Cookie"
        if authenticated:
            return private_no_store(response)
        return public_cache(response, PUBLIC_CACHE_SECONDS)


class ChapterDetailView(APIView):
    permission_classes: list = []
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(responses=ChapterDetailSerializer)
    def get(self, request, tutorial_slug: str, chapter_slug: str):
        authenticated = bool(getattr(request.user, "is_authenticated", False))
        key = chapter_key(tutorial_slug, chapter_slug)
        data = None if authenticated else cache_get(key)
        if data is None:
            chapter = get_object_or_404(
                Chapter.objects.select_related("tutorial", "tutorial__category").prefetch_related(
                    "code_examples",
                    "images",
                    "video_embeds",
                    Prefetch(
                        "tutorial__chapters",
                        queryset=published_chapters(),
                        to_attr="published_chapters",
                    ),
                ),
                tutorial__slug=tutorial_slug,
                slug=chapter_slug,
                status=PUBLISHED,
                is_demo=False,
                tutorial__status=PUBLISHED,
                tutorial__is_demo=False,
                tutorial__category__status=PUBLISHED,
            )
            chapters = getattr(chapter.tutorial, "published_chapters", [])
            index = next(
                (position for position, item in enumerate(chapters) if item.pk == chapter.pk),
                None,
            )
            navigation: dict[str, dict[str, str] | None] = {"previous": None, "next": None}
            if index is not None:
                if index > 0:
                    previous = chapters[index - 1]
                    navigation["previous"] = {
                        "title": previous.title,
                        "url": f"/tutorials/{tutorial_slug}/{previous.slug}",
                    }
                if index + 1 < len(chapters):
                    following = chapters[index + 1]
                    navigation["next"] = {
                        "title": following.title,
                        "url": f"/tutorials/{tutorial_slug}/{following.slug}",
                    }
            rendered_content, toc = render_markdown(chapter.content)
            bookmark = {"saved": False}
            progress = None
            if is_verified(request.user):
                bookmark = {
                    "saved": Bookmark.objects.filter(user=request.user, chapter=chapter).exists()
                }
                user_progress = UserProgress.objects.filter(
                    user=request.user, chapter=chapter
                ).first()
                progress = {
                    "completed": bool(user_progress and user_progress.completed),
                    "reading_position": user_progress.reading_position if user_progress else 0,
                }
            data = ChapterDetailSerializer(
                chapter,
                context={
                    "rendered_content": rendered_content,
                    "toc": toc,
                    "navigation": navigation,
                    "bookmark": bookmark,
                    "progress": progress,
                    "tutorial_chapter_count": len(chapters),
                },
            ).data
            if not authenticated:
                cache_set(key, data, PUBLIC_CACHE_SECONDS)
        response = Response(data)
        response["Vary"] = "Cookie"
        if authenticated:
            return private_no_store(response)
        return public_cache(response, PUBLIC_CACHE_SECONDS)


class TagListView(APIView):
    permission_classes: list = []
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(responses=TagListSerializer(many=True))
    def get(self, request):
        data = cache_get(TAGS_KEY)
        if data is None:
            tags = Tag.objects.annotate(
                tutorial_count=Count(
                    "tutorials",
                    filter=Q(
                        tutorials__status=PUBLISHED,
                        tutorials__is_demo=False,
                        tutorials__category__status=PUBLISHED,
                    ),
                )
            ).order_by("name")
            data = TagListSerializer(tags, many=True).data
            cache_set(TAGS_KEY, data, PUBLIC_CACHE_SECONDS)
        return public_cache(Response(data), PUBLIC_CACHE_SECONDS)


class RedirectView(APIView):
    permission_classes: list = []
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(
        parameters=[OpenApiParameter("path", str, required=True)],
        responses=RedirectResponseSerializer,
    )
    def get(self, request):
        path = request.query_params.get("path", "").strip()
        if not path:
            raise ValidationError({"path": ["This query parameter is required."]})
        key = list_cache_key("redirect", {"path": path})
        data = cache_get(key)
        if data is None:
            redirect = SlugRedirect.objects.filter(old_path=path, is_active=True).first()
            if redirect is None:
                raise NotFound()
            data = RedirectResponseSerializer(
                {
                    "redirect": {
                        "old_path": redirect.old_path,
                        "new_path": redirect.new_path,
                        "status_code": redirect.status_code,
                    }
                }
            ).data
            cache_set(key, data, PUBLIC_CACHE_SECONDS)
        return public_cache(Response(data), PUBLIC_CACHE_SECONDS)
