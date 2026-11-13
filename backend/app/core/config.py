import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Smart Help Desk"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "smart-helpdesk-super-secure-dev-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite:///./smart_helpdesk.db"
    DB_ECHO: bool = False

    # AI & RAG Subsystem
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b"
    OLLAMA_TIMEOUT_SECONDS: float = 30.0
    AI_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    AI_FAISS_INDEX_DIR: str = "./ai/artifacts"
    AI_CLASSIFICATION_MODEL_PATH: str = "./ai/artifacts/category_classifier.joblib"
    AI_SLA_MODEL_PATH: str = "./ai/artifacts/sla_risk_model.joblib"
    
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
