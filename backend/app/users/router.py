import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.auth.dependencies import get_current_user, require_admin
from app.core.config import settings
from app.core.security import hash_password
from app.mail import send_welcome_email
from app.users.repository import create, delete, get_by_email, get_by_id, list_all, update
from app.users.schemas import UserCreate, UserPublic, UserUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


def role_for_email(email: str) -> str:
    if email == settings.admin_email.lower():
        return "admin"
    return "user"


def ensure_self(current_user: UserPublic, user_id: int) -> None:
    if current_user.id == user_id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not enough permissions",
    )


@router.post("", response_model=UserPublic, status_code=status.HTTP_200_OK)
def register_user(user: UserCreate) -> UserPublic:
    email = str(user.email).lower()
    if get_by_email(email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    created = create(
        name=user.name,
        email=email,
        password_hash=hash_password(user.password),
        role=role_for_email(email),
    )
    try:
        send_welcome_email(to=email, name=user.name)
    except Exception:
        logger.exception("No se pudo enviar el correo de bienvenida a %s", email)
    return UserPublic.from_document(created)


@router.get("", response_model=list[UserPublic])
def read_users(_: UserPublic = Depends(require_admin)) -> list[UserPublic]:
    return [UserPublic.from_document(user) for user in list_all()]


@router.get("/me", response_model=UserPublic)
def read_current_user(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
    return current_user


@router.get("/{user_id}", response_model=UserPublic)
def read_user(
    user_id: int,
    current_user: UserPublic = Depends(get_current_user),
) -> UserPublic:
    user = get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    ensure_self(current_user, user_id)
    return UserPublic.from_document(user)


@router.patch("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: UserPublic = Depends(get_current_user),
) -> UserPublic:
    if get_by_id(user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    ensure_self(current_user, user_id)

    changes = {
        key: value
        for key, value in payload.model_dump(exclude_unset=True).items()
        if value is not None
    }
    if "email" in changes and changes["email"] is not None:
        email = str(changes["email"]).lower()
        existing = get_by_email(email)
        if existing is not None and existing.doc_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        changes["email"] = email
    if "password" in changes:
        changes["password_hash"] = hash_password(changes.pop("password"))

    updated = update(user_id, changes)
    return UserPublic.from_document(updated)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: UserPublic = Depends(get_current_user),
) -> Response:
    if get_by_id(user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    ensure_self(current_user, user_id)
    delete(user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
