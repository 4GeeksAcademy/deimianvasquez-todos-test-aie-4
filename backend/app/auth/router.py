from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Response, status

from app.auth.schemas import LoginRequest
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.telemetry.repository import insert_event
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


def _record_login_attempt(
    email: str,
    success: bool,
    request: Request | None = None,
    error_detail: str | None = None,
) -> None:
    """Registra un intento de login directamente en telemetría (sin consent)."""
    event = {
        "event": "login_attempted",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user": {
            "userId": None,
            "anonymousId": None,
            "sessionId": "server",
        },
        "context": {
            "appVersion": "0.1.0",
            "env": "development",
            "route": "/auth/login",
        },
        "properties": {
            "method": "password",
            "email": email,
            "success": success,
        },
    }
    if not success:
        event["properties"]["error"] = error_detail or "invalid credentials"
    if request is not None:
        event["properties"]["ip"] = request.client.host if request.client else "unknown"
        event["properties"]["user_agent"] = request.headers.get("user-agent", "")
    insert_event(event)


@router.post("/login")
def login(credentials: LoginRequest, response: Response, request: Request) -> dict:
    success = False
    user = None
    try:
        user = get_by_email(str(credentials.email).lower())
        password_matches = user is not None and verify_password(
            credentials.password,
            user["password_hash"],
        )
        if not password_matches:
            _record_login_attempt(
                email=credentials.email,
                success=False,
                request=request,
                error_detail="Incorrect email or password",
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        response.set_cookie(
            value=create_access_token(user.doc_id),
            max_age=settings.access_token_expire_minutes * 60,
            **_cookie_params(),
        )
        success = True
        return {"message": "ok"}
    finally:
        # Si el login fue exitoso, registramos también
        if success and user is not None:
            _record_login_attempt(
                email=credentials.email,
                success=True,
                request=request,
            )


@router.post("/logout")
def logout(response: Response) -> dict:
    response.delete_cookie(**_cookie_params())
    return {"message": "ok"}
