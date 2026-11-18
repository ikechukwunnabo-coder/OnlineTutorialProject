from __future__ import annotations

from rest_framework import serializers

from apps.catalog.models import Chapter
from apps.learning.models import Bookmark, UserProgress


class BookmarkTutorialSerializer(serializers.Serializer):
    title = serializers.CharField()
    slug = serializers.CharField()


class BookmarkChapterSerializer(serializers.ModelSerializer):
    tutorial = BookmarkTutorialSerializer(read_only=True)

    class Meta:
        model = Chapter
        fields = ("id", "title", "slug", "tutorial", "estimated_reading_time")


class BookmarkSerializer(serializers.ModelSerializer):
    chapter = BookmarkChapterSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ("id", "chapter", "created_at")


class BookmarkPageSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = BookmarkSerializer(many=True)


class BookmarkCreateSerializer(serializers.Serializer):
    chapter = serializers.IntegerField(min_value=1)


class ProgressUpdateSerializer(serializers.Serializer):
    completed = serializers.BooleanField(required=False)
    reading_position = serializers.IntegerField(min_value=0, max_value=100, required=False)

    def validate(self, attrs):
        if "completed" not in attrs and "reading_position" not in attrs:
            raise serializers.ValidationError(
                {"non_field_errors": ["Provide completed or reading_position."]}
            )
        return attrs


class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = ("chapter", "completed", "completed_at", "reading_position", "updated_at")


class ProgressTutorialSerializer(serializers.Serializer):
    title = serializers.CharField()
    slug = serializers.CharField()


class ProgressTutorialItemSerializer(serializers.Serializer):
    tutorial = ProgressTutorialSerializer()
    completed_chapters = serializers.IntegerField()
    total_chapters = serializers.IntegerField()
    percent = serializers.IntegerField()
    last_activity_at = serializers.DateTimeField()


class OverallProgressSerializer(serializers.Serializer):
    completed_chapters = serializers.IntegerField()
    started_tutorials = serializers.IntegerField()
    percent_complete = serializers.IntegerField()


class ProgressSummarySerializer(serializers.Serializer):
    overall = OverallProgressSerializer()
    tutorials = ProgressTutorialItemSerializer(many=True)
