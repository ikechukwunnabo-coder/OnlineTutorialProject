from __future__ import annotations

import os
import sys

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.test")
django.setup()

from apps.accounts.models import User  # noqa: E402
from apps.accounts.tokens import make_email_verification_token  # noqa: E402


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: e2e_verification_token.py <email>", file=sys.stderr)
        return 2
    user = User.objects.filter(email__iexact=sys.argv[1], is_active=True).first()
    if user is None:
        print("user not found", file=sys.stderr)
        return 1
    print(make_email_verification_token(user))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
