import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Paddeli API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = ""

    SECRET_KEY: str = "9f8e7d6c5b4a3210123456789abcdef0123456789abcdef0123456789abcdef0"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

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
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
