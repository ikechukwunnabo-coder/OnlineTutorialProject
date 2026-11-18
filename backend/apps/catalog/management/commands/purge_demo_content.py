from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import Category, Chapter, CodeExample, Tutorial


class Command(BaseCommand):
    help = "Delete all demo content created by seed_demo."

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        tutorials = Tutorial.objects.filter(is_demo=True)
        chapter_count = Chapter.objects.filter(tutorial__in=tutorials).count()
        code_count = CodeExample.objects.filter(chapter__tutorial__in=tutorials).count()
        tutorial_count = tutorials.count()
        tutorials.delete()

        categories = Category.objects.filter(is_demo=True)
        category_count = categories.count()
        categories.delete()

        self.stdout.write(
            self.style.SUCCESS(
                "Removed demo content: "
                f"{category_count} categories, {tutorial_count} tutorials, "
                f"{chapter_count} chapters, {code_count} code examples."
            )
        )
