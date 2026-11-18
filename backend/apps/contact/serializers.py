from __future__ import annotations

from rest_framework import serializers


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=1, max_length=100)
    email = serializers.EmailField(max_length=254)
    subject = serializers.CharField(min_length=1, max_length=160)
    message = serializers.CharField(min_length=10, max_length=5000)
    website = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=200,
        write_only=True,
    )


class ContactResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
