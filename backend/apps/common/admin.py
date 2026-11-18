from __future__ import annotations

from django.contrib import admin

from .models import AdministrativeAuditLog, SiteSetting


def is_admin_user(user) -> bool:
    if not getattr(user, "is_authenticated", False):
        return False
    return bool(user.is_superuser or getattr(user, "role", None) == "admin")


class AdminOnlyMixin:
    def has_module_permission(self, request) -> bool:
        return is_admin_user(request.user)

    def has_view_permission(self, request, obj=None) -> bool:
        return is_admin_user(request.user)

    def has_add_permission(self, request) -> bool:
        return is_admin_user(request.user)

    def has_change_permission(self, request, obj=None) -> bool:
        return is_admin_user(request.user)

    def has_delete_permission(self, request, obj=None) -> bool:
        return is_admin_user(request.user)


class AuditAdminMixin(admin.ModelAdmin):
    """Record administrative create/update/delete actions."""

    def _log(self, request, action: str, model_label: str, object_id: str) -> None:
        actor = request.user if getattr(request.user, "is_authenticated", False) else None
        AdministrativeAuditLog.objects.create(
            actor=actor,
            action=action,
            model_label=model_label,
            object_id=object_id,
        )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        self._log(
            request,
            "update" if change else "create",
            f"{obj._meta.app_label}.{obj._meta.model_name}",
            str(obj.pk),
        )

    def delete_model(self, request, obj):
        model_label = f"{obj._meta.app_label}.{obj._meta.model_name}"
        object_id = str(obj.pk)
        super().delete_model(request, obj)
        self._log(request, "delete", model_label, object_id)


@admin.register(SiteSetting)
class SiteSettingAdmin(AdminOnlyMixin, AuditAdminMixin, admin.ModelAdmin):
    list_display = ("key", "updated_at")
    search_fields = ("key",)


@admin.register(AdministrativeAuditLog)
class AdministrativeAuditLogAdmin(AdminOnlyMixin, admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "model_label", "object_id")
    list_filter = ("action", "model_label")
    search_fields = ("action", "model_label", "object_id", "actor__email")
    readonly_fields = (
        "actor",
        "action",
        "model_label",
        "object_id",
        "changes",
        "created_at",
    )

    def has_add_permission(self, request) -> bool:
        return False

    def has_change_permission(self, request, obj=None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False
