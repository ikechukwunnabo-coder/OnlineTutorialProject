from __future__ import annotations

import pytest

from apps.contact.models import ContactMessage, ContactStatus


@pytest.mark.django_db
def test_contact_message_defaults_to_new_status():
    message = ContactMessage.objects.create(
        name="Ada",
        email="ada@example.com",
        subject="Hello",
        message="A question about the tutorial.",
    )
    assert message.status == ContactStatus.NEW
    assert str(message) == "Hello (ada@example.com)"
