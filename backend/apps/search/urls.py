from __future__ import annotations

from django.urls import path

from .views import SearchSuggestionsView, SearchView

urlpatterns = [
    path("search/", SearchView.as_view(), name="search"),
    path("search/suggestions/", SearchSuggestionsView.as_view(), name="search-suggestions"),
]
