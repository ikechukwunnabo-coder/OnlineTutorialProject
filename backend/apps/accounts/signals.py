from __future__ import annotations

from django.conf import settings
from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.common.authentication import AUTH_TIME_KEY

from .models import Profile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile_for_new_user(sender, instance, created: bool, **kwargs) -> None:
    if not created:
        return
    display_name = instance.email.split("@", 1)[0][:80] or "Learner"
    Profile.objects.get_or_create(user=instance, defaults={"display_name": display_name})


@receiver(user_logged_in)
def record_authentication_time(sender, request, user, **kwargs) -> None:
    request.session[AUTH_TIME_KEY] = timezone.now().timestamp()
