from __future__ import annotations

from django.contrib import admin

from apps.common.admin import AdminOnlyMixin, AuditAdminMixin

from .models import SlugRedirect


@admin.register(SlugRedirect)
class SlugRedirectAdmin(AdminOnlyMixin, AuditAdminMixin, admin.ModelAdmin):
    list_display = ("old_path", "new_path", "status_code", "is_active", "created_at")
    list_filter = ("is_active", "status_code")
    search_fields = ("old_path", "new_path")
    readonly_fields = ("created_at",)
