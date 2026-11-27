import os
import secrets
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


_RUNTIME_FALLBACK_SECRET = secrets.token_hex(32)


class Settings(BaseSettings):
    PROJECT_NAME: str = "Paddeli API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = ""

    # Must be set in server .env in production; runtime-ephemeral fallback only for local/test boot
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Optional seed passwords (read strictly from env when provisioning initial admin accounts)
    DEFAULT_SUPER_ADMIN_PASSWORD: str = ""
    DEFAULT_ADMIN_PASSWORD: str = ""

    # Optional provider keys
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    FIREBASE_PROJECT_ID: str = ""

    # Email / SMTP Settings for Booking Notifications
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 25
    SMTP_USER: str = "contact@paddeli.com"
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = False
    SMTP_USE_SSL: bool = False
    NOTIFICATION_EMAIL: str = "contact@paddeli.com"
    MAIL_FROM: str = "Paddeli <contact@paddeli.com>"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "https://paddeli.com",
        "https://www.paddeli.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "capacitor://localhost",
        "https://localhost",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def jwt_secret_key(self) -> str:
        return self.SECRET_KEY.strip() or _RUNTIME_FALLBACK_SECRET


settings = Settings()
