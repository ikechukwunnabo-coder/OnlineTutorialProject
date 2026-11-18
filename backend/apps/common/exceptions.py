from __future__ import annotations

from typing import Any

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    MethodNotAllowed,
    NotAuthenticated,
    NotFound,
    ParseError,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler


class ServiceUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "The service is temporarily unavailable."
    default_code = "service_unavailable"


class SearchQueryInvalid(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Search queries must be between 2 and 100 characters."
    default_code = "search_query_invalid"


class EmailNotVerified(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Verify your email address to use this feature."
    default_code = "email_not_verified"


class TokenInvalidOrExpired(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This token is invalid or has expired."
    default_code = "token_invalid_or_expired"


_EXCEPTION_MAP: list[tuple[type[BaseException], str, str]] = [
    (ValidationError, "validation_error", "Request validation failed."),
    (ParseError, "validation_error", "Malformed request body."),
    (SearchQueryInvalid, "search_query_invalid", "Search query is invalid."),
    (NotAuthenticated, "authentication_required", "Authentication is required."),
    (AuthenticationFailed, "invalid_credentials", "Invalid credentials."),
    (TokenInvalidOrExpired, "token_invalid_or_expired", "The token is invalid or expired."),
    (EmailNotVerified, "email_not_verified", "Email verification is required."),
    (PermissionDenied, "permission_denied", "You do not have permission to perform this action."),
    (NotFound, "not_found", "The requested resource was not found."),
    (MethodNotAllowed, "method_not_allowed", "Method not allowed."),
    (Throttled, "throttled", "Too many requests. Try again later."),
    (ServiceUnavailable, "service_unavailable", "The service is temporarily unavailable."),
]


def _error_details(data: Any) -> dict[str, Any]:
    if isinstance(data, dict):
        if set(data.keys()) == {"detail"}:
            return {}
        return data
    if isinstance(data, list):
        return {"non_field_errors": data}
    return {}


def api_exception_handler(exc: BaseException, context: dict[str, Any]) -> Response | None:
    """Return the documented error envelope for every DRF error."""
    if isinstance(exc, Http404):
        exc = NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = PermissionDenied()

    response = exception_handler(exc, context)
    if response is None:
        return None

    code = "server_error"
    message = "An unexpected error occurred."
    for exception_type, mapped_code, mapped_message in _EXCEPTION_MAP:
        if isinstance(exc, exception_type):
            code = mapped_code
            message = mapped_message
            break

    request = context.get("request")
    request_id = getattr(request, "request_id", "")
    response.data = {
        "error": {
            "code": code,
            "message": message,
            "details": _error_details(response.data),
            "request_id": request_id,
        }
    }
    return response
