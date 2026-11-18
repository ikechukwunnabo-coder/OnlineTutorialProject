from __future__ import annotations

from rest_framework import serializers


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()


class ReadySerializer(serializers.Serializer):
    status = serializers.CharField()
    checks = serializers.DictField(child=serializers.CharField())


class ConsoleCountsSerializer(serializers.Serializer):
    categories = serializers.IntegerField()
    tutorials = serializers.IntegerField()
    chapters = serializers.IntegerField()
    users = serializers.IntegerField()
    contact_messages = serializers.IntegerField()
    drafts = serializers.IntegerField()
    published = serializers.IntegerField()
    archived = serializers.IntegerField()
    demo_content = serializers.IntegerField()


class ConsoleStatusCountSerializer(serializers.Serializer):
    status = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField()


class ConsoleContentItemSerializer(serializers.Serializer):
    kind = serializers.CharField()
    title = serializers.CharField()
    parent = serializers.CharField(allow_blank=True)
    slug = serializers.CharField()
    status = serializers.CharField()
    updated_at = serializers.DateTimeField()


class ConsoleActivitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    actor = serializers.CharField(allow_null=True)
    action = serializers.CharField()
    model_label = serializers.CharField()
    object_id = serializers.CharField()
    created_at = serializers.DateTimeField()


class ConsoleOverviewSerializer(serializers.Serializer):
    generated_at = serializers.DateTimeField()
    role = serializers.CharField()
    counts = ConsoleCountsSerializer()
    content_by_status = ConsoleStatusCountSerializer(many=True)
    recent_content = ConsoleContentItemSerializer(many=True)
    recent_activity = ConsoleActivitySerializer(many=True)
