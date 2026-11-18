from __future__ import annotations

import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_response_includes_request_id(client):
    response = client.get(reverse("health"))
    assert len(response["X-Request-ID"]) == 32


@pytest.mark.django_db
def test_supplied_request_id_is_echoed(client):
    response = client.get(reverse("health"), HTTP_X_REQUEST_ID="request-12345")
    assert response["X-Request-ID"] == "request-12345"


@pytest.mark.django_db
def test_invalid_request_id_is_replaced(client):
    response = client.get(reverse("health"), HTTP_X_REQUEST_ID="bad")
    assert response["X-Request-ID"] != "bad"
    assert len(response["X-Request-ID"]) == 32
