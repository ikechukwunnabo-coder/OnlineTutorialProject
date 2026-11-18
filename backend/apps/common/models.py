from __future__ import annotations

from django.conf import settings
from django.db import models


class SiteSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]
        verbose_name = "site setting"
        verbose_name_plural = "site settings"

    def __str__(self) -> str:
        return self.key


class AdministrativeAuditLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_entries",
    )
    action = models.CharField(max_length=100)
    model_label = models.CharField(max_length=100)
    object_id = models.CharField(max_length=64, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "administrative audit log entry"
        verbose_name_plural = "administrative audit log"
        indexes = [
            models.Index(fields=["actor", "-created_at"], name="audit_actor_created_idx"),
            models.Index(fields=["model_label", "object_id"], name="audit_object_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.action} {self.model_label} {self.object_id}".strip()
