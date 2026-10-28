from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

APP_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = APP_DIR.parent


class Settings(BaseSettings):
    tinydb_path: Path = BACKEND_DIR / "data" / "db.json"
    admin_email: str = "dvasquez@4geeksacademy.com"
    secret_key: str = "dev-secret-change-me-for-local-only"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cookie_secure: bool = False
    resend_api_key: str = ""
    email_from: str = ""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
