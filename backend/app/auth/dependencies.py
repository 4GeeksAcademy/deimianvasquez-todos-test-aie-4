from fastapi import Cookie, Depends, HTTPException, status

from app.core.security import decode_access_token
from app.users.repository import get_by_id
from app.users.schemas import UserPublic


def get_current_user(access_token: str | None = Cookie(default=None)) -> UserPublic:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    if access_token is None:
        raise credentials_error

    user_id = decode_access_token(access_token)
    if user_id is None:
        raise credentials_error

    user = get_by_id(user_id)
    if user is None:
        raise credentials_error

    return UserPublic.from_document(user)


def require_admin(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user
