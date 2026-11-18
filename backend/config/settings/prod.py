"""Production settings."""

from typing import Any, cast

from .base import *  # noqa: F403

DEBUG = False

SECRET_KEY = env("DJANGO_SECRET_KEY")  # noqa: F405
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")  # noqa: F405
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS")  # noqa: F405

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

EMAIL_BACKEND = env("EMAIL_BACKEND")  # noqa: F405

# Production must not use the development fallback database.
if DATABASES["default"]["ENGINE"].endswith("sqlite3"):  # noqa: F405
    raise ValueError("DATABASE_URL must point to PostgreSQL in production.")

database = cast(dict[str, Any], DATABASES["default"])  # noqa: F405
database["CONN_HEALTH_CHECKS"] = True
database.setdefault("OPTIONS", {})["connect_timeout"] = env.int(  # noqa: F405
    "DB_CONNECT_TIMEOUT", default=5
)

SENTRY_DSN = env("SENTRY_DSN", default="")
SENTRY_ENVIRONMENT = env("SENTRY_ENVIRONMENT", default="production")
SENTRY_TRACES_SAMPLE_RATE = env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.0)

if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=SENTRY_ENVIRONMENT,
        traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,
        max_request_body_size="never",
    )

logging_config = cast(dict[str, Any], LOGGING)  # noqa: F405
logging_config["formatters"]["json"] = {
    "()": "apps.common.logging.JsonFormatter",
}
logging_config["handlers"]["console"]["formatter"] = "json"
