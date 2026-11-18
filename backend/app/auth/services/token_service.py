import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any, Union
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.core.config import settings
from backend.app.models.all_models import RefreshToken, User, utc_now

def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hash of a raw token for safe database persistence."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class TokenService:
    @staticmethod
    def create_access_token(
        subject: Union[str, Any],
        expires_delta: Optional[timedelta] = None,
        claims: Optional[Dict[str, Any]] = None
    ) -> str:
        """Creates a signed, short-lived JWT access token."""
        now_utc = datetime.now(timezone.utc)
        if expires_delta:
            expire = now_utc + expires_delta
        else:
            expire = now_utc + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode = {
            "exp": expire,
            "iat": now_utc,
            "jti": secrets.token_hex(16),
            "sub": str(subject),
            "type": "access"
        }
        if claims:
            to_encode.update(claims)
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def create_refresh_token(
        subject: Union[str, Any],
        remember_me: bool = False,
        expires_delta: Optional[timedelta] = None
    ) -> Tuple[str, datetime]:
        """
        Generates a refresh token string and calculates expiration.
        If remember_me is True, duration is extended to 30 days; otherwise REFRESH_TOKEN_EXPIRE_DAYS.
        """
        days = 30 if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(days=days)

        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "type": "refresh",
            "jti": secrets.token_hex(16)
        }
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt, expire.replace(tzinfo=None)

    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """Decodes and validates JWT signature and expiration."""
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    @staticmethod
    def store_refresh_token(
        db: Session,
        user_id: str,
        raw_token: str,
        expires_at: datetime
    ) -> RefreshToken:
        """Stores a new refresh token record with both raw token and token_hash."""
        th = hash_token(raw_token)
        token_record = RefreshToken(
            user_id=user_id,
            token=raw_token,
            token_hash=th,
            expires_at=expires_at,
            revoked=False,
            revoked_at=None,
            created_at=utc_now()
        )
        db.add(token_record)
        db.commit()
        db.refresh(token_record)
        return token_record

    @classmethod
    def rotate_refresh_token(
        cls,
        db: Session,
        raw_refresh_token: str,
        claims: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, User]:
        """
        Rotates refresh token with reuse detection.
        If a revoked token is presented, REVOKES ALL TOKENS for the user (theft defense).
        Returns: (new_access_token, new_refresh_token, user)
        """
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked authentication session",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = cls.decode_token(raw_refresh_token)
            user_id: str = payload.get("sub")
            token_type: str = payload.get("type")
            if not user_id or token_type != "refresh":
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        th = hash_token(raw_refresh_token)

        # Lookup by hash or raw token
        token_rec = db.query(RefreshToken).filter(
            (RefreshToken.token_hash == th) | (RefreshToken.token == raw_refresh_token)
        ).first()

        if not token_rec:
            raise credentials_exception

        # REUSE DETECTION: If token was already revoked, someone is replaying a stolen token!
        if token_rec.revoked:
            # Compromise detected: Revoke ALL sessions for this user
            db.query(RefreshToken).filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False
            ).update({"revoked": True, "revoked_at": utc_now()})
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Security alert: Compromised session token detected. All active sessions have been terminated. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check expiration
        if token_rec.expires_at < utc_now():
            token_rec.revoked = True
            token_rec.revoked_at = utc_now()
            db.commit()
            raise credentials_exception

        # Check user account status
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated"
            )

        # 1. Invalidate current token
        token_rec.revoked = True
        token_rec.revoked_at = utc_now()

        # 2. Issue new tokens
        new_access = cls.create_access_token(subject=user.id, claims=claims)
        new_refresh, new_exp = cls.create_refresh_token(subject=user.id)

        # 3. Store new token
        cls.store_refresh_token(db, user.id, new_refresh, new_exp)

        return new_access, new_refresh, user

    @staticmethod
    def revoke_all_user_sessions(db: Session, user_id: str) -> int:
        """Revokes all active refresh tokens for a user (e.g., logout or password reset)."""
        count = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        ).update({"revoked": True, "revoked_at": utc_now()})
        db.commit()
        return count
