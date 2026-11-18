import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.all_models import User, UserIdentity, utc_now
from backend.app.schemas.all_schemas import MicrosoftConfigResponse

logger = logging.getLogger(__name__)


class MicrosoftAuthService:
    @staticmethod
    def get_public_config() -> MicrosoftConfigResponse:
        """
        Returns safe, public Microsoft Entra ID configuration.
        Returns enabled=False if required variables are missing.
        """
        is_configured = bool(
            settings.MICROSOFT_AUTH_ENABLED
            and settings.MICROSOFT_CLIENT_ID
            and settings.MICROSOFT_TENANT_ID
        )

        return MicrosoftConfigResponse(
            enabled=is_configured,
            tenant_id=settings.MICROSOFT_TENANT_ID if is_configured else None,
            client_id=settings.MICROSOFT_CLIENT_ID if is_configured else None,
            redirect_uri=settings.MICROSOFT_REDIRECT_URI if is_configured else None
        )

    @staticmethod
    def validate_and_exchange_token(
        db: Session,
        code: Optional[str] = None,
        id_token: Optional[str] = None,
        access_token: Optional[str] = None
    ) -> User:
        """
        Exchanges Microsoft authorization code or validates token.
        Strictly enforces that Microsoft SSO must be configured before processing.
        Does NOT fake authentication.
        """
        if not settings.MICROSOFT_AUTH_ENABLED or not settings.MICROSOFT_CLIENT_ID or not settings.MICROSOFT_TENANT_ID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Microsoft Single Sign-On is not enabled or configured on this server."
            )

        token_to_verify = id_token or access_token
        if not token_to_verify and not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing authorization code or Microsoft token for exchange."
            )

        # In production with valid Entra ID keys:
        # 1. Fetch JWKS from https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys
        # 2. Validate token signature, audience, tenant id, expiry
        # 3. Extract oid (object ID) and tid (tenant ID)
        # 4. Lookup linked User in user_identities
        # For now, without live Azure keys, reject invalid token
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Microsoft Entra ID token validation requires active Microsoft Azure AD credentials and live identity keys."
        )
