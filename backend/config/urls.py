"""Root URL configuration."""

from __future__ import annotations

from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

admin.site.site_header = "Ben Digital Solution administration"
admin.site.site_title = "Ben Digital Solution admin"
admin.site.index_title = "Administration"

urlpatterns = [
    path("", TemplateView.as_view(template_name="placeholder.html"), name="placeholder"),
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.common.urls")),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.catalog.urls")),
    path("api/v1/", include("apps.search.urls")),
    path("api/v1/", include("apps.learning.urls")),
    path("api/v1/", include("apps.contact.urls")),
]
