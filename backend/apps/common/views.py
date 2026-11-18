from __future__ import annotations

import logging
from collections import Counter
from datetime import datetime
from typing import Any, cast

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import connection
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from drf_spectacular.views import SpectacularAPIView
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, BasePermission, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.catalog.models import Category, Chapter, Tutorial
from apps.catalog.serializers import (
    ConsoleCategoryReadSerializer,
    ConsoleCategoryWriteSerializer,
    ConsoleChapterReadSerializer,
    ConsoleChapterWriteSerializer,
    ConsoleTutorialReadSerializer,
    ConsoleTutorialWriteSerializer,
)
from apps.common.choices import PublicationStatus
from apps.contact.models import ContactMessage

from .exceptions import ServiceUnavailable
from .models import AdministrativeAuditLog
from .permissions import IsConsoleUser, IsContentAdmin, IsContentEditor
from .serializers import ConsoleOverviewSerializer, HealthSerializer, ReadySerializer

logger = logging.getLogger(__name__)


class NoStoreMixin(APIView):
    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        return response


def _database_ok() -> bool:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        logger.warning("Readiness check failed for the database", exc_info=True)
        return False
    return True


def _cache_ok() -> bool:
    try:
        cache.set("bds:ready", "1", timeout=5)
        return cache.get("bds:ready") == "1"
    except Exception:
        logger.warning("Readiness check failed for the cache", exc_info=True)
        return False


class HealthView(NoStoreMixin):
    authentication_classes: list = []
    permission_classes = [AllowAny]

    @extend_schema(responses=HealthSerializer)
    def get(self, request):
        return Response({"status": "ok"})


class ReadyView(NoStoreMixin):
    authentication_classes: list = []
    permission_classes = [AllowAny]

    @extend_schema(responses={200: ReadySerializer, 503: ReadySerializer})
    def get(self, request):
        checks = {
            "database": "ok" if _database_ok() else "error",
            "redis": "ok" if _cache_ok() else "error",
        }
        if "error" in checks.values():
            raise ServiceUnavailable(detail={"checks": checks})
        return Response({"status": "ready", "checks": checks})


class SchemaView(NoStoreMixin, SpectacularAPIView):
    def get_permissions(self) -> list[BasePermission]:
        if settings.DEBUG:
            return [AllowAny()]
        return [IsAdminUser()]


def _console_recent_content() -> list[dict]:
    items = [
        {
            "kind": "Tutorial",
            "title": title,
            "parent": "",
            "slug": slug,
            "status": status,
            "updated_at": updated_at,
        }
        for title, slug, status, updated_at in Tutorial.objects.values_list(
            "title", "slug", "status", "updated_at"
        )
    ]
    items.extend(
        {
            "kind": "Chapter",
            "title": title,
            "parent": tutorial_title,
            "slug": slug,
            "status": status,
            "updated_at": updated_at,
        }
        for title, slug, status, updated_at, tutorial_title in Chapter.objects.select_related(
            "tutorial"
        ).values_list("title", "slug", "status", "updated_at", "tutorial__title")
    )
    items.sort(key=lambda item: cast(datetime, item["updated_at"]), reverse=True)
    return items[:6]


def _console_recent_activity() -> list[dict]:
    entries = AdministrativeAuditLog.objects.select_related("actor").values_list(
        "id", "actor__email", "action", "model_label", "object_id", "created_at"
    )[:8]
    return [
        {
            "id": entry_id,
            "actor": actor,
            "action": action,
            "model_label": model_label,
            "object_id": object_id,
            "created_at": created_at,
        }
        for entry_id, actor, action, model_label, object_id, created_at in entries
    ]


class ConsoleOverviewView(NoStoreMixin):
    permission_classes = [IsConsoleUser]

    @extend_schema(responses=ConsoleOverviewSerializer)
    def get(self, request):
        category_count = Category.objects.count()
        tutorial_count = Tutorial.objects.count()
        chapter_count = Chapter.objects.count()
        statuses = Counter(
            [
                *Category.objects.values_list("status", flat=True),
                *Tutorial.objects.values_list("status", flat=True),
                *Chapter.objects.values_list("status", flat=True),
            ]
        )
        demo_content = (
            Category.objects.filter(is_demo=True).count()
            + Tutorial.objects.filter(is_demo=True).count()
            + Chapter.objects.filter(is_demo=True).count()
        )

        return Response(
            {
                "generated_at": timezone.now(),
                "role": request.user.role,
                "counts": {
                    "categories": category_count,
                    "tutorials": tutorial_count,
                    "chapters": chapter_count,
                    "users": User.objects.count(),
                    "contact_messages": ContactMessage.objects.count(),
                    "drafts": statuses.get(PublicationStatus.DRAFT, 0),
                    "published": statuses.get(PublicationStatus.PUBLISHED, 0),
                    "archived": statuses.get(PublicationStatus.ARCHIVED, 0),
                    "demo_content": demo_content,
                },
                "content_by_status": [
                    {
                        "status": status,
                        "label": PublicationStatus(status).label,
                        "count": statuses.get(status, 0),
                    }
                    for status in PublicationStatus.values
                ],
                "recent_content": _console_recent_content(),
                "recent_activity": _console_recent_activity(),
            }
        )


def _console_permissions(request) -> list[BasePermission]:
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return [IsConsoleUser()]
    if request.method == "DELETE":
        return [IsContentAdmin()]
    return [IsContentEditor()]


class ConsoleContentPermissionMixin:
    request: Any

    def get_permissions(self) -> list[BasePermission]:
        return _console_permissions(self.request)


def _log_console_action(request, action: str, instance) -> None:
    AdministrativeAuditLog.objects.create(
        actor=request.user,
        action=action,
        model_label=f"{instance._meta.app_label}.{instance._meta.model_name}",
        object_id=str(instance.pk),
        changes={
            name: str(value)
            for name, value in getattr(request, "validated_content_data", {}).items()
        },
    )


def _save_console_content(request, serializer, instance=None):
    if serializer.Meta.model is Tutorial and instance is None:
        saved = serializer.save(author=request.user)
    else:
        saved = serializer.save()
    request.validated_content_data = dict(serializer.validated_data)
    _log_console_action(request, "create" if instance is None else "update", saved)
    return saved


def _delete_console_content(request, instance) -> None:
    model_label = f"{instance._meta.app_label}.{instance._meta.model_name}"
    object_id = str(instance.pk)
    try:
        instance.delete()
    except DjangoValidationError as error:
        raise ValidationError(error.messages) from error
    AdministrativeAuditLog.objects.create(
        actor=request.user,
        action="delete",
        model_label=model_label,
        object_id=object_id,
    )


class ConsoleCategoryListView(ConsoleContentPermissionMixin, NoStoreMixin):
    @extend_schema(
        responses=ConsoleCategoryReadSerializer(many=True),
        operation_id="console_categories_list",
    )
    def get(self, request):
        categories = Category.objects.all().order_by("display_order", "name")
        return Response(ConsoleCategoryReadSerializer(categories, many=True).data)

    @extend_schema(
        request=ConsoleCategoryWriteSerializer,
        responses=ConsoleCategoryReadSerializer,
        operation_id="console_categories_create",
    )
    def post(self, request):
        serializer = ConsoleCategoryWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        category = _save_console_content(request, serializer)
        return Response(ConsoleCategoryReadSerializer(category).data, status=201)


class ConsoleCategoryDetailView(ConsoleContentPermissionMixin, NoStoreMixin):
    @extend_schema(responses=ConsoleCategoryReadSerializer, operation_id="console_categories_read")
    def get(self, request, pk: int):
        category = get_object_or_404(Category, pk=pk)
        return Response(ConsoleCategoryReadSerializer(category).data)

    @extend_schema(
        request=ConsoleCategoryWriteSerializer,
        responses=ConsoleCategoryReadSerializer,
        operation_id="console_categories_update",
    )
    def patch(self, request, pk: int):
        category = get_object_or_404(Category, pk=pk)
        serializer = ConsoleCategoryWriteSerializer(
            category, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        category = _save_console_content(request, serializer, category)
        return Response(ConsoleCategoryReadSerializer(category).data)

    @extend_schema(responses={204: None}, operation_id="console_categories_delete")
    def delete(self, request, pk: int):
        category = get_object_or_404(Category, pk=pk)
        _delete_console_content(request, category)
        return Response(status=204)


class ConsoleTutorialListView(ConsoleContentPermissionMixin, NoStoreMixin):
    @extend_schema(
        responses=ConsoleTutorialReadSerializer(many=True),
        operation_id="console_tutorials_list",
    )
    def get(self, request):
        tutorials = (
            Tutorial.objects.select_related("category", "author")
            .prefetch_related("tags")
            .order_by("-updated_at", "id")
        )
        return Response(ConsoleTutorialReadSerializer(tutorials, many=True).data)

    @extend_schema(
        request=ConsoleTutorialWriteSerializer,
        responses=ConsoleTutorialReadSerializer,
        operation_id="console_tutorials_create",
    )
    def post(self, request):
        serializer = ConsoleTutorialWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        tutorial = _save_console_content(request, serializer)
        return Response(ConsoleTutorialReadSerializer(tutorial).data, status=201)


class ConsoleTutorialDetailView(ConsoleContentPermissionMixin, NoStoreMixin):
    @extend_schema(responses=ConsoleTutorialReadSerializer, operation_id="console_tutorials_read")
    def get(self, request, pk: int):
        tutorial = get_object_or_404(
            Tutorial.objects.select_related("category", "author").prefetch_related("tags"), pk=pk
        )
        return Response(ConsoleTutorialReadSerializer(tutorial).data)

    @extend_schema(
        request=ConsoleTutorialWriteSerializer,
        responses=ConsoleTutorialReadSerializer,
        operation_id="console_tutorials_update",
    )
    def patch(self, request, pk: int):
        tutorial = get_object_or_404(Tutorial, pk=pk)
        serializer = ConsoleTutorialWriteSerializer(
            tutorial, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        tutorial = _save_console_content(request, serializer, tutorial)
        return Response(ConsoleTutorialReadSerializer(tutorial).data)

    @extend_schema(responses={204: None}, operation_id="console_tutorials_delete")
    def delete(self, request, pk: int):
        tutorial = get_object_or_404(Tutorial, pk=pk)
        _delete_console_content(request, tutorial)
        return Response(status=204)


class ConsoleChapterListView(ConsoleContentPermissionMixin, NoStoreMixin):
    @extend_schema(
        responses=ConsoleChapterReadSerializer(many=True),
        operation_id="console_chapters_list",
    )
    def get(self, request):
        chapters = Chapter.objects.select_related("tutorial").order_by("tutorial_id", "order", "id")
        return Response(ConsoleChapterReadSerializer(chapters, many=True).data)

    @extend_schema(
        request=ConsoleChapterWriteSerializer,
        responses=ConsoleChapterReadSerializer,
        operation_id="console_chapters_create",
    )
    def post(self, request):
        serializer = ConsoleChapterWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        chapter = _save_console_content(request, serializer)
        return Response(ConsoleChapterReadSerializer(chapter).data, status=201)


class ConsoleChapterDetailView(ConsoleContentPermissionMixin, NoStoreMixin):
    @extend_schema(responses=ConsoleChapterReadSerializer, operation_id="console_chapters_read")
    def get(self, request, pk: int):
        chapter = get_object_or_404(Chapter.objects.select_related("tutorial"), pk=pk)
        return Response(ConsoleChapterReadSerializer(chapter).data)

    @extend_schema(
        request=ConsoleChapterWriteSerializer,
        responses=ConsoleChapterReadSerializer,
        operation_id="console_chapters_update",
    )
    def patch(self, request, pk: int):
        chapter = get_object_or_404(Chapter, pk=pk)
        serializer = ConsoleChapterWriteSerializer(
            chapter, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        chapter = _save_console_content(request, serializer, chapter)
        return Response(ConsoleChapterReadSerializer(chapter).data)

    @extend_schema(responses={204: None}, operation_id="console_chapters_delete")
    def delete(self, request, pk: int):
        chapter = get_object_or_404(Chapter, pk=pk)
        _delete_console_content(request, chapter)
        return Response(status=204)
