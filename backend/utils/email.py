def validate_email(email: object) -> bool:
    if not isinstance(email, str) or not email or email != email.strip():
        return False

    if email.count("@") != 1 or any(character.isspace() for character in email):
        return False

    local_part, domain = email.split("@")
    if not local_part or not domain or "." not in domain or ".." in email:
        return False

    if any(part.startswith(".") or part.endswith(".") for part in (local_part, domain)):
        return False

    return True



print("a" * 280)