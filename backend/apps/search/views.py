from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.exceptions import SearchQueryInvalid
from apps.common.http import no_store
from apps.common.pagination import SearchPagination
from apps.common.throttles import SearchRateThrottle, SearchSuggestRateThrottle

from .serializers import (
    SearchPageSerializer,
    SearchResultSerializer,
    SearchSuggestionsSerializer,
)
from .services import search_content, suggestions

SEARCH_TYPES = {"all", "tutorials", "chapters", "categories"}


def validate_query(value: str | None) -> str:
    query = (value or "").strip()
    if len(query) < 2 or len(query) > 100:
        raise SearchQueryInvalid()
    return query


class SearchView(APIView):
    permission_classes: list = []
    throttle_classes = [SearchRateThrottle]

    @extend_schema(
        parameters=[
            OpenApiParameter("q", str, required=True),
            OpenApiParameter("type", str),
            OpenApiParameter("page", int),
            OpenApiParameter("page_size", int),
        ],
        responses=SearchPageSerializer,
    )
    def get(self, request):
        query = validate_query(request.query_params.get("q"))
        result_type = request.query_params.get("type", "all")
        if result_type not in SEARCH_TYPES:
            raise ValidationError({"type": ["Unknown search type."]})
        results = search_content(query, result_type)
        paginator = SearchPagination()
        page = paginator.paginate_queryset(results, request, view=self)
        serializer = SearchResultSerializer(page, many=True)
        return no_store(paginator.get_paginated_response(serializer.data))


class SearchSuggestionsView(APIView):
    permission_classes: list = []
    throttle_classes = [SearchSuggestRateThrottle]

    @extend_schema(
        parameters=[OpenApiParameter("q", str, required=True)],
        responses=SearchSuggestionsSerializer,
    )
    def get(self, request):
        query = validate_query(request.query_params.get("q"))
        data = {"suggestions": suggestions(query)}
        return no_store(Response(SearchSuggestionsSerializer(data).data))
