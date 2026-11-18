from __future__ import annotations

import hashlib

from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class HashedIdentMixin(SimpleRateThrottle):
    def get_ident(self, request) -> str:
        ident = super().get_ident(request)
        return hashlib.sha256(ident.encode("utf-8")).hexdigest()


class AnonUserRateThrottle(HashedIdentMixin, UserRateThrottle):
    scope = "anon"
    anon_scope = "anon"
    user_scope = "user"

    def allow_request(self, request, view) -> bool:
        self.scope = self.user_scope if request.user.is_authenticated else self.anon_scope
        self.rate = self.get_rate()
        self.num_requests, self.duration = self.parse_rate(self.rate)
        return super().allow_request(request, view)


class SearchRateThrottle(AnonUserRateThrottle):
    anon_scope = "search"
    user_scope = "search_user"


class SearchSuggestRateThrottle(AnonUserRateThrottle):
    anon_scope = "search_suggest"
    user_scope = "search_suggest_user"


class ContactRateThrottle(HashedIdentMixin):
    scope = "contact"

    def get_cache_key(self, request, view) -> str:
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class AuthRateThrottle(HashedIdentMixin):
    scope = "auth"

    def get_cache_key(self, request, view) -> str:
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class PasswordResetRateThrottle(HashedIdentMixin):
    scope = "password_reset"

    def get_cache_key(self, request, view) -> str:
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class PasswordResetEmailRateThrottle(HashedIdentMixin):
    scope = "password_reset_email"

    def get_cache_key(self, request, view) -> str | None:
        data = getattr(request, "data", {})
        if not isinstance(data, dict):
            return None
        email = str(data.get("email", "")).strip().lower()
        uid = str(data.get("uid", "")).strip()
        identifier = email or uid
        if not identifier:
            return None
        return self.cache_format % {
            "scope": self.scope,
            "ident": hashlib.sha256(identifier.encode("utf-8")).hexdigest(),
        }
