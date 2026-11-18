from __future__ import annotations

import json

from django.test import override_settings

from apps.common import revalidation


class ImmediateThread:
    def __init__(self, target, **kwargs):
        self.target = target

    def start(self):
        self.target()


@override_settings(
    REVALIDATE_URL="http://frontend.test/api/revalidate",
    REVALIDATE_SECRET="test-secret",
)
def test_send_revalidation_posts_tags_and_paths(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["secret"] = request.get_header("X-revalidate-secret")
        captured["body"] = json.loads(request.data)

        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return b"{}"

        return Response()

    monkeypatch.setattr(revalidation.threading, "Thread", ImmediateThread)
    monkeypatch.setattr(revalidation, "urlopen", fake_urlopen)

    revalidation.send_revalidation(["catalog"], ["/tutorials"])

    assert captured == {
        "url": "http://frontend.test/api/revalidate",
        "secret": "test-secret",
        "body": {"tags": ["catalog"], "paths": ["/tutorials"]},
    }


@override_settings(REVALIDATE_URL="", REVALIDATE_SECRET="")
def test_send_revalidation_is_a_noop_without_configuration(monkeypatch):
    monkeypatch.setattr(
        revalidation.threading,
        "Thread",
        lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("thread started")),
    )

    revalidation.send_revalidation(["catalog"], ["/"])
