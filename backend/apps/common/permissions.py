from __future__ import annotations

from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import BasePermission

from .exceptions import EmailNotVerified

CONSOLE_ROLES = {"editor", "moderator", "admin"}
CONTENT_EDITOR_ROLES = {"editor", "admin"}


class IsVerifiedLearner(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not getattr(user, "is_authenticated", False):
            raise NotAuthenticated()
        if not getattr(user, "is_active", False) or not getattr(user, "email_verified", False):
            raise EmailNotVerified()
        return True


class IsConsoleUser(BasePermission):
    console_roles = CONSOLE_ROLES

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not getattr(user, "is_authenticated", False):
            raise NotAuthenticated()
        if (
            not getattr(user, "is_active", False)
            or getattr(user, "role", "") not in self.console_roles
        ):
            raise PermissionDenied(
                "This area is available to editors, moderators, and administrators."
            )
        return True


class IsContentEditor(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not getattr(user, "is_authenticated", False):
            raise NotAuthenticated()
        if (
            not getattr(user, "is_active", False)
            or getattr(user, "role", "") not in CONTENT_EDITOR_ROLES
        ):
            raise PermissionDenied("Only editors and administrators can change content.")
        return True


class IsContentAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not getattr(user, "is_authenticated", False):
            raise NotAuthenticated()
        if not getattr(user, "is_active", False) or getattr(user, "role", "") != "admin":
            raise PermissionDenied("Only administrators can delete content.")
        return True
