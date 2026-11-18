import pytest
from fastapi import HTTPException
from backend.app.db.session import SessionLocal
from backend.app.models.all_models import User, RefreshToken, PasswordResetToken
from backend.app.schemas.all_schemas import (
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MicrosoftExchangeRequest
)
from backend.app.api.v1.auth import (
    login,
    refresh_session,
    logout,
    get_current_user_profile,
    forgot_password,
    reset_password,
    get_microsoft_config,
    exchange_microsoft_token
)
from backend.app.auth.services.password_service import PasswordService
from backend.app.auth.services.token_service import TokenService
from backend.app.auth.services.rate_limiter import login_rate_limiter


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_microsoft_sso_disabled_by_default():
    """Verifies that Microsoft SSO returns disabled configuration and rejects token exchange."""
    cfg = get_microsoft_config()
    assert cfg.enabled is False
    assert cfg.client_id is None
    assert cfg.tenant_id is None


def test_microsoft_sso_exchange_rejected(db):
    """Verifies that Microsoft token exchange fails with HTTP 400 when disabled."""
    with pytest.raises(HTTPException) as exc:
        exchange_microsoft_token(MicrosoftExchangeRequest(code="sample_code"), db)
    assert exc.value.status_code == 400
    assert "not enabled or configured" in exc.value.detail


def test_argon2id_password_hashing():
    """Verifies that new passwords are encrypted using Argon2id with RFC 9106 PHC formatting."""
    raw = "SecureP@ssword2026!"
    hashed = PasswordService.hash_password(raw)
    assert hashed.startswith("$argon2id$v=19$m=65536,t=3,p=4$")

    is_valid, needs_upgrade = PasswordService.verify_password(raw, hashed)
    assert is_valid is True
    assert needs_upgrade is False

    is_wrong, _ = PasswordService.verify_password("WrongPassword!", hashed)
    assert is_wrong is False


def test_email_password_login_success(db):
    """Verifies successful login with valid credentials for Org Admin."""
    resp = login(LoginRequest(email="admin@apex.com", password="Password123!"), db)
    assert resp.access_token is not None
    assert resp.refresh_token is not None
    assert resp.user.email == "admin@apex.com"
    assert "ORG_ADMIN" in resp.user.roles
    assert len(resp.workspaces) >= 1


def test_email_password_login_invalid_password(db):
    """Verifies HTTP 401 when entering an incorrect password."""
    with pytest.raises(HTTPException) as exc:
        login(LoginRequest(email="admin@apex.com", password="IncorrectPassword!"), db)
    assert exc.value.status_code == 401
    assert "Incorrect email or password" in exc.value.detail


def test_email_password_login_unknown_email(db):
    """Verifies HTTP 401 without user enumeration when email is not registered."""
    with pytest.raises(HTTPException) as exc:
        login(LoginRequest(email="nonexistent.user@unknown.com", password="Password123!"), db)
    assert exc.value.status_code == 401
    assert "Incorrect email or password" in exc.value.detail


def test_token_refresh_rotation(db):
    """Verifies session refresh rotates both access and refresh tokens."""
    login_resp = login(LoginRequest(email="lead.it@apex.com", password="Password123!"), db)
    old_access = login_resp.access_token
    old_refresh = login_resp.refresh_token

    ref_resp = refresh_session(RefreshTokenRequest(refresh_token=old_refresh), db)
    assert ref_resp.access_token != old_access
    assert ref_resp.refresh_token != old_refresh


def test_token_reuse_detection_and_revocation(db):
    """Verifies that replaying a consumed refresh token revokes all active sessions."""
    login_resp = login(LoginRequest(email="agent.john@apex.com", password="Password123!"), db)
    first_refresh = login_resp.refresh_token

    # 1. First refresh succeeds
    ref_resp = refresh_session(RefreshTokenRequest(refresh_token=first_refresh), db)
    assert ref_resp.access_token is not None

    # 2. Replaying the consumed token must trigger reuse detection
    with pytest.raises(HTTPException) as exc:
        refresh_session(RefreshTokenRequest(refresh_token=first_refresh), db)
    assert exc.value.status_code == 401
    assert "Compromised" in exc.value.detail or "revoked" in exc.value.detail.lower()


def test_all_six_roles_authentication(db):
    """Verifies that all 6 application roles can authenticate and resolve correct roles."""
    test_cases = [
        ("sysadmin@smarthelpdesk.local", "SYS_ADMIN"),
        ("admin@apex.com", "ORG_ADMIN"),
        ("lead.it@apex.com", "LEAD"),
        ("agent.john@apex.com", "AGENT"),
        ("student.emma@greenwood.edu", "REQUESTER"),
        ("user.alice@apex.com", "REQUESTER"),
    ]

    for email, expected_role in test_cases:
        resp = login(LoginRequest(email=email, password="Password123!"), db)
        assert expected_role in resp.user.roles, f"Expected {expected_role} in roles for {email}"
        assert resp.user.is_active is True


def test_forgot_password_and_reset_flow(db):
    """Verifies password recovery, single-use token invalidation, and session revocation."""
    email = "user.bob@apex.com"

    # 1. Request reset
    forgot_resp = forgot_password(ForgotPasswordRequest(email=email), db)
    assert forgot_resp.success is True
    assert forgot_resp.detail is not None
    token = forgot_resp.detail.split("token: ")[-1]

    # 2. Reset password
    new_pass = "BobNewSecurePass2026!"
    reset_resp = reset_password(ResetPasswordRequest(token=token, new_password=new_pass), db)
    assert reset_resp.success is True

    # 3. Old password must fail
    with pytest.raises(HTTPException):
        login(LoginRequest(email=email, password="Password123!"), db)

    # 4. New password must succeed
    new_login = login(LoginRequest(email=email, password=new_pass), db)
    assert new_login.user.email == email

    # 5. Token reuse must be rejected
    with pytest.raises(HTTPException) as exc:
        reset_password(ResetPasswordRequest(token=token, new_password="AnotherPassword!"), db)
    assert exc.value.status_code == 400

    # 6. Restore original password for test repeatability
    f2 = forgot_password(ForgotPasswordRequest(email=email), db)
    t2 = f2.detail.split("token: ")[-1]
    reset_password(ResetPasswordRequest(token=t2, new_password="Password123!"), db)


def test_logout_session_revocation(db):
    """Verifies that logout revokes active refresh tokens."""
    login_resp = login(LoginRequest(email="user.alice@apex.com", password="Password123!"), db)
    user_rec = db.query(User).filter(User.id == login_resp.user.id).first()

    logout_resp = logout(user_rec, db)
    assert logout_resp.success is True

    # Attempting to refresh with the revoked token must fail
    with pytest.raises(HTTPException):
        refresh_session(RefreshTokenRequest(refresh_token=login_resp.refresh_token), db)
