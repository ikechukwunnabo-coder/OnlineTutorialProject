from __future__ import annotations

import json
import time

import pytest
from django.core import mail, signing
from django.test import Client
from django.urls import reverse
from django.utils import timezone
from rest_framework.throttling import SimpleRateThrottle

from apps.accounts.models import User
from apps.accounts.tests.factories import UserFactory, VerifiedUserFactory
from apps.accounts.tokens import (
    EMAIL_VERIFICATION_SALT,
    encode_uid,
    make_email_verification_token,
    make_password_reset_token,
)
from apps.common.authentication import SessionAuthenticationScheme
from apps.contact.models import ContactMessage

PASSWORD = "test-password-12345"
NEW_PASSWORD = "new-password-67890"


@pytest.fixture(autouse=True)
def relaxed_throttles(monkeypatch):
    rates = dict(SimpleRateThrottle.THROTTLE_RATES)
    rates.update(
        {
            "anon": "1000/min",
            "user": "1000/min",
            "auth": "1000/hour",
            "password_reset": "1000/hour",
            "password_reset_email": "1000/hour",
        }
    )
    monkeypatch.setattr(SimpleRateThrottle, "THROTTLE_RATES", rates)


@pytest.fixture(autouse=True)
def clear_outbox():
    mail.outbox.clear()
    yield
    mail.outbox.clear()


def post_json(client, url_name, data):
    return client.post(
        reverse(url_name),
        data=json.dumps(data),
        content_type="application/json",
    )


def patch_json(client, url_name, data):
    return client.patch(
        reverse(url_name),
        data=json.dumps(data),
        content_type="application/json",
    )


def delete_json(client, url_name, data):
    return client.delete(
        reverse(url_name),
        data=json.dumps(data),
        content_type="application/json",
    )


def registration_payload(**overrides):
    payload = {
        "email": "new-learner@example.com",
        "password": PASSWORD,
        "display_name": "New Learner",
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
def test_csrf_sets_csrf_and_session_cookies(client):
    response = client.get(reverse("csrf"))

    assert response.status_code == 204
    assert response["Cache-Control"] == "no-store"
    assert "csrftoken" in response.cookies
    assert "bds_sessionid" in response.cookies


@pytest.mark.django_db
def test_register_creates_unverified_user_and_sends_verification(client):
    response = post_json(client, "register", registration_payload())

    assert response.status_code == 201
    assert response.json() == {"message": "Check your email to verify your account."}
    user = User.objects.get(email="new-learner@example.com")
    assert user.email_verified is False
    assert user.profile.display_name == "New Learner"
    assert len(mail.outbox) == 1
    assert "verify" in mail.outbox[0].subject.lower()
    assert "/verify-email?" in mail.outbox[0].body
    assert "token=" in mail.outbox[0].body


@pytest.mark.django_db
def test_register_existing_email_is_enumeration_safe(client):
    existing = UserFactory(email="existing@example.com")

    response = post_json(
        client,
        "register",
        registration_payload(email="EXISTING@example.com"),
    )

    assert response.status_code == 201
    assert response.json() == {"message": "Check your email to verify your account."}
    assert User.objects.filter(email__iexact="existing@example.com").count() == 1
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [existing.email]
    assert "registration attempt" in mail.outbox[0].subject.lower()


@pytest.mark.django_db
def test_register_rejects_weak_password_and_blank_display_name(client):
    weak = post_json(client, "register", registration_payload(password="short"))
    blank = post_json(client, "register", registration_payload(display_name="   "))

    assert weak.status_code == 400
    assert "password" in weak.json()["error"]["details"]
    assert blank.status_code == 400
    assert "display_name" in blank.json()["error"]["details"]
    assert not User.objects.filter(email="new-learner@example.com").exists()


@pytest.mark.django_db
def test_register_succeeds_when_email_delivery_fails(client, monkeypatch):
    def fail(*args, **kwargs):
        raise RuntimeError("smtp down")

    monkeypatch.setattr("apps.accounts.emails.send_mail", fail)

    response = post_json(client, "register", registration_payload())

    assert response.status_code == 201
    assert User.objects.filter(email="new-learner@example.com").exists()


@pytest.mark.django_db
def test_verify_email_verifies_user_and_logs_in(client):
    user = UserFactory()
    token = make_email_verification_token(user)

    response = post_json(client, "verify-email", {"token": token})

    assert response.status_code == 200
    assert response.json()["message"] == "Email verified."
    assert response.json()["user"]["email"] == user.email
    user.refresh_from_db()
    assert user.email_verified is True
    assert client.session["_auth_user_id"] == str(user.pk)
    assert "auth_time" in client.session


@pytest.mark.django_db
def test_verify_email_rejects_invalid_and_expired_tokens(client, monkeypatch):
    user = UserFactory()
    real_time = time.time
    with monkeypatch.context() as patch:
        patch.setattr("django.core.signing.time.time", lambda: real_time() - 90000)
        expired = signing.dumps(
            {"uid": user.pk, "email": user.email},
            salt=EMAIL_VERIFICATION_SALT,
            compress=True,
        )

    invalid_response = post_json(client, "verify-email", {"token": "not-a-token"})
    expired_response = post_json(client, "verify-email", {"token": expired})

    assert invalid_response.status_code == 400
    assert invalid_response.json()["error"]["code"] == "token_invalid_or_expired"
    assert expired_response.status_code == 400
    assert expired_response.json()["error"]["code"] == "token_invalid_or_expired"


@pytest.mark.django_db
def test_verify_email_is_idempotent_for_verified_user(client):
    user = VerifiedUserFactory()
    token = make_email_verification_token(user)

    response = post_json(client, "verify-email", {"token": token})

    assert response.status_code == 200
    assert response.json()["message"] == "Email verified."
    assert client.session["_auth_user_id"] == str(user.pk)


@pytest.mark.django_db
def test_resend_verification_is_enumeration_safe(client):
    response = post_json(client, "resend-verification", {"email": "missing@example.com"})

    assert response.status_code == 202
    assert response.json() == {
        "message": "If the account needs verification, an email has been sent."
    }
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_resend_verification_sends_for_unverified_user(client):
    user = UserFactory(email="unverified@example.com")

    response = post_json(client, "resend-verification", {"email": user.email})

    assert response.status_code == 202
    assert len(mail.outbox) == 1
    assert "/verify-email?" in mail.outbox[0].body


@pytest.mark.django_db
def test_resend_verification_uses_authenticated_account(client):
    user = UserFactory()
    client.force_login(user)

    response = post_json(client, "resend-verification", {})

    assert response.status_code == 202
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [user.email]


@pytest.mark.django_db
def test_resend_verification_requires_email_when_anonymous(client):
    response = post_json(client, "resend-verification", {})

    assert response.status_code == 400
    assert "email" in response.json()["error"]["details"]


@pytest.mark.django_db
def test_login_sets_session_csrf_and_last_login(client):
    user = VerifiedUserFactory(email="login@example.com")

    response = post_json(
        client,
        "login",
        {"email": "LOGIN@example.com", "password": PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Logged in."
    assert response.json()["user"]["email"] == user.email
    assert "bio" not in response.json()["user"]
    assert "csrftoken" in response.cookies
    assert client.session["_auth_user_id"] == str(user.pk)
    user.refresh_from_db()
    assert user.last_login is not None


@pytest.mark.django_db
def test_login_rejects_bad_unknown_and_inactive_accounts(client):
    UserFactory(email="inactive@example.com", is_active=False)

    bad = post_json(client, "login", {"email": "login@example.com", "password": "wrong"})
    unknown = post_json(
        client,
        "login",
        {"email": "missing@example.com", "password": PASSWORD},
    )
    inactive = post_json(
        client,
        "login",
        {"email": "inactive@example.com", "password": PASSWORD},
    )

    for response in (bad, unknown, inactive):
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "invalid_credentials"


@pytest.mark.django_db
def test_unverified_user_can_log_in(client):
    user = UserFactory()

    response = post_json(client, "login", {"email": user.email, "password": PASSWORD})

    assert response.status_code == 200
    assert response.json()["user"]["email_verified"] is False


@pytest.mark.django_db
def test_logout_flushes_session_and_is_idempotent(client):
    user = UserFactory()
    client.force_login(user)

    first = post_json(client, "logout", {})
    second = post_json(client, "logout", {})

    assert first.status_code == 204
    assert second.status_code == 204
    assert "_auth_user_id" not in client.session


@pytest.mark.django_db
def test_me_returns_anonymous_and_authenticated_shapes(client):
    anonymous = client.get(reverse("me"))

    user = VerifiedUserFactory()
    user.profile.bio = "Learning Python."
    user.profile.save()
    client.force_login(user)
    authenticated = client.get(reverse("me"))

    assert anonymous.status_code == 200
    assert anonymous.json() == {"authenticated": False, "user": None}
    assert anonymous["Cache-Control"] == "no-store"
    assert authenticated.status_code == 200
    assert authenticated.json()["authenticated"] is True
    assert authenticated.json()["user"]["bio"] == "Learning Python."


@pytest.mark.django_db
def test_profile_patch_allows_unverified_user(client):
    user = UserFactory()

    response = patch_json(
        client,
        "profile",
        {"display_name": "Alex Doe", "bio": "Learning Django."},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "authentication_required"

    client.force_login(user)
    response = patch_json(
        client,
        "profile",
        {"display_name": "Alex Doe", "bio": "Learning Django."},
    )

    assert response.status_code == 200
    assert response.json()["display_name"] == "Alex Doe"
    assert response.json()["bio"] == "Learning Django."
    user.profile.refresh_from_db()
    assert user.profile.display_name == "Alex Doe"


@pytest.mark.django_db
def test_profile_patch_rejects_blank_display_name(client):
    user = UserFactory()
    client.force_login(user)

    response = patch_json(client, "profile", {"display_name": "  "})

    assert response.status_code == 400
    assert "display_name" in response.json()["error"]["details"]


@pytest.mark.django_db
def test_password_reset_request_is_enumeration_safe(client):
    user = VerifiedUserFactory(email="reset@example.com")

    known = post_json(client, "password-reset", {"email": user.email})
    unknown = post_json(client, "password-reset", {"email": "missing@example.com"})

    assert known.status_code == 202
    assert unknown.status_code == 202
    assert known.json() == unknown.json()
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [user.email]
    assert "/reset-password?" in mail.outbox[0].body


@pytest.mark.django_db
def test_password_reset_confirm_changes_password_and_invalidates_sessions(client):
    user = VerifiedUserFactory()
    other = Client()
    other.force_login(user)
    other.session["auth_time"] = time.time() - 10
    other.session.save()
    token = make_password_reset_token(user)

    response = post_json(
        client,
        "password-reset-confirm",
        {"uid": encode_uid(user), "token": token, "new_password": NEW_PASSWORD},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Password updated. Please log in."}
    user.refresh_from_db()
    assert user.check_password(NEW_PASSWORD)
    assert not user.check_password(PASSWORD)
    assert other.get(reverse("me")).json()["authenticated"] is False

    reused = post_json(
        client,
        "password-reset-confirm",
        {"uid": encode_uid(user), "token": token, "new_password": NEW_PASSWORD},
    )
    assert reused.status_code == 400
    assert reused.json()["error"]["code"] == "token_invalid_or_expired"


@pytest.mark.django_db
def test_password_reset_confirm_rejects_invalid_token_and_weak_password(client):
    user = VerifiedUserFactory()
    token = make_password_reset_token(user)

    invalid = post_json(
        client,
        "password-reset-confirm",
        {"uid": "not-a-uid", "token": "not-a-token", "new_password": NEW_PASSWORD},
    )
    weak = post_json(
        client,
        "password-reset-confirm",
        {"uid": encode_uid(user), "token": token, "new_password": "123456789012"},
    )

    assert invalid.status_code == 400
    assert invalid.json()["error"]["code"] == "token_invalid_or_expired"
    assert weak.status_code == 400
    assert "new_password" in weak.json()["error"]["details"]


@pytest.mark.django_db
def test_password_change_reissues_current_session_and_revokes_others(client):
    user = VerifiedUserFactory()
    client.force_login(user)
    old_session_key = client.session.session_key
    other = Client()
    other.force_login(user)
    other.session["auth_time"] = time.time() - 10
    other.session.save()

    response = post_json(
        client,
        "password-change",
        {"current_password": PASSWORD, "new_password": NEW_PASSWORD},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Password updated."}
    assert client.session.session_key != old_session_key
    assert client.get(reverse("me")).json()["authenticated"] is True
    assert other.get(reverse("me")).json()["authenticated"] is False
    user.refresh_from_db()
    assert user.check_password(NEW_PASSWORD)


@pytest.mark.django_db
def test_password_change_rejects_wrong_current_and_unverified_user(client):
    user = VerifiedUserFactory()
    client.force_login(user)

    wrong = post_json(
        client,
        "password-change",
        {"current_password": "wrong-password", "new_password": NEW_PASSWORD},
    )

    assert wrong.status_code == 400
    assert "current_password" in wrong.json()["error"]["details"]

    unverified = UserFactory()
    client.force_login(unverified)
    response = post_json(
        client,
        "password-change",
        {"current_password": PASSWORD, "new_password": NEW_PASSWORD},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "email_not_verified"


@pytest.mark.django_db
def test_deactivate_account_sets_inactive_and_flushes_session(client):
    user = VerifiedUserFactory()

    client.force_login(user)
    response = post_json(client, "account-deactivate", {"password": PASSWORD})

    assert response.status_code == 204
    user.refresh_from_db()
    assert user.is_active is False
    assert "_auth_user_id" not in client.session
    assert len(mail.outbox) == 1
    assert "deactivated" in mail.outbox[0].subject.lower()


@pytest.mark.django_db
def test_deactivate_account_rejects_wrong_password(client):
    user = VerifiedUserFactory()
    client.force_login(user)

    response = post_json(client, "account-deactivate", {"password": "wrong-password"})

    assert response.status_code == 400
    assert "password" in response.json()["error"]["details"]


@pytest.mark.django_db
def test_delete_account_removes_user_and_anonymises_contact_messages(client):
    user = VerifiedUserFactory(email="delete@example.com")
    message = ContactMessage.objects.create(
        name="Delete Me",
        email="delete@example.com",
        subject="Hello",
        message="Please delete my data.",
    )
    client.force_login(user)

    response = delete_json(
        client,
        "account-delete",
        {"password": PASSWORD, "confirm": "DELETE"},
    )

    assert response.status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()
    message.refresh_from_db()
    assert message.email != "delete@example.com"
    assert message.name == "Deleted user"


@pytest.mark.django_db
def test_delete_account_requires_delete_confirmation(client):
    user = VerifiedUserFactory()
    client.force_login(user)

    response = delete_json(
        client,
        "account-delete",
        {"password": PASSWORD, "confirm": "delete"},
    )

    assert response.status_code == 400
    assert "confirm" in response.json()["error"]["details"]
    assert User.objects.filter(pk=user.pk).exists()


@pytest.mark.django_db
def test_login_is_throttled(client, monkeypatch):
    rates = dict(SimpleRateThrottle.THROTTLE_RATES)
    rates["auth"] = "2/hour"
    monkeypatch.setattr(SimpleRateThrottle, "THROTTLE_RATES", rates)

    first = post_json(client, "login", {"email": "a@example.com", "password": "wrong"})
    second = post_json(client, "login", {"email": "a@example.com", "password": "wrong"})
    third = post_json(client, "login", {"email": "a@example.com", "password": "wrong"})

    assert first.status_code == 401
    assert second.status_code == 401
    assert third.status_code == 429
    assert third.json()["error"]["code"] == "throttled"


@pytest.mark.django_db
def test_session_is_revoked_when_password_changed_at_moves_forward(client):
    user = VerifiedUserFactory()
    client.force_login(user)
    client.session["auth_time"] = time.time() - 10
    client.session.save()
    user.password_changed_at = timezone.now()
    user.save(update_fields=["password_changed_at"])

    response = client.get(reverse("me"))

    assert response.json() == {"authenticated": False, "user": None}
    assert "_auth_user_id" not in client.session


@pytest.mark.django_db
def test_common_password_is_rejected_by_register_and_change(client):
    numeric = "123456789012"
    register = post_json(client, "register", registration_payload(password=numeric))

    user = VerifiedUserFactory()
    client.force_login(user)
    change = post_json(
        client,
        "password-change",
        {"current_password": PASSWORD, "new_password": numeric},
    )

    assert register.status_code == 400
    assert "password" in register.json()["error"]["details"]
    assert change.status_code == 400
    assert "new_password" in change.json()["error"]["details"]


def test_openapi_session_scheme_uses_the_public_cookie_name():
    scheme = SessionAuthenticationScheme.get_security_definition(None, None)

    assert scheme == {"type": "apiKey", "in": "cookie", "name": "bds_sessionid"}
