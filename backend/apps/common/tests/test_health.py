from __future__ import annotations

from unittest.mock import patch

import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_health_endpoint_returns_ok(client):
    response = client.get(reverse("health"))
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.django_db
def test_ready_endpoint_reports_database_and_redis(client):
    response = client.get(reverse("ready"))
    assert response.status_code == 200
    assert response.json() == {
        "status": "ready",
        "checks": {"database": "ok", "redis": "ok"},
    }


@pytest.mark.django_db
def test_ready_endpoint_returns_503_when_database_fails(client):
    with patch("apps.common.views._database_ok", return_value=False):
        response = client.get(reverse("ready"))
    assert response.status_code == 503
    body = response.json()
    assert body["error"]["code"] == "service_unavailable"
    assert body["error"]["details"]["checks"]["database"] == "error"


@pytest.mark.django_db
def test_ready_endpoint_returns_503_when_cache_fails(client):
    with patch("apps.common.views._cache_ok", return_value=False):
        response = client.get(reverse("ready"))
    assert response.status_code == 503
    assert response.json()["error"]["details"]["checks"]["redis"] == "error"
