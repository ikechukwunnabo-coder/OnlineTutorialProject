from __future__ import annotations

from typing import Any

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from apps.common.exceptions import TokenInvalidOrExpired

from .models import Profile, User
from .tokens import decode_uid, password_reset_token_is_valid


def _check_password(value: str, user: User | None = None) -> None:
    try:
        validate_password(value, user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(exc.messages) from exc


class UserSummarySerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    email_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "role", "display_name", "email_verified", "date_joined")

    def get_display_name(self, obj: User) -> str:
        profile = getattr(obj, "profile", None)
        return profile.display_name if profile else ""


class UserProfileSerializer(UserSummarySerializer):
    bio = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "role",
            "display_name",
            "email_verified",
            "date_joined",
            "bio",
        )

    def get_bio(self, obj: User) -> str:
        profile = getattr(obj, "profile", None)
        return profile.bio if profile else ""


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        min_length=12,
        max_length=128,
        trim_whitespace=False,
        write_only=True,
    )
    display_name = serializers.CharField(min_length=1, max_length=80)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_display_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Display name cannot be blank.")
        return value

    def validate_password(self, value: str) -> str:
        _check_password(value)
        return value

    def create(self, validated_data: dict[str, Any]) -> User:
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
        )
        Profile.objects.update_or_create(
            user=user,
            defaults={"display_name": validated_data["display_name"]},
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(max_length=128, trim_whitespace=False, write_only=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].strip().lower(),
            password=attrs["password"],
        )
        if user is None:
            raise AuthenticationFailed()
        attrs["user"] = user
        return attrs


class LoginResponseSerializer(serializers.Serializer):
    user = UserSummarySerializer()
    message = serializers.CharField()


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=2048, trim_whitespace=True)


class VerifyEmailResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user = UserSummarySerializer()


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254, required=False, allow_blank=True)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class MeResponseSerializer(serializers.Serializer):
    authenticated = serializers.BooleanField()
    user = UserProfileSerializer(allow_null=True)


class ProfileUpdateSerializer(serializers.Serializer):
    display_name = serializers.CharField(min_length=1, max_length=80, required=False)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate_display_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Display name cannot be blank.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(max_length=128)
    token = serializers.CharField(max_length=512)
    new_password = serializers.CharField(
        min_length=12,
        max_length=128,
        trim_whitespace=False,
        write_only=True,
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        uid = decode_uid(attrs["uid"])
        user = User.objects.filter(pk=uid, is_active=True).first() if uid else None
        if user is None or not password_reset_token_is_valid(user, attrs["token"]):
            raise TokenInvalidOrExpired()
        try:
            _check_password(attrs["new_password"], user)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"new_password": exc.detail}) from exc
        attrs["user"] = user
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        max_length=128,
        trim_whitespace=False,
        write_only=True,
    )
    new_password = serializers.CharField(
        min_length=12,
        max_length=128,
        trim_whitespace=False,
        write_only=True,
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        user = self.context["user"]
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError(
                {"current_password": ["Current password is incorrect."]}
            )
        try:
            _check_password(attrs["new_password"], user)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"new_password": exc.detail}) from exc
        return attrs


class PasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=128, trim_whitespace=False, write_only=True)


class DeleteAccountSerializer(PasswordSerializer):
    confirm = serializers.CharField(max_length=16)

    def validate_confirm(self, value: str) -> str:
        if value != "DELETE":
            raise serializers.ValidationError('Type "DELETE" to confirm.')
        return value
