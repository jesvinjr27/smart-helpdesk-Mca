import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.core.config import settings
from backend.app.core.dependencies import get_current_user
from backend.app.models.all_models import User
from backend.app.schemas.all_schemas import (
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MicrosoftConfigResponse,
    MicrosoftExchangeRequest,
    TokenResponse,
    MessageResponse,
    UserMeResponse
)
from backend.app.auth.services.password_service import PasswordService
from backend.app.auth.services.token_service import TokenService
from backend.app.auth.services.authorization_service import get_user_roles
from backend.app.auth.services.authentication_service import AuthenticationService
from backend.app.auth.providers.microsoft_auth import MicrosoftAuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/token", summary="Swagger UI OAuth2 Password Token Endpoint")
def swagger_login_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Standard OAuth2 password flow endpoint used by Swagger UI's Authorize dialog.
    Enter email in 'username' and password in 'password'.
    """
    user, roles, _ = AuthenticationService.authenticate_user(
        db=db,
        email=form_data.username,
        password=form_data.password
    )
    access_token = TokenService.create_access_token(
        subject=user.id,
        claims={"org_id": user.org_id, "roles": roles}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/login", response_model=TokenResponse, summary="Email and Password Login")
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    """
    Primary authentication endpoint for email and password login.
    Verifies credentials using Argon2id, checks account active status,
    and returns short-lived access token, rotating refresh token,
    current user profile, and permitted workspaces.
    """
    user, roles, workspaces = AuthenticationService.authenticate_user(
        db=db,
        email=login_in.email,
        password=login_in.password,
        org_id=login_in.org_id
    )

    # Generate JWT access token with role and org claims
    access_token = TokenService.create_access_token(
        subject=user.id,
        claims={"org_id": user.org_id, "roles": roles}
    )

    # Generate and store refresh token with remember-me policy
    refresh_token_str, refresh_exp = TokenService.create_refresh_token(
        subject=user.id,
        remember_me=bool(login_in.remember_me)
    )
    TokenService.store_refresh_token(
        db=db,
        user_id=user.id,
        raw_token=refresh_token_str,
        expires_at=refresh_exp
    )

    user_me = AuthenticationService.build_user_me_response(db, user, roles)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
        user=user_me,
        workspaces=workspaces
    )


@router.post("/refresh", response_model=TokenResponse, summary="Rotate Session Refresh Token")
def refresh_session(refresh_in: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refreshes authentication session using rotating refresh tokens.
    Implements reuse detection: if a revoked token is used, revokes all active
    user sessions as a defense against token replay/theft.
    """
    # 1. Rotate token & detect reuse
    payload = TokenService.decode_token(refresh_in.refresh_token)
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    roles = get_user_roles(user, db)
    claims = {"org_id": user.org_id, "roles": roles}

    new_access, new_refresh, user = TokenService.rotate_refresh_token(
        db=db,
        raw_refresh_token=refresh_in.refresh_token,
        claims=claims
    )

    user_me = AuthenticationService.build_user_me_response(db, user, roles)
    workspaces = AuthenticationService.get_user_workspaces(db, user, roles)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        user=user_me,
        workspaces=workspaces
    )


@router.post("/logout", response_model=MessageResponse, summary="Revoke Session & Logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revokes all active server-side refresh tokens for the current user.
    """
    count = TokenService.revoke_all_user_sessions(db, current_user.id)
    logger.info(f"User {current_user.email} logged out; {count} refresh tokens revoked.")
    return MessageResponse(
        message="Successfully logged out and session revoked.",
        detail=f"{count} active sessions terminated."
    )


@router.get("/me", response_model=UserMeResponse, summary="Get Current Authenticated User")
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the currently authenticated user's profile, roles, department,
    organization, and authorized workspaces.
    """
    roles = get_user_roles(current_user, db)
    return AuthenticationService.build_user_me_response(db, current_user, roles)


@router.post("/forgot-password", response_model=MessageResponse, summary="Request Password Reset")
def forgot_password(forgot_in: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiates password recovery.
    Generates a cryptographically secure, single-use reset token and stores only its SHA-256 hash.
    Returns a generic message to prevent email enumeration.
    """
    raw_token = AuthenticationService.request_password_reset(db, forgot_in.email)

    detail_msg = None
    if raw_token and (settings.DEBUG or settings.ENVIRONMENT == "development"):
        detail_msg = f"Development mode token: {raw_token}"

    return MessageResponse(
        message="If an account exists with this email address, password reset instructions have been dispatched.",
        detail=detail_msg,
        success=True
    )


@router.post("/reset-password", response_model=MessageResponse, summary="Confirm Password Reset")
def reset_password(reset_in: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Validates single-use reset token, updates password using Argon2id,
    invalidates token, and revokes all active sessions for the user.
    """
    AuthenticationService.reset_password(
        db=db,
        raw_token=reset_in.token,
        new_password=reset_in.new_password
    )
    return MessageResponse(
        message="Your password has been successfully reset. You may now log in with your new password.",
        success=True
    )


@router.get("/microsoft/config", response_model=MicrosoftConfigResponse, summary="Get Microsoft SSO Configuration")
def get_microsoft_config():
    """
    Returns public Microsoft SSO configuration.
    Returns enabled=false when Entra ID credentials are not configured.
    """
    return MicrosoftAuthService.get_public_config()


@router.post("/microsoft/exchange", response_model=TokenResponse, summary="Exchange Microsoft Auth Token")
def exchange_microsoft_token(
    exchange_in: MicrosoftExchangeRequest,
    db: Session = Depends(get_db)
):
    """
    Exchanges Microsoft authorization code or token for an application session.
    Fails safely if Microsoft SSO is disabled on the server.
    """
    user = MicrosoftAuthService.validate_and_exchange_token(
        db=db,
        code=exchange_in.code,
        id_token=exchange_in.id_token,
        access_token=exchange_in.access_token
    )
    roles = get_user_roles(user, db)
    workspaces = AuthenticationService.get_user_workspaces(db, user, roles)

    access_token = TokenService.create_access_token(
        subject=user.id,
        claims={"org_id": user.org_id, "roles": roles}
    )
    refresh_token_str, refresh_exp = TokenService.create_refresh_token(subject=user.id)
    TokenService.store_refresh_token(db, user.id, refresh_token_str, refresh_exp)

    user_me = AuthenticationService.build_user_me_response(db, user, roles)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
        user=user_me,
        workspaces=workspaces
    )
