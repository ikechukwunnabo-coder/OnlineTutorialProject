from __future__ import annotations

from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.common.cache import REDIRECTS_KEY, bump_content_version, cache_delete
from apps.seo.models import SlugRedirect


def _invalidate_redirects() -> None:
    cache_delete(REDIRECTS_KEY)
    bump_content_version()


@receiver(post_save, sender=SlugRedirect)
@receiver(post_delete, sender=SlugRedirect)
def redirect_changed(sender, instance: SlugRedirect, **kwargs) -> None:
    transaction.on_commit(_invalidate_redirects)
