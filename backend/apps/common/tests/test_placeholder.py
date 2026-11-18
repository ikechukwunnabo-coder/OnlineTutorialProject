from __future__ import annotations

from django.urls import reverse


def test_placeholder_page_renders(client):
    response = client.get(reverse("placeholder"))
    assert response.status_code == 200
    assert b"Ben Digital Solution" in response.content
