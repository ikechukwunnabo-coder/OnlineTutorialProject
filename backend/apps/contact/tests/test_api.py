from __future__ import annotations

import json

import pytest
from django.core import mail
from django.urls import reverse

from apps.contact.models import ContactMessage


def post_json(client, data):
    return client.post(
        reverse("contact"),
        data=json.dumps(data),
        content_type="application/json",
    )


def valid_payload(**overrides):
    payload = {
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "subject": "Question about loops",
        "message": "How do I write a loop that counts down?",
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
def test_contact_creates_message_and_sends_email(client):
    response = post_json(client, valid_payload())

    assert response.status_code == 201
    assert response["Cache-Control"] == "no-store"
    message = ContactMessage.objects.get()
    assert message.email == "ada@example.com"
    assert message.ip_hash
    assert "127.0.0.1" not in message.ip_hash
    assert len(mail.outbox) == 1
    assert "Question about loops" in mail.outbox[0].subject


@pytest.mark.django_db
def test_contact_honeypot_is_silent(client):
    response = post_json(client, valid_payload(website="https://spam.example"))

    assert response.status_code == 201
    assert not ContactMessage.objects.exists()
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_contact_validates_required_fields(client):
    response = post_json(client, {"name": "Ada"})

    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "validation_error"
    assert set(body["error"]["details"]) == {"email", "subject", "message"}


@pytest.mark.django_db
def test_contact_succeeds_when_email_delivery_fails(client, monkeypatch):
    def fail(*args, **kwargs):
        raise RuntimeError("smtp down")

    monkeypatch.setattr("apps.contact.views.send_mail", fail)

    response = post_json(client, valid_payload())

    assert response.status_code == 201
    assert ContactMessage.objects.count() == 1


@pytest.mark.django_db
def test_contact_is_throttled(client):
    for _ in range(3):
        response = post_json(client, valid_payload())
        assert response.status_code == 201

    response = post_json(client, valid_payload())

    assert response.status_code == 429
    assert response.json()["error"]["code"] == "throttled"
    assert ContactMessage.objects.count() == 3


@pytest.mark.django_db
def test_contact_query_budget(client, django_assert_num_queries):
    with django_assert_num_queries(1):
        response = post_json(client, valid_payload())

    assert response.status_code == 201
