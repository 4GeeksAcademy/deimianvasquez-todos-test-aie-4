import pytest

from utils.password import validate_password


def test_validate_password_accepts_password_with_all_requirements():
    assert validate_password("Abcdefg1!x") is True


@pytest.mark.parametrize(
    "password",
    [
        "Abcdef1!x",
        "Abcdefghi!",
        "123456789!",
        "Abcdefg123",
    ],
)
def test_validate_password_rejects_password_missing_a_requirement(password):
    assert validate_password(password) is False