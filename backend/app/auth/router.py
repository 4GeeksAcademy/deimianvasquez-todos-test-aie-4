from fastapi import APIRouter, HTTPException, Response, status

from app.auth.schemas import LoginRequest
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.users.repository import get_by_email

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "access_token"


def _cookie_params() -> dict:
    return {
        "key": COOKIE_NAME,
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "path": "/",
    }


@router.post("/login")
def login(credentials: LoginRequest, response: Response) -> dict:
    user = get_by_email(str(credentials.email).lower())
    password_matches = user is not None and verify_password(
        credentials.password,
        user["password_hash"],
    )
    if not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    response.set_cookie(
        value=create_access_token(user.doc_id),
        max_age=settings.access_token_expire_minutes * 60,
        **_cookie_params(),
    )
    return {"message": "ok"}


@router.post("/logout")
def logout(response: Response) -> dict:
    response.delete_cookie(**_cookie_params())
    return {"message": "ok"}
