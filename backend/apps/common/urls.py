from django.urls import path

from .views import (
    ConsoleCategoryDetailView,
    ConsoleCategoryListView,
    ConsoleChapterDetailView,
    ConsoleChapterListView,
    ConsoleOverviewView,
    ConsoleTutorialDetailView,
    ConsoleTutorialListView,
    HealthView,
    ReadyView,
    SchemaView,
)

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("ready/", ReadyView.as_view(), name="ready"),
    path("schema/", SchemaView.as_view(), name="schema"),
    path("admin/overview/", ConsoleOverviewView.as_view(), name="admin-overview"),
    path("admin/content/categories/", ConsoleCategoryListView.as_view(), name="console-categories"),
    path(
        "admin/content/categories/<int:pk>/",
        ConsoleCategoryDetailView.as_view(),
        name="console-category-detail",
    ),
    path("admin/content/tutorials/", ConsoleTutorialListView.as_view(), name="console-tutorials"),
    path(
        "admin/content/tutorials/<int:pk>/",
        ConsoleTutorialDetailView.as_view(),
        name="console-tutorial-detail",
    ),
    path("admin/content/chapters/", ConsoleChapterListView.as_view(), name="console-chapters"),
    path(
        "admin/content/chapters/<int:pk>/",
        ConsoleChapterDetailView.as_view(),
        name="console-chapter-detail",
    ),
]
