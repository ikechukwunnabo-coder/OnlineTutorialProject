from __future__ import annotations

import pytest
from django.db import IntegrityError, transaction

from apps.accounts.models import Profile, Role, User
from apps.accounts.tests.factories import AdminFactory, UserFactory


@pytest.mark.django_db
def test_create_user_normalizes_and_lowercases_email():
    user = User.objects.create_user(email="Learner@Example.COM", password="x" * 12)
    assert user.email == "learner@example.com"
    assert user.role == Role.LEARNER
    assert user.check_password("x" * 12)
    assert user.email_verified is False


@pytest.mark.django_db
def test_email_uniqueness_is_case_insensitive():
    UserFactory(email="same@example.com")
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            User.objects.create_user(email="SAME@example.com", password="x" * 12)


@pytest.mark.django_db
def test_create_superuser_sets_admin_role_and_flags():
    user = User.objects.create_superuser(email="admin@example.com", password="x" * 12)
    assert user.role == Role.ADMIN
    assert user.is_staff is True
    assert user.is_superuser is True


@pytest.mark.django_db
def test_superuser_factory_is_staff_and_admin():
    user = AdminFactory()
    assert user.role == Role.ADMIN
    assert user.is_superuser is True


@pytest.mark.django_db
def test_profile_is_created_with_new_user():
    user = UserFactory(email="profile@example.com")
    assert Profile.objects.filter(user=user).exists()
    assert user.profile.display_name == "profile"


@pytest.mark.django_db
def test_get_by_natural_key_is_case_insensitive():
    user = UserFactory(email="natural@example.com")
    assert User.objects.get_by_natural_key("NATURAL@example.com") == user


@pytest.mark.django_db
def test_get_full_name_uses_profile_display_name():
    user = UserFactory(email="named@example.com")
    user.profile.display_name = "Alex Doe"
    user.profile.save()
    assert user.get_full_name() == "Alex Doe"
    assert user.get_short_name() == "Alex Doe"


@pytest.mark.django_db
def test_email_verified_property():
    user = UserFactory()
    assert user.email_verified is False
    user.email_verified_at = user.date_joined
    assert user.email_verified is True
