from __future__ import annotations

from rest_framework import serializers


class SearchTutorialSerializer(serializers.Serializer):
    title = serializers.CharField()
    slug = serializers.CharField()


class SearchResultSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["category", "tutorial", "chapter"])
    title = serializers.CharField()
    excerpt = serializers.CharField(allow_blank=True)
    url = serializers.CharField()
    tutorial = SearchTutorialSerializer(allow_null=True)
    score = serializers.FloatField()


class SearchPageSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = SearchResultSerializer(many=True)


class SearchSuggestionSerializer(serializers.Serializer):
    title = serializers.CharField()
    url = serializers.CharField()
    type = serializers.ChoiceField(choices=["category", "tutorial", "chapter"])


class SearchSuggestionsSerializer(serializers.Serializer):
    suggestions = SearchSuggestionSerializer(many=True)
