from __future__ import annotations

import logging
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import send_mail

from .models import User
from .tokens import encode_uid, make_email_verification_token, make_password_reset_token

logger = logging.getLogger(__name__)


def _site_url(path: str, params: dict[str, str]) -> str:
    base = settings.SITE_URL.rstrip("/")
    return f"{base}{path}?{urlencode(params)}"


def _send(subject: str, body: str, recipient: str) -> bool:
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Transactional email delivery failed")
        return False
    return True


def send_verification_email(user: User) -> bool:
    token = make_email_verification_token(user)
    link = _site_url("/verify-email", {"token": token})
    body = (
        f"Hi {user.get_short_name()},\n\n"
        f"Verify your {settings.SITE_NAME} account by opening this link:\n\n"
        f"{link}\n\n"
        "This link expires in 24 hours. If you did not create an account, ignore this email."
    )
    return _send(f"Verify your {settings.SITE_NAME} account", body, user.email)


def send_registration_attempt_email(user: User) -> bool:
    body = (
        f"Hi {user.get_short_name()},\n\n"
        f"Someone tried to register a {settings.SITE_NAME} account with this email address.\n"
        "If this was you, sign in or reset your password. Otherwise, no action is needed."
    )
    return _send(f"Registration attempt for {settings.SITE_NAME}", body, user.email)


def send_password_reset_email(user: User) -> bool:
    token = make_password_reset_token(user)
    link = _site_url("/reset-password", {"uid": encode_uid(user), "token": token})
    body = (
        f"Hi {user.get_short_name()},\n\n"
        f"Reset your {settings.SITE_NAME} password by opening this link:\n\n"
        f"{link}\n\n"
        "This link expires in 24 hours. If you did not request a reset, ignore this email."
    )
    return _send(f"Reset your {settings.SITE_NAME} password", body, user.email)


def send_deactivation_email(user: User) -> bool:
    body = (
        f"Hi {user.get_short_name()},\n\n"
        f"Your {settings.SITE_NAME} account has been deactivated. "
        "Contact support if you believe this was a mistake."
    )
    return _send(f"Your {settings.SITE_NAME} account was deactivated", body, user.email)
