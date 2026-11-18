from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class Bookmark(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    chapter = models.ForeignKey(
        "catalog.Chapter",
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "bookmark"
        verbose_name_plural = "bookmarks"
        constraints = [
            models.UniqueConstraint(fields=["user", "chapter"], name="unique_bookmark_per_user"),
        ]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="bookmark_user_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} bookmarked {self.chapter_id}"


class UserProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="progress",
    )
    chapter = models.ForeignKey(
        "catalog.Chapter",
        on_delete=models.CASCADE,
        related_name="progress",
    )
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    reading_position = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "user progress"
        verbose_name_plural = "user progress"
        constraints = [
            models.UniqueConstraint(fields=["user", "chapter"], name="unique_progress_per_user"),
            models.CheckConstraint(
                condition=models.Q(reading_position__lte=100),
                name="progress_position_lte_100",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "-updated_at"], name="progress_user_updated_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} progress on {self.chapter_id}"

    def save(self, *args, **kwargs):
        if self.completed and self.completed_at is None:
            self.completed_at = timezone.now()
        elif not self.completed:
            self.completed_at = None
        super().save(*args, **kwargs)
