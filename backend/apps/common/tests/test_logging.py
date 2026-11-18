from __future__ import annotations

import json
import logging
import sys

from apps.common.logging import JsonFormatter


def test_json_formatter_includes_safe_fields():
    record = logging.LogRecord(
        name="bds.test",
        level=logging.WARNING,
        pathname=__file__,
        lineno=1,
        msg="Something happened for %s",
        args=("request",),
        exc_info=None,
    )
    record.request_id = "request-12345"

    payload = json.loads(JsonFormatter().format(record))

    assert payload["level"] == "WARNING"
    assert payload["logger"] == "bds.test"
    assert payload["message"] == "Something happened for request"
    assert payload["request_id"] == "request-12345"
    assert "password" not in payload


def test_json_formatter_includes_exception():
    try:
        raise ValueError("boom")
    except ValueError:
        record = logging.LogRecord(
            name="bds.test",
            level=logging.ERROR,
            pathname=__file__,
            lineno=1,
            msg="Failed",
            args=(),
            exc_info=sys.exc_info(),
        )

    payload = json.loads(JsonFormatter().format(record))

    assert "ValueError: boom" in payload["exception"]
