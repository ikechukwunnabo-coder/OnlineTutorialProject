from __future__ import annotations

from django.test import RequestFactory
from rest_framework.exceptions import ValidationError

from apps.common.exceptions import api_exception_handler


def test_validation_errors_use_the_standard_envelope():
    request = RequestFactory().get("/api/v1/example/")
    request.request_id = "request-12345"

    response = api_exception_handler(
        ValidationError({"email": ["Enter a valid email address."]}),
        {"request": request},
    )

    assert response is not None
    assert response.status_code == 400
    assert response.data == {
        "error": {
            "code": "validation_error",
            "message": "Request validation failed.",
            "details": {"email": ["Enter a valid email address."]},
            "request_id": "request-12345",
        }
    }


def test_unhandled_exceptions_are_not_wrapped():
    response = api_exception_handler(RuntimeError("boom"), {})
    assert response is None
