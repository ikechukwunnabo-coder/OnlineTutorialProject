from __future__ import annotations

from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import BasePermission

from .exceptions import EmailNotVerified


class IsVerifiedLearner(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not getattr(user, "is_authenticated", False):
            raise NotAuthenticated()
        if not getattr(user, "is_active", False) or not getattr(user, "email_verified", False):
            raise EmailNotVerified()
        return True
