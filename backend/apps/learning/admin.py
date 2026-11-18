from __future__ import annotations

from django.contrib import admin

from apps.common.admin import AdminOnlyMixin

from .models import Bookmark, UserProgress


@admin.register(Bookmark)
class BookmarkAdmin(AdminOnlyMixin, admin.ModelAdmin):
    list_display = ("user", "chapter", "created_at")
    search_fields = ("user__email", "chapter__title")
    readonly_fields = ("user", "chapter", "created_at")

    def has_add_permission(self, request) -> bool:
        return False


@admin.register(UserProgress)
class UserProgressAdmin(AdminOnlyMixin, admin.ModelAdmin):
    list_display = ("user", "chapter", "completed", "reading_position", "updated_at")
    list_filter = ("completed",)
    search_fields = ("user__email", "chapter__title")
    readonly_fields = ("user", "chapter", "created_at", "updated_at")

    def has_add_permission(self, request) -> bool:
        return False
