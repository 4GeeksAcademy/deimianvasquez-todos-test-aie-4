def validate_password(password: object) -> bool:
    if not isinstance(password, str) or not password or password != password.strip():
        return False

    if len(password) < 10:
        return False

    return (
        any(char.isalpha() for char in password)
        and any(char.isdigit() for char in password)
        and any(not char.isalnum() and not char.isspace() for char in password)
    )