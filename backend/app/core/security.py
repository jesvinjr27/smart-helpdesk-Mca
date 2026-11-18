from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union, Dict
from jose import jwt

from backend.app.core.config import settings
from backend.app.auth.services.password_service import PasswordService
from backend.app.auth.services.token_service import TokenService


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies password using Argon2id with legacy bcrypt fallback."""
    is_valid, _ = PasswordService.verify_password(plain_password, hashed_password)
    return is_valid


def get_password_hash(password: str) -> str:
    """Generates an Argon2id PHC-encoded password hash."""
    return PasswordService.hash_password(password)


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    claims: Optional[Dict[str, Any]] = None
) -> str:
    return TokenService.create_access_token(subject, expires_delta=expires_delta, claims=claims)


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    token, _ = TokenService.create_refresh_token(subject, expires_delta=expires_delta)
    return token


def decode_token(token: str) -> dict:
    return TokenService.decode_token(token)
