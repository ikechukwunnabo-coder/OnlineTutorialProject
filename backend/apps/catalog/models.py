from __future__ import annotations

import math
import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Q, Sum

from apps.catalog.validators import parse_video_url, validate_chapter_image, video_embed_url
from apps.common.choices import PublicationStatus

_WORD_RE = re.compile(r"\S+")


def calculate_reading_time(text: str) -> int:
    """Estimate reading time in minutes at 200 words per minute (minimum 1)."""
    words = len(_WORD_RE.findall(text or ""))
    return max(1, math.ceil(words / 200))


class Icon(models.TextChoices):
    CODE = "code", "Code"
    TERMINAL = "terminal", "Terminal"
    DATABASE = "database", "Database"
    TOOLS = "tools", "Tools"
    GLOBE = "globe", "Globe"
    CHART = "chart", "Chart"


class Difficulty(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"


class Language(models.TextChoices):
    HTML = "html", "HTML"
    CSS = "css", "CSS"
    JAVASCRIPT = "javascript", "JavaScript"
    PYTHON = "python", "Python"
    SQL = "sql", "SQL"
    BASH = "bash", "Bash"
    TEXT = "text", "Text"


class Tag(models.Model):
    name = models.CharField(max_length=60)
    slug = models.SlugField(max_length=60, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "tag"
        verbose_name_plural = "tags"

    def __str__(self) -> str:
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, choices=Icon.choices, default=Icon.CODE)
    display_order = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=10, choices=PublicationStatus.choices, default=PublicationStatus.DRAFT
    )
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name = "category"
        verbose_name_plural = "categories"
        indexes = [
            models.Index(fields=["status", "display_order"], name="category_status_order_idx"),
        ]

    def __str__(self) -> str:
        return self.name


class Tutorial(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="tutorials")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="authored_tutorials",
    )
    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=160, unique=True)
    summary = models.TextField(max_length=300)
    difficulty = models.CharField(
        max_length=12, choices=Difficulty.choices, default=Difficulty.BEGINNER
    )
    estimated_reading_time = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(
        max_length=10, choices=PublicationStatus.choices, default=PublicationStatus.DRAFT
    )
    published_at = models.DateTimeField(null=True, blank=True)
    is_demo = models.BooleanField(default=False)
    tags = models.ManyToManyField(Tag, blank=True, related_name="tutorials")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "id"]
        verbose_name = "tutorial"
        verbose_name_plural = "tutorials"
        constraints = [
            models.CheckConstraint(
                condition=~Q(status=PublicationStatus.PUBLISHED) | Q(published_at__isnull=False),
                name="tutorial_published_requires_date",
            ),
            models.CheckConstraint(
                condition=~Q(status=PublicationStatus.PUBLISHED) | Q(estimated_reading_time__gte=1),
                name="tutorial_published_requires_time",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "-published_at"], name="tutorial_status_pub_idx"),
            models.Index(fields=["category", "status"], name="tutorial_category_idx"),
            models.Index(fields=["difficulty", "status"], name="tutorial_difficulty_idx"),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if self.pk and self.chapters.exists():
            self.estimated_reading_time = self._reading_time_total()
        super().save(*args, **kwargs)

    def clean(self) -> None:
        super().clean()
        if (
            self.status == PublicationStatus.PUBLISHED
            and self.pk
            and not self.chapters.filter(status=PublicationStatus.PUBLISHED).exists()
        ):
            raise ValidationError(
                {"status": "Publish at least one chapter before publishing the tutorial."}
            )

    def _reading_time_total(self) -> int:
        published = self.chapters.filter(status=PublicationStatus.PUBLISHED)
        if published.exists() or self.status == PublicationStatus.PUBLISHED:
            total = published.aggregate(total=Sum("estimated_reading_time"))["total"] or 0
        else:
            total = self.chapters.aggregate(total=Sum("estimated_reading_time"))["total"] or 0
        if self.status == PublicationStatus.PUBLISHED:
            return max(1, total)
        return total

    def recalculate_reading_time(self) -> int:
        total = self._reading_time_total()
        self.estimated_reading_time = total
        type(self).objects.filter(pk=self.pk).update(estimated_reading_time=total)
        return total


class Chapter(models.Model):
    tutorial = models.ForeignKey(Tutorial, on_delete=models.CASCADE, related_name="chapters")
    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=160)
    summary = models.TextField(max_length=300, blank=True)
    content = models.TextField(blank=True)
    order = models.PositiveIntegerField()
    estimated_reading_time = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(
        max_length=10, choices=PublicationStatus.choices, default=PublicationStatus.DRAFT
    )
    published_at = models.DateTimeField(null=True, blank=True)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "chapter"
        verbose_name_plural = "chapters"
        constraints = [
            models.UniqueConstraint(
                fields=["tutorial", "slug"], name="unique_chapter_slug_per_tutorial"
            ),
            models.UniqueConstraint(
                fields=["tutorial", "order"], name="unique_chapter_order_per_tutorial"
            ),
            models.CheckConstraint(condition=Q(order__gte=1), name="chapter_order_gte_1"),
            models.CheckConstraint(
                condition=~Q(status=PublicationStatus.PUBLISHED) | Q(published_at__isnull=False),
                name="chapter_published_requires_date",
            ),
        ]
        indexes = [
            models.Index(fields=["tutorial", "status", "order"], name="chapter_tutorial_order_idx"),
            models.Index(fields=["status", "-published_at"], name="chapter_status_pub_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.tutorial.title}: {self.title}"

    @transaction.atomic
    def save(self, *args, **kwargs):
        self.estimated_reading_time = calculate_reading_time(self.content)
        super().save(*args, **kwargs)
        Tutorial.objects.get(pk=self.tutorial_id).recalculate_reading_time()

    def clean(self) -> None:
        super().clean()
        if self.pk and self.status != PublicationStatus.PUBLISHED:
            tutorial = Tutorial.objects.filter(pk=self.tutorial_id).first()
            if (
                tutorial
                and tutorial.status == PublicationStatus.PUBLISHED
                and not tutorial.chapters.filter(status=PublicationStatus.PUBLISHED)
                .exclude(pk=self.pk)
                .exists()
            ):
                raise ValidationError(
                    {
                        "status": (
                            "Unpublish the tutorial before unpublishing its last published chapter."
                        )
                    }
                )

    @transaction.atomic
    def delete(self, *args, **kwargs):
        tutorial = Tutorial.objects.filter(pk=self.tutorial_id).first()
        if (
            tutorial
            and tutorial.status == PublicationStatus.PUBLISHED
            and self.status == PublicationStatus.PUBLISHED
            and not tutorial.chapters.filter(status=PublicationStatus.PUBLISHED)
            .exclude(pk=self.pk)
            .exists()
        ):
            raise ValidationError(
                "Unpublish the tutorial before deleting its last published chapter."
            )
        super().delete(*args, **kwargs)
        tutorial = Tutorial.objects.filter(pk=self.tutorial_id).first()
        if tutorial:
            tutorial.recalculate_reading_time()


class CodeExample(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="code_examples")
    language = models.CharField(max_length=16, choices=Language.choices, default=Language.TEXT)
    title = models.CharField(max_length=120)
    source = models.TextField()
    expected_output = models.TextField(blank=True)
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "code example"
        verbose_name_plural = "code examples"
        constraints = [
            models.UniqueConstraint(fields=["chapter", "order"], name="unique_code_example_order"),
            models.CheckConstraint(condition=Q(order__gte=1), name="code_example_order_gte_1"),
        ]
        indexes = [
            models.Index(fields=["chapter", "order"], name="code_example_chapter_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.language})"


class ChapterImage(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="images")
    image = models.FileField(
        upload_to="chapter-images/",
        validators=[validate_chapter_image],
        max_length=255,
    )
    alt_text = models.CharField(max_length=200, blank=True)
    decorative = models.BooleanField(default=False)
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "chapter image"
        verbose_name_plural = "chapter images"
        constraints = [
            models.UniqueConstraint(fields=["chapter", "order"], name="unique_chapter_image_order"),
            models.CheckConstraint(condition=Q(order__gte=1), name="chapter_image_order_gte_1"),
        ]
        indexes = [
            models.Index(fields=["chapter", "order"], name="chapter_image_chapter_idx"),
        ]

    def __str__(self) -> str:
        return self.alt_text or self.caption or f"Image {self.order}"

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def clean(self) -> None:
        super().clean()
        if not self.decorative and not self.alt_text.strip():
            raise ValidationError({"alt_text": "Describe the image or mark it as decorative."})
        if self.decorative and self.alt_text.strip():
            raise ValidationError({"decorative": "Decorative images must have empty alt text."})


class VideoProvider(models.TextChoices):
    YOUTUBE = "youtube", "YouTube"
    VIMEO = "vimeo", "Vimeo"


class VideoEmbed(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="video_embeds")
    provider = models.CharField(max_length=10, choices=VideoProvider.choices, blank=True)
    source_url = models.URLField(max_length=255)
    video_id = models.CharField(max_length=64, blank=True)
    title = models.CharField(max_length=120)
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "video embed"
        verbose_name_plural = "video embeds"
        constraints = [
            models.UniqueConstraint(fields=["chapter", "order"], name="unique_video_embed_order"),
            models.CheckConstraint(condition=Q(order__gte=1), name="video_embed_order_gte_1"),
        ]
        indexes = [
            models.Index(fields=["chapter", "order"], name="video_embed_chapter_idx"),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        self._apply_parsed_url()
        self.full_clean()
        super().save(*args, **kwargs)

    def clean(self) -> None:
        super().clean()
        self._apply_parsed_url()

    @property
    def embed_url(self) -> str:
        return video_embed_url(self.provider, self.video_id)

    def _apply_parsed_url(self) -> None:
        try:
            provider, video_id = parse_video_url(self.source_url)
        except ValidationError as error:
            raise ValidationError({"source_url": error.messages}) from error
        self.provider = provider
        self.video_id = video_id
