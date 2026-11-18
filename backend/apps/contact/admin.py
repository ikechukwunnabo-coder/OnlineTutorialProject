from __future__ import annotations

from django.contrib import admin

from apps.common.admin import AdminOnlyMixin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(AdminOnlyMixin, admin.ModelAdmin):
    list_display = ("created_at", "name", "email", "subject", "status")
    list_filter = ("status",)
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("name", "email", "subject", "message", "ip_hash", "created_at")
    ordering = ("-created_at",)

    def has_add_permission(self, request) -> bool:
        return False
