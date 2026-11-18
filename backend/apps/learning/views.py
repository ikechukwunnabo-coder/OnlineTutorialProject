from __future__ import annotations

from collections import defaultdict

from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Chapter, Tutorial
from apps.common.choices import PublicationStatus
from apps.common.http import no_store
from apps.common.pagination import BookmarkPagination
from apps.common.permissions import IsVerifiedLearner
from apps.common.throttles import AnonUserRateThrottle
from apps.learning.models import Bookmark, UserProgress

from .serializers import (
    BookmarkCreateSerializer,
    BookmarkPageSerializer,
    BookmarkSerializer,
    ProgressSerializer,
    ProgressSummarySerializer,
    ProgressUpdateSerializer,
)

PUBLISHED = PublicationStatus.PUBLISHED


def published_chapter_queryset():
    return Chapter.objects.filter(
        status=PUBLISHED,
        is_demo=False,
        tutorial__status=PUBLISHED,
        tutorial__is_demo=False,
        tutorial__category__status=PUBLISHED,
    )


class BookmarksView(APIView):
    permission_classes = [IsVerifiedLearner]
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(responses=BookmarkPageSerializer)
    def get(self, request):
        queryset = (
            Bookmark.objects.filter(
                user=request.user,
                chapter__status=PUBLISHED,
                chapter__is_demo=False,
                chapter__tutorial__status=PUBLISHED,
                chapter__tutorial__is_demo=False,
                chapter__tutorial__category__status=PUBLISHED,
            )
            .select_related("chapter", "chapter__tutorial")
            .order_by("-created_at")
        )
        paginator = BookmarkPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = BookmarkSerializer(page, many=True)
        return no_store(paginator.get_paginated_response(serializer.data))

    @extend_schema(request=BookmarkCreateSerializer, responses=BookmarkSerializer)
    def post(self, request):
        serializer = BookmarkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chapter = (
            published_chapter_queryset().filter(pk=serializer.validated_data["chapter"]).first()
        )
        if chapter is None:
            raise NotFound()
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, chapter=chapter)
        bookmark = Bookmark.objects.select_related("chapter", "chapter__tutorial").get(
            pk=bookmark.pk
        )
        return no_store(
            Response(
                BookmarkSerializer(bookmark).data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )
        )


class BookmarkDetailView(APIView):
    permission_classes = [IsVerifiedLearner]
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(responses={204: None})
    def delete(self, request, chapter_id: int):
        Bookmark.objects.filter(user=request.user, chapter_id=chapter_id).delete()
        return no_store(Response(status=status.HTTP_204_NO_CONTENT))


class ProgressView(APIView):
    permission_classes = [IsVerifiedLearner]
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(responses=ProgressSummarySerializer)
    def get(self, request):
        rows = list(
            UserProgress.objects.filter(
                user=request.user,
                chapter__status=PUBLISHED,
                chapter__is_demo=False,
                chapter__tutorial__status=PUBLISHED,
                chapter__tutorial__is_demo=False,
                chapter__tutorial__category__status=PUBLISHED,
            ).select_related("chapter__tutorial")
        )
        tutorial_ids = {row.chapter.tutorial_id for row in rows}
        totals = {
            tutorial.id: tutorial.total_chapters
            for tutorial in Tutorial.objects.filter(id__in=tutorial_ids).annotate(
                total_chapters=Count(
                    "chapters",
                    filter=Q(chapters__status=PUBLISHED, chapters__is_demo=False),
                )
            )
        }
        total_chapters = published_chapter_queryset().count()
        completed_chapters = sum(1 for row in rows if row.completed)
        grouped: dict[int, dict] = defaultdict(
            lambda: {
                "completed_chapters": 0,
                "last_activity_at": None,
                "tutorial": None,
            }
        )
        for row in rows:
            item = grouped[row.chapter.tutorial_id]
            item["tutorial"] = row.chapter.tutorial
            item["completed_chapters"] += int(row.completed)
            if item["last_activity_at"] is None or row.updated_at > item["last_activity_at"]:
                item["last_activity_at"] = row.updated_at
        tutorials = []
        for tutorial_id, item in grouped.items():
            total = totals.get(tutorial_id, 0)
            tutorials.append(
                {
                    "tutorial": {
                        "title": item["tutorial"].title,
                        "slug": item["tutorial"].slug,
                    },
                    "completed_chapters": item["completed_chapters"],
                    "total_chapters": total,
                    "percent": round(item["completed_chapters"] / total * 100) if total else 0,
                    "last_activity_at": item["last_activity_at"],
                }
            )
        tutorials.sort(key=lambda item: item["last_activity_at"], reverse=True)
        data = {
            "overall": {
                "completed_chapters": completed_chapters,
                "started_tutorials": len(tutorial_ids),
                "percent_complete": round(completed_chapters / total_chapters * 100)
                if total_chapters
                else 0,
            },
            "tutorials": tutorials,
        }
        return no_store(Response(ProgressSummarySerializer(data).data))


class ProgressDetailView(APIView):
    permission_classes = [IsVerifiedLearner]
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(request=ProgressUpdateSerializer, responses=ProgressSerializer)
    def put(self, request, chapter_id: int):
        chapter = published_chapter_queryset().filter(pk=chapter_id).first()
        if chapter is None:
            raise NotFound()
        serializer = ProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        progress, _ = UserProgress.objects.get_or_create(
            user=request.user,
            chapter=chapter,
        )
        if "completed" in serializer.validated_data:
            progress.completed = serializer.validated_data["completed"]
        if "reading_position" in serializer.validated_data:
            progress.reading_position = serializer.validated_data["reading_position"]
        progress.save()
        return no_store(Response(ProgressSerializer(progress).data))
