from __future__ import annotations

from django.conf import settings
from django.contrib.auth import login, logout, update_session_auth_hash
from django.db import IntegrityError
from django.middleware.csrf import get_token, rotate_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.authentication import AUTH_TIME_KEY
from apps.common.exceptions import TokenInvalidOrExpired
from apps.common.permissions import IsVerifiedLearner
from apps.common.throttles import (
    AnonUserRateThrottle,
    AuthRateThrottle,
    PasswordResetEmailRateThrottle,
    PasswordResetRateThrottle,
)
from apps.common.views import NoStoreMixin
from apps.contact.models import ContactMessage

from .emails import (
    send_deactivation_email,
    send_password_reset_email,
    send_registration_attempt_email,
    send_verification_email,
)
from .models import Profile, User
from .serializers import (
    DeleteAccountSerializer,
    LoginResponseSerializer,
    LoginSerializer,
    MeResponseSerializer,
    MessageSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    UserProfileSerializer,
    UserSummarySerializer,
    VerifyEmailResponseSerializer,
    VerifyEmailSerializer,
)
from .tokens import user_from_email_verification_token

REGISTER_MESSAGE = "Check your email to verify your account."
RESEND_MESSAGE = "If the account needs verification, an email has been sent."
RESET_MESSAGE = "If an account exists, a reset email has been sent."


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(NoStoreMixin):
    authentication_classes: list = []
    permission_classes = [AllowAny]

    @extend_schema(responses={204: None})
    def get(self, request):
        if not request.session.session_key:
            request.session.create()
        rotate_token(request)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response["X-CSRFToken"] = get_token(request)
        return response


class RegisterView(NoStoreMixin):
    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(request=RegisterSerializer, responses={201: MessageSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        existing = User.objects.filter(email__iexact=email).first()
        if existing is not None:
            send_registration_attempt_email(existing)
            return Response({"message": REGISTER_MESSAGE}, status=status.HTTP_201_CREATED)
        try:
            user = serializer.save()
        except IntegrityError:
            existing = User.objects.filter(email__iexact=email).first()
            if existing is not None:
                send_registration_attempt_email(existing)
            return Response({"message": REGISTER_MESSAGE}, status=status.HTTP_201_CREATED)
        send_verification_email(user)
        return Response({"message": REGISTER_MESSAGE}, status=status.HTTP_201_CREATED)


class VerifyEmailView(NoStoreMixin):
    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        request=VerifyEmailSerializer,
        responses={200: VerifyEmailResponseSerializer},
    )
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = user_from_email_verification_token(serializer.validated_data["token"])
        if user is None:
            raise TokenInvalidOrExpired()
        if not user.email_verified:
            user.email_verified_at = timezone.now()
            user.save(update_fields=["email_verified_at"])
        login(request, user)
        rotate_token(request)
        return Response(
            {
                "message": "Email verified.",
                "user": UserSummarySerializer(user).data,
            }
        )


class ResendVerificationView(NoStoreMixin):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(request=ResendVerificationSerializer, responses={202: MessageSerializer})
    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        if user is None:
            email = serializer.validated_data.get("email")
            if not email:
                raise ValidationError({"email": ["This field is required."]})
            user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user is not None and user.is_active and not user.email_verified:
            send_verification_email(user)
        return Response({"message": RESEND_MESSAGE}, status=status.HTTP_202_ACCEPTED)


class LoginView(NoStoreMixin):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(request=LoginSerializer, responses={200: LoginResponseSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        rotate_token(request)
        return Response(
            {
                "user": UserSummarySerializer(user).data,
                "message": "Logged in.",
            }
        )


class LogoutView(NoStoreMixin):
    permission_classes = [AllowAny]

    @extend_schema(request=None, responses={204: None})
    def post(self, request):
        logout(request)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(settings.SESSION_COOKIE_NAME)
        return response


class MeView(NoStoreMixin):
    permission_classes = [AllowAny]

    @extend_schema(responses={200: MeResponseSerializer})
    def get(self, request):
        if request.user.is_authenticated:
            return Response(
                {
                    "authenticated": True,
                    "user": UserProfileSerializer(request.user).data,
                }
            )
        return Response({"authenticated": False, "user": None})


class ProfileView(NoStoreMixin):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ProfileUpdateSerializer, responses={200: UserProfileSerializer})
    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile, _ = Profile.objects.get_or_create(
            user=request.user,
            defaults={"display_name": request.user.email.split("@", 1)[0][:80] or "Learner"},
        )
        for field, value in serializer.validated_data.items():
            setattr(profile, field, value)
        profile.save()
        return Response(UserProfileSerializer(request.user).data)


class PasswordResetRequestView(NoStoreMixin):
    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle, PasswordResetEmailRateThrottle]

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={202: MessageSerializer},
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(
            email__iexact=serializer.validated_data["email"],
            is_active=True,
        ).first()
        if user is not None:
            send_password_reset_email(user)
        return Response({"message": RESET_MESSAGE}, status=status.HTTP_202_ACCEPTED)


class PasswordResetConfirmView(NoStoreMixin):
    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle, PasswordResetEmailRateThrottle]

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={200: MessageSerializer},
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "password_changed_at"])
        return Response({"message": "Password updated. Please log in."})


class PasswordChangeView(NoStoreMixin):
    permission_classes = [IsVerifiedLearner]
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(request=PasswordChangeSerializer, responses={200: MessageSerializer})
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"user": request.user},
        )
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "password_changed_at"])
        update_session_auth_hash(request, user)
        request.session[AUTH_TIME_KEY] = timezone.now().timestamp()
        rotate_token(request)
        return Response({"message": "Password updated."})


class DeactivateAccountView(NoStoreMixin):
    permission_classes = [IsVerifiedLearner]
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(request=PasswordSerializer, responses={204: None})
    def post(self, request):
        serializer = PasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["password"]):
            raise ValidationError({"password": ["Password is incorrect."]})
        user.is_active = False
        user.save(update_fields=["is_active"])
        send_deactivation_email(user)
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DeleteAccountView(NoStoreMixin):
    permission_classes = [IsVerifiedLearner]
    throttle_classes = [AnonUserRateThrottle]

    @extend_schema(request=DeleteAccountSerializer, responses={204: None})
    def delete(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["password"]):
            raise ValidationError({"password": ["Password is incorrect."]})
        ContactMessage.objects.filter(email__iexact=user.email).update(
            name="Deleted user",
            email=f"deleted-{user.pk}@example.invalid",
        )
        logout(request)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
