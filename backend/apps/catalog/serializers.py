from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers

from apps.accounts.models import User
from apps.common.choices import PublicationStatus
from apps.common.markdown import render_markdown

from .models import Category, Chapter, ChapterImage, CodeExample, Tag, Tutorial, VideoEmbed


class CategoryRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("name", "slug")


class CategoryDetailRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class CategoryHomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("name", "slug", "icon", "description")


class CategoryListSerializer(serializers.ModelSerializer):
    tutorial_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "display_order",
            "tutorial_count",
        )


class TagSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("name", "slug")


class TagListSerializer(serializers.ModelSerializer):
    tutorial_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ("id", "name", "slug", "tutorial_count")


class TutorialListSerializer(serializers.ModelSerializer):
    category = CategoryRefSerializer(read_only=True)
    chapter_count = serializers.IntegerField(read_only=True)
    tags = TagSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Tutorial
        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "category",
            "difficulty",
            "estimated_reading_time",
            "chapter_count",
            "tags",
            "published_at",
            "updated_at",
        )


class TutorialListPageSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = TutorialListSerializer(many=True)


class CategoryTutorialSerializer(serializers.ModelSerializer):
    chapter_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tutorial
        fields = (
            "title",
            "slug",
            "summary",
            "difficulty",
            "estimated_reading_time",
            "chapter_count",
            "published_at",
        )


class CategoryDetailSerializer(serializers.ModelSerializer):
    tutorials = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "icon", "tutorials")

    def get_tutorials(self, obj: Category) -> list[dict[str, Any]]:
        tutorials = getattr(obj, "published_tutorials", [])
        return CategoryTutorialSerializer(tutorials, many=True).data


class ChapterSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ("title", "slug", "order", "estimated_reading_time", "summary")


class AuthorSerializer(serializers.Serializer):
    display_name = serializers.CharField(source="get_full_name", read_only=True)


class TutorialDetailSerializer(serializers.ModelSerializer):
    category = CategoryDetailRefSerializer(read_only=True)
    author = AuthorSerializer(read_only=True)
    tags = TagSummarySerializer(many=True, read_only=True)
    chapters = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Tutorial
        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "category",
            "author",
            "difficulty",
            "estimated_reading_time",
            "tags",
            "published_at",
            "updated_at",
            "chapters",
            "progress",
        )

    def get_chapters(self, obj: Tutorial) -> list[dict[str, Any]]:
        chapters = getattr(obj, "published_chapters", None)
        if chapters is None:
            chapters = obj.chapters.filter(status="published", is_demo=False)
        return ChapterSummarySerializer(chapters, many=True).data

    def get_progress(self, obj: Tutorial) -> dict[str, Any] | None:
        return self.context.get("progress")


class CodeExampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeExample
        fields = ("language", "title", "source", "expected_output", "order")


class ChapterImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ChapterImage
        fields = ("url", "alt_text", "decorative", "caption", "order")

    def get_url(self, obj: ChapterImage) -> str:
        return obj.image.url if obj.image else ""


class VideoEmbedSerializer(serializers.ModelSerializer):
    embed_url = serializers.CharField(read_only=True)

    class Meta:
        model = VideoEmbed
        fields = ("provider", "title", "embed_url", "order")


class ChapterTutorialSerializer(serializers.Serializer):
    title = serializers.CharField()
    slug = serializers.CharField()
    chapter_count = serializers.SerializerMethodField()

    def get_chapter_count(self, obj: Tutorial) -> int:
        return int(self.context.get("tutorial_chapter_count", 0))


class ChapterDetailSerializer(serializers.ModelSerializer):
    content_html = serializers.SerializerMethodField()
    tutorial = ChapterTutorialSerializer(read_only=True)
    code_examples = CodeExampleSerializer(many=True, read_only=True)
    images = ChapterImageSerializer(many=True, read_only=True)
    video_embeds = VideoEmbedSerializer(many=True, read_only=True)
    toc = serializers.SerializerMethodField()
    navigation = serializers.SerializerMethodField()
    bookmark = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = (
            "id",
            "title",
            "slug",
            "order",
            "summary",
            "content_html",
            "estimated_reading_time",
            "published_at",
            "updated_at",
            "tutorial",
            "code_examples",
            "images",
            "video_embeds",
            "toc",
            "navigation",
            "bookmark",
            "progress",
        )

    def get_content_html(self, obj: Chapter) -> str:
        rendered = self.context.get("rendered_content")
        if rendered is None:
            rendered, _ = render_markdown(obj.content)
        return rendered

    def get_toc(self, obj: Chapter) -> list[dict[str, Any]]:
        return self.context.get("toc", [])

    def get_navigation(self, obj: Chapter) -> dict[str, Any]:
        return self.context.get("navigation", {"previous": None, "next": None})

    def get_bookmark(self, obj: Chapter) -> dict[str, bool]:
        return self.context.get("bookmark", {"saved": False})

    def get_progress(self, obj: Chapter) -> dict[str, Any] | None:
        return self.context.get("progress")


class HomeTutorialSerializer(serializers.ModelSerializer):
    category = CategoryRefSerializer(read_only=True)

    class Meta:
        model = Tutorial
        fields = (
            "title",
            "slug",
            "summary",
            "category",
            "difficulty",
            "estimated_reading_time",
            "published_at",
        )


class HomeStatsSerializer(serializers.Serializer):
    published_tutorials = serializers.IntegerField()
    published_chapters = serializers.IntegerField()
    published_categories = serializers.IntegerField()


class HomeSerializer(serializers.Serializer):
    site_name = serializers.CharField()
    featured_categories = CategoryHomeSerializer(many=True)
    latest_tutorials = HomeTutorialSerializer(many=True)
    stats = HomeStatsSerializer()


class RedirectSerializer(serializers.Serializer):
    old_path = serializers.CharField()
    new_path = serializers.CharField()
    status_code = serializers.IntegerField()


class RedirectResponseSerializer(serializers.Serializer):
    redirect = RedirectSerializer()


def _is_console_admin(serializer: serializers.Serializer) -> bool:
    user = serializer.context.get("request").user if serializer.context.get("request") else None
    return bool(
        user and getattr(user, "is_authenticated", False) and getattr(user, "role", "") == "admin"
    )


def _clean_model(instance) -> None:
    try:
        instance.full_clean()
    except DjangoValidationError as error:
        details = error.message_dict or {"non_field_errors": error.messages}
        raise serializers.ValidationError(details) from error


def _slug_value(value: str, max_length: int) -> str:
    return slugify(value)[:max_length]


class ConsoleModelWriteMixin(serializers.Serializer):
    instance: Any
    Meta: Any
    restricted_fields = ("status", "published_at", "is_demo")

    def get_fields(self):
        fields = super().get_fields()
        if not _is_console_admin(self):
            for name in self.restricted_fields:
                if name in fields:
                    fields[name].read_only = True
        return fields

    def _set_slug(self, attrs: dict[str, Any], source_field: str, max_length: int) -> None:
        if "slug" in attrs or (self.instance is None and source_field in attrs):
            source = attrs.get(source_field)
            if source:
                attrs["slug"] = _slug_value(str(source), max_length)

    def _set_published_at(self, attrs: dict[str, Any]) -> None:
        if attrs.get("status") == PublicationStatus.PUBLISHED:
            current = getattr(self.instance, "published_at", None)
            if not attrs.get("published_at") and not current:
                attrs["published_at"] = timezone.now()

    def _pop_many_to_many(self, validated_data: dict[str, Any]) -> dict[str, Any]:
        return {
            field.name: validated_data.pop(field.name)
            for field in self.Meta.model._meta.many_to_many
            if field.name in validated_data
        }

    def _save_instance(self, instance, many_to_many: dict[str, Any]):
        _clean_model(instance)
        instance.save()
        for name, value in many_to_many.items():
            getattr(instance, name).set(value)
        return instance

    def create(self, validated_data: dict[str, Any]):
        many_to_many = self._pop_many_to_many(validated_data)
        instance = self.Meta.model(**validated_data)
        return self._save_instance(instance, many_to_many)

    def update(self, instance, validated_data: dict[str, Any]):
        many_to_many = self._pop_many_to_many(validated_data)
        for name, value in validated_data.items():
            setattr(instance, name, value)
        return self._save_instance(instance, many_to_many)


class ConsoleCategoryReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "display_order",
            "status",
            "is_demo",
            "updated_at",
        )


class ConsoleCategoryWriteSerializer(ConsoleModelWriteMixin, serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Category
        fields = (
            "name",
            "slug",
            "description",
            "icon",
            "display_order",
            "status",
            "is_demo",
        )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)
        self._set_slug(attrs, "name", 120)
        return attrs


class ConsoleCategoryRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class ConsoleAuthorRefSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "display_name")


class ConsoleTutorialReadSerializer(serializers.ModelSerializer):
    category = ConsoleCategoryRefSerializer(read_only=True)
    author = ConsoleAuthorRefSerializer(read_only=True)
    tags = TagSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Tutorial
        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "category",
            "author",
            "difficulty",
            "estimated_reading_time",
            "status",
            "is_demo",
            "tags",
            "published_at",
            "updated_at",
        )


class ConsoleTutorialWriteSerializer(ConsoleModelWriteMixin, serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)
    author = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Tutorial
        fields = (
            "category",
            "author",
            "title",
            "slug",
            "summary",
            "difficulty",
            "tags",
            "status",
            "published_at",
            "is_demo",
        )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)
        self._set_slug(attrs, "title", 160)
        self._set_published_at(attrs)
        if attrs.get("status") == PublicationStatus.PUBLISHED:
            if (
                self.instance is None
                or not self.instance.chapters.filter(status=PublicationStatus.PUBLISHED).exists()
            ):
                raise serializers.ValidationError(
                    {"status": "Publish at least one chapter before publishing the tutorial."}
                )
        return attrs


class ConsoleChapterReadSerializer(serializers.ModelSerializer):
    tutorial = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = (
            "id",
            "tutorial",
            "title",
            "slug",
            "summary",
            "content",
            "order",
            "estimated_reading_time",
            "status",
            "is_demo",
            "published_at",
            "updated_at",
        )

    def get_tutorial(self, obj: Chapter) -> dict[str, Any]:
        return {"id": obj.tutorial_id, "title": obj.tutorial.title, "slug": obj.tutorial.slug}


class ConsoleChapterWriteSerializer(ConsoleModelWriteMixin, serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Chapter
        fields = (
            "tutorial",
            "title",
            "slug",
            "summary",
            "content",
            "order",
            "status",
            "published_at",
            "is_demo",
        )
        validators: list[Any] = []

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)
        self._set_slug(attrs, "title", 160)
        self._set_published_at(attrs)
        return attrs
