from __future__ import annotations

from typing import Any

from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework.authentication import SessionAuthentication as DRFSessionAuthentication

AUTH_TIME_KEY = "auth_time"


class SessionAuthentication(DRFSessionAuthentication):
    def authenticate_header(self, request) -> str:
        return "Session"

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, _ = result
        auth_time = request.session.get(AUTH_TIME_KEY)
        if auth_time is None or user.password_changed_at.timestamp() > float(auth_time):
            request.session.flush()
            return None
        return result


class SessionAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "apps.common.authentication.SessionAuthentication"
    name = "sessionAuth"

    def get_security_definition(self, auto_schema: Any) -> dict[str, str]:
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": "bds_sessionid",
        }
