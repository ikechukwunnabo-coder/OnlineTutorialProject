from __future__ import annotations

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.accounts.tests.factories import AdminFactory, UserFactory
from apps.catalog.models import Category, Chapter, CodeExample, Tutorial
from apps.common.choices import PublicationStatus


@pytest.mark.django_db
def test_seed_demo_creates_marked_demo_content():
    author = AdminFactory()
    call_command("seed_demo", author_email=author.email)

    assert Category.objects.filter(is_demo=True).count() == 4
    assert Tutorial.objects.filter(is_demo=True).count() == 5
    assert Chapter.objects.filter(is_demo=True).count() == 20
    assert CodeExample.objects.count() == 20
    assert Tutorial.objects.filter(is_demo=True, status=PublicationStatus.PUBLISHED).count() == 5
    assert all(
        tutorial.title.startswith("Demo: ") for tutorial in Tutorial.objects.filter(is_demo=True)
    )
    assert all(
        chapter.title.startswith("Demo: ") for chapter in Chapter.objects.filter(is_demo=True)
    )
    assert all(tutorial.estimated_reading_time >= 1 for tutorial in Tutorial.objects.all())


@pytest.mark.django_db
def test_seed_demo_is_idempotent():
    author = AdminFactory()
    call_command("seed_demo", author_email=author.email)
    call_command("seed_demo", author_email=author.email)

    assert Category.objects.count() == 4
    assert Tutorial.objects.count() == 5
    assert Chapter.objects.count() == 20
    assert CodeExample.objects.count() == 20


@pytest.mark.django_db
def test_seed_demo_uses_first_superuser_without_argument():
    AdminFactory(email="owner@example.com")
    call_command("seed_demo")
    assert Tutorial.objects.count() == 5


@pytest.mark.django_db
def test_seed_demo_requires_an_author():
    with pytest.raises(CommandError):
        call_command("seed_demo")


@pytest.mark.django_db
def test_seed_demo_rejects_non_staff_author():
    learner = UserFactory()
    with pytest.raises(CommandError):
        call_command("seed_demo", author_email=learner.email)


@pytest.mark.django_db
def test_purge_demo_content_removes_only_demo_records():
    author = AdminFactory()
    call_command("seed_demo", author_email=author.email)
    real_category = Category.objects.create(name="Real", slug="real", status="published")
    real_tutorial = Tutorial.objects.create(
        category=real_category,
        author=author,
        title="Real tutorial",
        slug="real-tutorial",
        summary="Real",
        status=PublicationStatus.DRAFT,
    )

    call_command("purge_demo_content")

    assert not Category.objects.filter(is_demo=True).exists()
    assert not Tutorial.objects.filter(is_demo=True).exists()
    assert not Chapter.objects.filter(is_demo=True).exists()
    assert Tutorial.objects.filter(pk=real_tutorial.pk).exists()
