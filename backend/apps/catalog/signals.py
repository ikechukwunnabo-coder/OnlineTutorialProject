from __future__ import annotations

from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from apps.catalog.models import (
    Category,
    Chapter,
    ChapterImage,
    CodeExample,
    Tag,
    Tutorial,
    VideoEmbed,
)
from apps.common.cache import (
    CATEGORIES_KEY,
    HOME_KEY,
    TAGS_KEY,
    bump_content_version,
    cache_delete,
    category_key,
    chapter_key,
    tutorial_key,
)
from apps.common.revalidation import send_revalidation


def _unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


def _category_slug(category_id: int | None) -> str | None:
    if not category_id:
        return None
    return Category.objects.filter(pk=category_id).values_list("slug", flat=True).first()


def _tutorial_context(tutorial_id: int | None) -> tuple[str | None, str | None]:
    if not tutorial_id:
        return None, None
    row = Tutorial.objects.filter(pk=tutorial_id).values_list("slug", "category__slug").first()
    return row if row else (None, None)


def _invalidate_category(slug: str, previous_slug: str | None = None) -> None:
    keys = [HOME_KEY, CATEGORIES_KEY, category_key(slug)]
    if previous_slug and previous_slug != slug:
        keys.append(category_key(previous_slug))
    cache_delete(*keys)
    bump_content_version()
    send_revalidation(
        tags=_unique(
            [
                "home",
                "catalog",
                f"category:{slug}",
                f"category:{previous_slug}" if previous_slug else "",
            ]
        ),
        paths=_unique(
            [
                "/",
                "/categories",
                "/tutorials",
                f"/categories/{slug}",
                f"/categories/{previous_slug}" if previous_slug else "",
            ]
        ),
    )


def _invalidate_tutorial(
    slug: str,
    category_slug: str | None,
    previous_slug: str | None = None,
    previous_category_slug: str | None = None,
) -> None:
    keys = [HOME_KEY, CATEGORIES_KEY, TAGS_KEY, tutorial_key(slug)]
    if category_slug:
        keys.append(category_key(category_slug))
    if previous_slug and previous_slug != slug:
        keys.append(tutorial_key(previous_slug))
    if previous_category_slug and previous_category_slug != category_slug:
        keys.append(category_key(previous_category_slug))
    cache_delete(*keys)
    bump_content_version()
    send_revalidation(
        tags=_unique(
            [
                "home",
                "catalog",
                f"tutorial:{slug}",
                f"tutorial:{previous_slug}" if previous_slug else "",
                f"category:{category_slug}" if category_slug else "",
                f"category:{previous_category_slug}" if previous_category_slug else "",
            ]
        ),
        paths=_unique(
            [
                "/",
                "/tutorials",
                "/categories",
                f"/tutorials/{slug}",
                f"/tutorials/{previous_slug}" if previous_slug else "",
                f"/categories/{category_slug}" if category_slug else "",
                f"/categories/{previous_category_slug}" if previous_category_slug else "",
            ]
        ),
    )


def _invalidate_chapter(
    tutorial_slug: str,
    category_slug: str | None,
    chapter_slug: str,
    previous_tutorial_slug: str | None = None,
    previous_chapter_slug: str | None = None,
) -> None:
    keys = [
        HOME_KEY,
        tutorial_key(tutorial_slug),
        chapter_key(tutorial_slug, chapter_slug),
    ]
    if category_slug:
        keys.append(category_key(category_slug))
    if previous_tutorial_slug and previous_tutorial_slug != tutorial_slug:
        keys.append(tutorial_key(previous_tutorial_slug))
        keys.append(chapter_key(previous_tutorial_slug, previous_chapter_slug or chapter_slug))
    elif previous_chapter_slug and previous_chapter_slug != chapter_slug:
        keys.append(chapter_key(tutorial_slug, previous_chapter_slug))
    cache_delete(*keys)
    bump_content_version()
    send_revalidation(
        tags=_unique(
            [
                "home",
                "catalog",
                f"chapter:{tutorial_slug}/{chapter_slug}",
                f"tutorial:{tutorial_slug}",
                f"category:{category_slug}" if category_slug else "",
                (
                    f"chapter:{previous_tutorial_slug}/{previous_chapter_slug or chapter_slug}"
                    if previous_tutorial_slug
                    else ""
                ),
                f"tutorial:{previous_tutorial_slug}" if previous_tutorial_slug else "",
                (
                    f"chapter:{tutorial_slug}/{previous_chapter_slug}"
                    if previous_chapter_slug
                    else ""
                ),
            ]
        ),
        paths=_unique(
            [
                "/",
                "/tutorials",
                "/categories",
                f"/tutorials/{tutorial_slug}",
                f"/tutorials/{tutorial_slug}/{chapter_slug}",
                f"/categories/{category_slug}" if category_slug else "",
                (
                    f"/tutorials/{previous_tutorial_slug}/{previous_chapter_slug or chapter_slug}"
                    if previous_tutorial_slug
                    else ""
                ),
                f"/tutorials/{previous_tutorial_slug}" if previous_tutorial_slug else "",
                (
                    f"/tutorials/{tutorial_slug}/{previous_chapter_slug}"
                    if previous_chapter_slug
                    else ""
                ),
            ]
        ),
    )


@receiver(pre_save, sender=Category)
def capture_category_slug(sender, instance: Category, **kwargs) -> None:
    if instance.pk:
        vars(instance)["_previous_slug"] = (
            Category.objects.filter(pk=instance.pk).values_list("slug", flat=True).first()
        )


@receiver(pre_save, sender=Tutorial)
def capture_tutorial_slug(sender, instance: Tutorial, **kwargs) -> None:
    if instance.pk:
        row = Tutorial.objects.filter(pk=instance.pk).values_list("slug", "category_id").first()
        if row:
            vars(instance)["_previous_slug"] = row[0]
            vars(instance)["_previous_category_id"] = row[1]


@receiver(pre_save, sender=Chapter)
def capture_chapter_slug(sender, instance: Chapter, **kwargs) -> None:
    if instance.pk:
        row = Chapter.objects.filter(pk=instance.pk).values_list("slug", "tutorial_id").first()
        if row:
            vars(instance)["_previous_slug"] = row[0]
            vars(instance)["_previous_tutorial_id"] = row[1]


@receiver(post_save, sender=Category)
def category_saved(sender, instance: Category, raw: bool, **kwargs) -> None:
    if raw:
        return
    slug = instance.slug
    previous = getattr(instance, "_previous_slug", None)
    transaction.on_commit(lambda: _invalidate_category(slug, previous))


@receiver(post_delete, sender=Category)
def category_deleted(sender, instance: Category, **kwargs) -> None:
    slug = instance.slug
    transaction.on_commit(lambda: _invalidate_category(slug))


@receiver(post_save, sender=Tutorial)
def tutorial_saved(sender, instance: Tutorial, raw: bool, **kwargs) -> None:
    if raw:
        return
    slug = instance.slug
    category_slug = _category_slug(instance.category_id)
    previous_slug = getattr(instance, "_previous_slug", None)
    previous_category_id = getattr(instance, "_previous_category_id", None)
    previous_category_slug = _category_slug(previous_category_id)
    transaction.on_commit(
        lambda: _invalidate_tutorial(
            slug,
            category_slug,
            previous_slug,
            previous_category_slug,
        )
    )


@receiver(post_delete, sender=Tutorial)
def tutorial_deleted(sender, instance: Tutorial, **kwargs) -> None:
    slug = instance.slug
    category_slug = _category_slug(instance.category_id)
    transaction.on_commit(lambda: _invalidate_tutorial(slug, category_slug))


@receiver(post_save, sender=Chapter)
def chapter_saved(sender, instance: Chapter, raw: bool, **kwargs) -> None:
    if raw:
        return
    tutorial_slug, category_slug = _tutorial_context(instance.tutorial_id)
    if not tutorial_slug:
        return
    chapter_slug = instance.slug
    previous_slug = getattr(instance, "_previous_slug", None)
    previous_tutorial_id = getattr(instance, "_previous_tutorial_id", None)
    previous_tutorial_slug, _ = _tutorial_context(previous_tutorial_id)
    transaction.on_commit(
        lambda: _invalidate_chapter(
            tutorial_slug,
            category_slug,
            chapter_slug,
            previous_tutorial_slug,
            previous_slug,
        )
    )


@receiver(post_delete, sender=Chapter)
def chapter_deleted(sender, instance: Chapter, **kwargs) -> None:
    tutorial_slug, category_slug = _tutorial_context(instance.tutorial_id)
    if not tutorial_slug:
        return
    chapter_slug = instance.slug
    transaction.on_commit(lambda: _invalidate_chapter(tutorial_slug, category_slug, chapter_slug))


@receiver(post_save, sender=CodeExample)
@receiver(post_delete, sender=CodeExample)
def code_example_changed(sender, instance: CodeExample, **kwargs) -> None:
    tutorial_slug, _ = _tutorial_context(instance.chapter.tutorial_id)
    if tutorial_slug:
        chapter_slug = instance.chapter.slug
        transaction.on_commit(lambda: cache_delete(chapter_key(tutorial_slug, chapter_slug)))


@receiver(post_save, sender=ChapterImage)
@receiver(post_delete, sender=ChapterImage)
@receiver(post_save, sender=VideoEmbed)
@receiver(post_delete, sender=VideoEmbed)
def chapter_media_changed(sender, instance: ChapterImage | VideoEmbed, **kwargs) -> None:
    tutorial_slug, _ = _tutorial_context(instance.chapter.tutorial_id)
    if tutorial_slug:
        chapter_slug = instance.chapter.slug
        transaction.on_commit(lambda: cache_delete(chapter_key(tutorial_slug, chapter_slug)))


def _invalidate_tags() -> None:
    cache_delete(TAGS_KEY)
    bump_content_version()


@receiver(post_save, sender=Tag)
@receiver(post_delete, sender=Tag)
def tag_changed(sender, instance: Tag, **kwargs) -> None:
    transaction.on_commit(_invalidate_tags)
