from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from apps.common.admin import AdminOnlyMixin, AuditAdminMixin

from .models import Profile, User


class AdminUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ("email",)


class AdminUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"


@admin.register(User)
class UserAdmin(AdminOnlyMixin, AuditAdminMixin, BaseUserAdmin):
    form = AdminUserChangeForm
    add_form = AdminUserCreationForm
    model = User
    list_display = (
        "email",
        "role",
        "is_active",
        "is_staff",
        "email_verified_at",
        "date_joined",
    )
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    search_fields = ("email",)
    ordering = ("-date_joined",)
    readonly_fields = ("last_login", "date_joined", "password_changed_at")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Verification", {"fields": ("email_verified_at", "password_changed_at")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role", "is_active", "is_staff"),
            },
        ),
    )


@admin.register(Profile)
class ProfileAdmin(AdminOnlyMixin, AuditAdminMixin, admin.ModelAdmin):
    list_display = ("user", "display_name", "updated_at")
    search_fields = ("user__email", "display_name")
    readonly_fields = ("created_at", "updated_at")
