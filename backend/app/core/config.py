import os
from pathlib import Path
from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Smart Help Desk"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "smart-helpdesk-super-secure-dev-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Password Recovery & Security
    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    RATE_LIMIT_LOGIN_MAX_ATTEMPTS: int = 5
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = 300

    # Microsoft SSO Configuration (Disabled by default)
    MICROSOFT_AUTH_ENABLED: bool = False
    MICROSOFT_TENANT_ID: Optional[str] = None
    MICROSOFT_CLIENT_ID: Optional[str] = None
    MICROSOFT_API_AUDIENCE: Optional[str] = None
    MICROSOFT_REDIRECT_URI: Optional[str] = None

    # Database
    DATABASE_URL: str = "sqlite:///./smart_helpdesk.db"
    DB_ECHO: bool = False

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def resolve_sqlite_path(cls, v: str) -> str:
        if v.startswith("sqlite:///./") or v.startswith("sqlite:////./") or v == "sqlite:///smart_helpdesk.db":
            filename = v.split("/")[-1].lstrip("./")
            db_file = _PROJECT_ROOT / filename
            return f"sqlite:///{db_file.as_posix()}"
        return v

    # Hybrid AI Architecture (4 GB RAM, CPU-Only Optimized)
    AI_ML_MODEL_DIR: str = "./backend/app/ai/ml/models"
    AI_CLASSIFIER_PATH: str = "./backend/app/ai/ml/models/category_classifier.joblib"
    AI_SLA_MODEL_PATH: str = "./backend/app/ai/ml/models/sla_risk_model.joblib"
    AI_TRAINING_DATA_PATH: str = "./backend/app/ai/ml/data/ticket_training_data.csv"
    AI_LLM_ENABLED: bool = False  # Disabled by default for 4 GB RAM systems
    AI_LLM_PROVIDER: str = "disabled"  # "disabled", "small_http", "gguf"
    AI_LLM_BASE_URL: str = "http://localhost:11434"
    AI_LLM_MODEL: str = "qwen2.5:0.5b"
    AI_LLM_MAX_TOKENS: int = 256
    AI_RAG_MAX_CHUNKS: int = 4
    AI_RAG_MIN_SIMILARITY: float = 0.15

    @field_validator(
        "AI_ML_MODEL_DIR",
        "AI_CLASSIFIER_PATH",
        "AI_SLA_MODEL_PATH",
        "AI_TRAINING_DATA_PATH",
        mode="after"
    )
    @classmethod
    def resolve_ai_artifact_paths(cls, v: str) -> str:
        if v.startswith("./") or not Path(v).is_absolute():
            clean_rel = v.lstrip("./")
            return str((_PROJECT_ROOT / clean_rel).resolve())
        return v
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
