import pytest

from utils.email import validate_email


@pytest.mark.parametrize(
    "email",
    [
        "ana@example.com",
        "nombre.apellido@subdominio.example.org",
    ],
)
def test_validate_email_accepts_valid_addresses(email):
    assert validate_email(email) is True


@pytest.mark.parametrize(
    "email",
    [
        "",
        "ana.example.com",
        "ana@@example.com",
        "@example.com",
        "ana@",
        "ana@example",
        " ana@example.com",
        "ana@example.com ",
        "ana..apellido@example.com",
    ],
)
def test_validate_email_rejects_invalid_addresses(email):
    assert validate_email(email) is False


@pytest.mark.parametrize("email", [None, 123])
def test_validate_email_rejects_non_string_values(email):
    assert validate_email(email) is False