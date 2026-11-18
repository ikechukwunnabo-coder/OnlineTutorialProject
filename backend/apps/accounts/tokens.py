from __future__ import annotations

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from .models import User

EMAIL_VERIFICATION_SALT = "accounts.email-verification"


def make_email_verification_token(user: User) -> str:
    return signing.dumps(
        {"uid": user.pk, "email": user.email},
        salt=EMAIL_VERIFICATION_SALT,
        compress=True,
    )


def user_from_email_verification_token(token: str) -> User | None:
    try:
        payload = signing.loads(
            token,
            salt=EMAIL_VERIFICATION_SALT,
            max_age=settings.EMAIL_VERIFICATION_TIMEOUT,
        )
    except signing.BadSignature, signing.SignatureExpired:
        return None
    uid = payload.get("uid")
    email = payload.get("email")
    if not uid or not email:
        return None
    return User.objects.filter(pk=uid, email__iexact=email, is_active=True).first()


def encode_uid(user: User) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def decode_uid(uid: str) -> int | None:
    try:
        return int(force_str(urlsafe_base64_decode(uid)))
    except TypeError, ValueError, OverflowError:
        return None


def make_password_reset_token(user: User) -> str:
    return default_token_generator.make_token(user)


def password_reset_token_is_valid(user: User, token: str) -> bool:
    return default_token_generator.check_token(user, token)
