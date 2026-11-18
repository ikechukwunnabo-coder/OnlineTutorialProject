from __future__ import annotations

from rest_framework.response import Response


def public_cache(response: Response, timeout: int) -> Response:
    response["Cache-Control"] = f"public, max-age={timeout}, stale-while-revalidate=60"
    return response


def no_store(response: Response) -> Response:
    response["Cache-Control"] = "no-store"
    return response


def private_no_store(response: Response) -> Response:
    response["Cache-Control"] = "private, no-store"
    return response
