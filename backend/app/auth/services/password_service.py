import os
import bcrypt
import logging
from typing import Tuple
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id
from cryptography.exceptions import InvalidKey

logger = logging.getLogger(__name__)

# Argon2id RFC 9106 & OWASP Recommended Parameters
ARGON2_MEMORY_COST = 65536  # 64 MB
ARGON2_ITERATIONS = 3
ARGON2_LANES = 4
ARGON2_KEY_LEN = 32
ARGON2_SALT_LEN = 16


class PasswordService:
    @staticmethod
    def hash_password(plain_password: str) -> str:
        """
        Hashes a password using Argon2id with cryptographically secure random salt
        and returns a standard PHC-encoded string ($argon2id$v=19$m=65536,t=3,p=4$...).
        """
        salt = os.urandom(ARGON2_SALT_LEN)
        kdf = Argon2id(
            salt=salt,
            length=ARGON2_KEY_LEN,
            iterations=ARGON2_ITERATIONS,
            lanes=ARGON2_LANES,
            memory_cost=ARGON2_MEMORY_COST
        )
        return kdf.derive_phc_encoded(plain_password.encode("utf-8"))

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> Tuple[bool, bool]:
        """
        Verifies plain password against hashed_password.
        Supports Argon2id natively and bcrypt for transparent backward compatibility.
        Returns: (is_valid: bool, needs_upgrade: bool)
        """
        if not plain_password or not hashed_password:
            return False, False

        # 1. Native Argon2id check
        if hashed_password.startswith("$argon2id$"):
            try:
                Argon2id.verify_phc_encoded(
                    plain_password.encode("utf-8"),
                    hashed_password
                )
                return True, False
            except (InvalidKey, Exception) as exc:
                logger.debug(f"Argon2id verification failed: {exc}")
                return False, False

        # 2. Legacy bcrypt fallback
        if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
            try:
                is_valid = bcrypt.checkpw(
                    plain_password.encode("utf-8"),
                    hashed_password.encode("utf-8")
                )
                return is_valid, is_valid  # if valid, needs_upgrade = True
            except Exception as exc:
                logger.debug(f"Bcrypt verification failed: {exc}")
                return False, False

        return False, False

    @staticmethod
    def needs_rehash(hashed_password: str) -> bool:
        """Checks if hash needs migration to current Argon2id algorithm."""
        return not hashed_password.startswith("$argon2id$")
