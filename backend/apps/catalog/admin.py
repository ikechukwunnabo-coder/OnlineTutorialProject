from __future__ import annotations

from django.contrib import admin
from django.utils import timezone

from apps.common.admin import AuditAdminMixin, is_admin_user
from apps.common.choices import PublicationStatus

from .models import Category, Chapter, ChapterImage, CodeExample, Tag, Tutorial, VideoEmbed


def is_content_editor(user) -> bool:
    return bool(
        getattr(user, "is_authenticated", False)
        and getattr(user, "is_active", False)
        and getattr(user, "is_staff", False)
    )


class ContentAdminMixin(AuditAdminMixin):
    def has_module_permission(self, request) -> bool:
        return is_content_editor(request.user)

    def has_view_permission(self, request, obj=None) -> bool:
        return is_content_editor(request.user)

    def has_add_permission(self, request) -> bool:
        return is_content_editor(request.user)

    def has_change_permission(self, request, obj=None) -> bool:
        return is_content_editor(request.user)

    def has_delete_permission(self, request, obj=None) -> bool:
        return is_admin_user(request.user)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if not is_admin_user(request.user):
            model = obj.__class__ if obj is not None else self.model
            field_names = {field.name for field in model._meta.fields}
            readonly.extend(
                name for name in ("status", "published_at", "is_demo") if name in field_names
            )
        return readonly

    def save_model(self, request, obj, form, change):
        if obj.status == PublicationStatus.PUBLISHED and obj.published_at is None:
            obj.published_at = timezone.now()
        super().save_model(request, obj, form, change)


@admin.register(Category)
class CategoryAdmin(ContentAdminMixin, admin.ModelAdmin):
    list_display = ("name", "slug", "status", "display_order", "is_demo", "updated_at")
    list_filter = ("status", "is_demo")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    ordering = ("display_order", "name")


@admin.register(Tag)
class TagAdmin(ContentAdminMixin, admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Tutorial)
class TutorialAdmin(ContentAdminMixin, admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "difficulty",
        "status",
        "is_demo",
        "estimated_reading_time",
        "published_at",
    )
    list_filter = ("status", "difficulty", "is_demo", "category")
    search_fields = ("title", "summary", "slug")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("tags",)
    readonly_fields = ("estimated_reading_time", "created_at", "updated_at")
    autocomplete_fields = ("category", "author")
    fieldsets = (
        (None, {"fields": ("title", "slug", "summary")}),
        ("Classification", {"fields": ("category", "author", "difficulty", "tags")}),
        ("Publication", {"fields": ("status", "published_at", "is_demo")}),
        ("Metadata", {"fields": ("estimated_reading_time", "created_at", "updated_at")}),
    )


class CodeExampleInline(admin.TabularInline):
    model = CodeExample
    extra = 1
    fields = ("order", "title", "language", "source", "expected_output")
    ordering = ("order",)


class ChapterImageInline(admin.TabularInline):
    model = ChapterImage
    extra = 1
    fields = ("order", "image", "alt_text", "decorative", "caption")
    ordering = ("order",)


class VideoEmbedInline(admin.TabularInline):
    model = VideoEmbed
    extra = 1
    fields = ("order", "title", "source_url", "provider", "video_id")
    readonly_fields = ("provider", "video_id")
    ordering = ("order",)


@admin.register(Chapter)
class ChapterAdmin(ContentAdminMixin, admin.ModelAdmin):
    list_display = ("title", "tutorial", "order", "status", "is_demo", "estimated_reading_time")
    list_filter = ("status", "is_demo", "tutorial__category")
    search_fields = ("title", "summary", "content", "slug")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("estimated_reading_time", "created_at", "updated_at")
    autocomplete_fields = ("tutorial",)
    inlines = [CodeExampleInline, ChapterImageInline, VideoEmbedInline]
    fieldsets = (
        (None, {"fields": ("tutorial", "title", "slug", "summary")}),
        ("Content", {"fields": ("content", "estimated_reading_time")}),
        ("Publication", {"fields": ("status", "published_at", "is_demo", "order")}),
        ("Metadata", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(CodeExample)
class CodeExampleAdmin(ContentAdminMixin, admin.ModelAdmin):
    list_display = ("title", "chapter", "language", "order")
    list_filter = ("language",)
    search_fields = ("title", "source", "chapter__title")
    autocomplete_fields = ("chapter",)
