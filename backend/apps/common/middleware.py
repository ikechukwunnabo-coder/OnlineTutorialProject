from __future__ import annotations

import re
from uuid import uuid4

from django.http import HttpRequest, HttpResponse

REQUEST_ID_HEADER = "X-Request-ID"
_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")


class RequestIDMiddleware:
    """Attach a request ID to every request and echo it on the response."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        supplied = request.headers.get(REQUEST_ID_HEADER, "")
        request_id = supplied if _VALID_REQUEST_ID.match(supplied) else uuid4().hex
        request.request_id = request_id  # type: ignore[attr-defined]
        response = self.get_response(request)
        response[REQUEST_ID_HEADER] = request_id
        return response
