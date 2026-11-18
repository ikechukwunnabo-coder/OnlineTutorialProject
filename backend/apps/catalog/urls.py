from __future__ import annotations

from django.urls import path

from .views import (
    CategoryDetailView,
    CategoryListView,
    ChapterDetailView,
    HomeView,
    RedirectView,
    TagListView,
    TutorialDetailView,
    TutorialListView,
)

urlpatterns = [
    path("home/", HomeView.as_view(), name="home"),
    path("categories/", CategoryListView.as_view(), name="categories"),
    path("categories/<slug:slug>/", CategoryDetailView.as_view(), name="category-detail"),
    path("tutorials/", TutorialListView.as_view(), name="tutorials"),
    path("tutorials/<slug:slug>/", TutorialDetailView.as_view(), name="tutorial-detail"),
    path(
        "tutorials/<slug:tutorial_slug>/chapters/<slug:chapter_slug>/",
        ChapterDetailView.as_view(),
        name="chapter-detail",
    ),
    path("tags/", TagListView.as_view(), name="tags"),
    path("redirects/", RedirectView.as_view(), name="redirects"),
]
