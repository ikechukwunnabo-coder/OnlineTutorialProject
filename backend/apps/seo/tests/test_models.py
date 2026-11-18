from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.seo.models import SlugRedirect


@pytest.mark.django_db
def test_valid_redirect_passes_validation():
    redirect = SlugRedirect(old_path="/old-page", new_path="/new-page")
    redirect.full_clean()


@pytest.mark.django_db
def test_paths_must_start_with_a_slash():
    with pytest.raises(ValidationError):
        SlugRedirect(old_path="old", new_path="/new").full_clean()
    with pytest.raises(ValidationError):
        SlugRedirect(old_path="/old", new_path="new").full_clean()


@pytest.mark.django_db
def test_old_and_new_paths_must_differ():
    with pytest.raises(ValidationError):
        SlugRedirect(old_path="/same", new_path="/same").full_clean()


@pytest.mark.django_db
def test_only_permanent_redirect_codes_are_allowed():
    with pytest.raises(ValidationError):
        SlugRedirect(old_path="/old", new_path="/new", status_code=302).full_clean()


@pytest.mark.django_db
def test_direct_redirect_loop_is_rejected():
    SlugRedirect.objects.create(old_path="/a", new_path="/b")
    with pytest.raises(ValidationError):
        SlugRedirect(old_path="/b", new_path="/a").full_clean()


@pytest.mark.django_db
def test_indirect_redirect_loop_is_rejected():
    SlugRedirect.objects.create(old_path="/a", new_path="/b")
    SlugRedirect.objects.create(old_path="/b", new_path="/c")
    with pytest.raises(ValidationError):
        SlugRedirect(old_path="/c", new_path="/a").full_clean()


@pytest.mark.django_db
def test_old_path_is_unique():
    SlugRedirect.objects.create(old_path="/old", new_path="/new")
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            SlugRedirect.objects.create(old_path="/old", new_path="/other")
