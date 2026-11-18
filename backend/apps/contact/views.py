from __future__ import annotations

import hashlib
import logging

from django.conf import settings
from django.core.mail import send_mail
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.http import no_store
from apps.common.throttles import ContactRateThrottle
from apps.contact.models import ContactMessage

from .serializers import ContactResponseSerializer, ContactSerializer

logger = logging.getLogger(__name__)

GENERIC_MESSAGE = "Thanks — your message has been received."


def hash_ip(request) -> str:
    ip = request.META.get("REMOTE_ADDR", "")
    return hashlib.sha256(f"{settings.SECRET_KEY}:{ip}".encode()).hexdigest()


class ContactView(APIView):
    permission_classes: list = []
    throttle_classes = [ContactRateThrottle]

    @extend_schema(request=ContactSerializer, responses=ContactResponseSerializer)
    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data.get("website"):
            return no_store(Response({"message": GENERIC_MESSAGE}, status=status.HTTP_201_CREATED))
        ContactMessage.objects.create(
            name=data["name"],
            email=data["email"],
            subject=data["subject"],
            message=data["message"],
            ip_hash=hash_ip(request),
        )
        try:
            send_mail(
                subject=f"Contact form: {data['subject']}",
                message=(f"From: {data['name']} <{data['email']}>\n\n{data['message']}"),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.CONTACT_RECIPIENT_EMAIL],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Contact notification email failed")
        return no_store(Response({"message": GENERIC_MESSAGE}, status=status.HTTP_201_CREATED))
