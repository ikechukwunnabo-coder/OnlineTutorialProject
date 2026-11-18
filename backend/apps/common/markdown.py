from __future__ import annotations

import html
import re
from typing import Any

import markdown
import nh3
from django.utils.html import escape

ALLOWED_TAGS = {
    "a",
    "blockquote",
    "br",
    "code",
    "em",
    "h2",
    "h3",
    "h4",
    "hr",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
}

ALLOWED_ATTRIBUTES = {
    "a": {"href", "title"},
    "code": {"class"},
    "h2": {"id"},
    "h3": {"id"},
    "h4": {"id"},
    "img": {"src", "alt", "title"},
}

REMOVED_CONTENT_TAGS = {"script", "style", "iframe", "object", "embed", "form", "input"}

_WORD_RE = re.compile(r"\s+")


def render_markdown(source: str) -> tuple[str, list[dict[str, Any]]]:
    renderer = markdown.Markdown(extensions=["extra", "sane_lists", "toc"])
    rendered = renderer.convert(source or "")
    clean = nh3.clean(
        rendered,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        clean_content_tags=REMOVED_CONTENT_TAGS,
        url_schemes={"http", "https", "mailto"},
    )
    toc: list[dict[str, Any]] = []
    _flatten_toc(getattr(renderer, "toc_tokens", []), toc)
    return clean, toc


def _flatten_toc(tokens: list[dict[str, Any]], output: list[dict[str, Any]]) -> None:
    for token in tokens:
        if token.get("level") in (2, 3):
            output.append(
                {
                    "id": token.get("id", ""),
                    "text": token.get("name", ""),
                    "level": token.get("level"),
                }
            )
        _flatten_toc(token.get("children", []), output)


def plain_text(source: str) -> str:
    rendered = markdown.markdown(source or "", extensions=["extra", "sane_lists"])
    stripped = nh3.clean(rendered, tags=set(), clean_content_tags=REMOVED_CONTENT_TAGS)
    return _WORD_RE.sub(" ", html.unescape(stripped)).strip()


def search_terms(query: str) -> list[str]:
    return [term for term in re.split(r"\s+", query.strip()) if term]


def make_excerpt(source: str, query: str, length: int = 180) -> str:
    text = plain_text(source)
    if not text:
        return ""
    terms = search_terms(query)
    lower = text.lower()
    positions = [lower.find(term.lower()) for term in terms]
    found = [position for position in positions if position >= 0]
    position = min(found) if found else 0
    start = max(0, position - 50)
    end = min(len(text), start + length)
    start = max(0, end - length)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = f"…{snippet}"
    if end < len(text):
        snippet = f"{snippet}…"
    highlighted: str = escape(snippet)
    for term in sorted(terms, key=len, reverse=True):
        highlighted = re.sub(
            re.escape(escape(term)),
            lambda match: f"<mark>{match.group(0)}</mark>",
            highlighted,
            flags=re.IGNORECASE,
        )
    return nh3.clean(highlighted, tags={"mark"})
