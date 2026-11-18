from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models

VALID_STATUS_CODES = (301, 308)


class SlugRedirect(models.Model):
    old_path = models.CharField(max_length=500, unique=True)
    new_path = models.CharField(max_length=500)
    status_code = models.PositiveSmallIntegerField(default=301)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "slug redirect"
        verbose_name_plural = "slug redirects"
        indexes = [
            models.Index(fields=["is_active", "old_path"], name="redirect_active_path_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.old_path} -> {self.new_path} ({self.status_code})"

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        if not self.old_path.startswith("/"):
            errors["old_path"] = "The old path must start with '/'."
        if not self.new_path.startswith("/"):
            errors["new_path"] = "The new path must start with '/'."
        if self.old_path and self.old_path == self.new_path:
            errors["new_path"] = "The new path must differ from the old path."
        if self.status_code not in VALID_STATUS_CODES:
            errors["status_code"] = "Only 301 and 308 redirects are supported."
        if errors:
            raise ValidationError(errors)
        if self._creates_loop():
            raise ValidationError({"new_path": "This redirect would create a loop."})

    def _creates_loop(self) -> bool:
        seen: set[str] = set()
        current = self.new_path
        while current and current not in seen:
            if current == self.old_path:
                return True
            seen.add(current)
            next_redirect = (
                SlugRedirect.objects.filter(old_path=current, is_active=True)
                .exclude(pk=self.pk)
                .first()
            )
            current = next_redirect.new_path if next_redirect else ""
        return False
