from __future__ import annotations

from django.urls import path

from .views import BookmarkDetailView, BookmarksView, ProgressDetailView, ProgressView

urlpatterns = [
    path("bookmarks/", BookmarksView.as_view(), name="bookmarks"),
    path("bookmarks/<int:chapter_id>/", BookmarkDetailView.as_view(), name="bookmark-detail"),
    path("progress/", ProgressView.as_view(), name="progress"),
    path("progress/<int:chapter_id>/", ProgressDetailView.as_view(), name="progress-detail"),
]
