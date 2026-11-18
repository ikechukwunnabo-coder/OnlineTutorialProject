from __future__ import annotations

from django.db import models


class ContactStatus(models.TextChoices):
    NEW = "new", "New"
    HANDLED = "handled", "Handled"
    SPAM = "spam", "Spam"


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=254)
    subject = models.CharField(max_length=160)
    message = models.TextField()
    status = models.CharField(
        max_length=10, choices=ContactStatus.choices, default=ContactStatus.NEW
    )
    ip_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "contact message"
        verbose_name_plural = "contact messages"
        indexes = [
            models.Index(fields=["status", "-created_at"], name="contact_status_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.subject} ({self.email})"
