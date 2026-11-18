import time
from typing import Dict, List, Tuple
from fastapi import HTTPException, status
from backend.app.core.config import settings

class LoginRateLimiter:
    """
    In-memory sliding-window rate limiter for brute-force protection.
    Tracks failed attempts by identifier (email or IP address).
    """
    def __init__(
        self,
        max_attempts: int = settings.RATE_LIMIT_LOGIN_MAX_ATTEMPTS,
        window_seconds: int = settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS
    ):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        # key -> list of timestamp floats
        self._attempts: Dict[str, List[float]] = {}

    def _clean_expired(self, key: str, now: float) -> List[float]:
        threshold = now - self.window_seconds
        valid_attempts = [ts for ts in self._attempts.get(key, []) if ts > threshold]
        self._attempts[key] = valid_attempts
        return valid_attempts

    def check_rate_limit(self, identifier: str) -> None:
        """Raises HTTPException 429 if identifier has exceeded failed attempt limit."""
        normalized_key = identifier.strip().lower()
        now = time.time()
        attempts = self._clean_expired(normalized_key, now)

        if len(attempts) >= self.max_attempts:
            oldest_in_window = attempts[0]
            retry_after = int(self.window_seconds - (now - oldest_in_window)) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Please wait {retry_after} seconds before trying again.",
                headers={"Retry-After": str(retry_after)}
            )

    def record_failure(self, identifier: str) -> None:
        """Records a failed authentication attempt."""
        normalized_key = identifier.strip().lower()
        now = time.time()
        attempts = self._clean_expired(normalized_key, now)
        attempts.append(now)
        self._attempts[normalized_key] = attempts

    def reset(self, identifier: str) -> None:
        """Resets failed attempt counter upon successful login."""
        normalized_key = identifier.strip().lower()
        self._attempts.pop(normalized_key, None)


login_rate_limiter = LoginRateLimiter()
