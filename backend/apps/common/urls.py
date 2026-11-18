from django.urls import path

from .views import HealthView, ReadyView, SchemaView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("ready/", ReadyView.as_view(), name="ready"),
    path("schema/", SchemaView.as_view(), name="schema"),
]
