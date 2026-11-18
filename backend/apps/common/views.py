from __future__ import annotations

import logging

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from drf_spectacular.utils import extend_schema
from drf_spectacular.views import SpectacularAPIView
from rest_framework.permissions import AllowAny, BasePermission, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import ServiceUnavailable
from .serializers import HealthSerializer, ReadySerializer

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
