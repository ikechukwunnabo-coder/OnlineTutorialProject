from __future__ import annotations

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from apps.accounts.models import Role, User


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ("email",)
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f"learner{n}@example.com")
    role = Role.LEARNER
    is_active = True
    is_staff = False
    is_superuser = False

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password(extracted or "test-password-12345")
        if create:
            self.save(update_fields=["password"])


class EditorFactory(UserFactory):
    role = Role.EDITOR
    is_staff = True


class VerifiedUserFactory(UserFactory):
    email_verified_at = factory.LazyFunction(timezone.now)


class AdminFactory(UserFactory):
    role = Role.ADMIN
    is_staff = True
    is_superuser = True
