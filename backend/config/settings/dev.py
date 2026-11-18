"""Development settings."""

from .base import *  # noqa: F403

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]", "backend", "testserver"]

# Development defaults to SQLite when DATABASE_URL is unset. Docker Compose sets
# DATABASE_URL so development matches production PostgreSQL.
