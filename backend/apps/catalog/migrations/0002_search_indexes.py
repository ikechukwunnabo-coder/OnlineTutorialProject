from __future__ import annotations

from django.db import migrations

INDEXES = [
    (
        "catalog_category_name_gin",
        "catalog_category",
        "setweight(to_tsvector('english', coalesce(name, '')), 'A')",
    ),
    (
        "catalog_category_description_gin",
        "catalog_category",
        "setweight(to_tsvector('english', coalesce(description, '')), 'B')",
    ),
    (
        "catalog_tutorial_title_gin",
        "catalog_tutorial",
        "setweight(to_tsvector('english', coalesce(title, '')), 'A')",
    ),
    (
        "catalog_tutorial_summary_gin",
        "catalog_tutorial",
        "setweight(to_tsvector('english', coalesce(summary, '')), 'B')",
    ),
    (
        "catalog_chapter_title_gin",
        "catalog_chapter",
        "setweight(to_tsvector('english', coalesce(title, '')), 'A')",
    ),
    (
        "catalog_chapter_summary_gin",
        "catalog_chapter",
        "setweight(to_tsvector('english', coalesce(summary, '')), 'A')",
    ),
    (
        "catalog_chapter_content_gin",
        "catalog_chapter",
        "setweight(to_tsvector('english', coalesce(content, '')), 'B')",
    ),
]


def create_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    for name, table, expression in INDEXES:
        schema_editor.execute(
            f"CREATE INDEX IF NOT EXISTS {name} ON {table} USING gin ({expression})"
        )


def drop_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    for name, _, _ in INDEXES:
        schema_editor.execute(f"DROP INDEX IF EXISTS {name}")


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_indexes, drop_indexes),
    ]
