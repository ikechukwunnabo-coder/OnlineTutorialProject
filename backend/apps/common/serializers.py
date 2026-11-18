from __future__ import annotations

from rest_framework import serializers


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()


class ReadySerializer(serializers.Serializer):
    status = serializers.CharField()
    checks = serializers.DictField(child=serializers.CharField())
