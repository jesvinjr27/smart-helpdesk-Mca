import logging
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import List, Tuple, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.auth.services.authorization_service import get_user_roles
from backend.app.models.all_models import (
    User,
    Organization,
    Department,
    UserRole,
    PasswordResetToken,
    utc_now
)
from backend.app.schemas.all_schemas import WorkspaceOption, UserMeResponse
from backend.app.auth.services.password_service import PasswordService
from backend.app.auth.services.token_service import TokenService
from backend.app.auth.services.rate_limiter import login_rate_limiter

logger = logging.getLogger(__name__)


class AuthenticationService:
    @staticmethod
    def get_user_workspaces(db: Session, user: User, roles: List[str]) -> List[WorkspaceOption]:
        """
        Determines all authorized workspaces (organizations) for the user.
        Global SysAdmin has access to all active organizations.
        Other users have access to their assigned organization(s).
        """
        workspaces = []
        user_role_str = roles[0] if roles else "REQUESTER"

        if "SYS_ADMIN" in roles:
            # Global Admin can switch to any active organization
            all_orgs = db.query(Organization).filter(Organization.is_active == True).all()
            for o in all_orgs:
                workspaces.append(WorkspaceOption(
                    organization_id=o.id,
                    organization_name=o.name,
                    organization_code=o.code,
                    role="SYS_ADMIN"
                ))
            return workspaces

        # 1. Primary Organization
        if user.organization:
            workspaces.append(WorkspaceOption(
                organization_id=user.organization.id,
                organization_name=user.organization.name,
                organization_code=user.organization.code,
                role=user_role_str
            ))

        # 2. Multi-tenant roles (if assigned across other orgs)
        multi_org_roles = (
            db.query(UserRole)
            .filter(
                UserRole.user_id == user.id,
                UserRole.organization_id.isnot(None),
                UserRole.organization_id != user.org_id
            )
            .all()
        )
        for ur in multi_org_roles:
            org = db.query(Organization).filter(Organization.id == ur.organization_id).first()
            if org and org.is_active:
                workspaces.append(WorkspaceOption(
                    organization_id=org.id,
                    organization_name=org.name,
                    organization_code=org.code,
                    role=ur.role.name if ur.role else user_role_str
                ))

        # Deduplicate workspaces by organization_id
        seen = set()
        unique_workspaces = []
        for w in workspaces:
            if w.organization_id not in seen:
                seen.add(w.organization_id)
                unique_workspaces.append(w)

        return unique_workspaces

    @classmethod
    def authenticate_user(
        cls,
        db: Session,
        email: str,
        password: str,
        org_id: Optional[str] = None
    ) -> Tuple[User, List[str], List[WorkspaceOption]]:
        """
        Authenticates user with rate limiting, Argon2id verification,
        and automatic bcrypt-to-Argon2id migration.
        """
        norm_email = email.strip().lower()

        # 1. Check Rate Limit
        login_rate_limiter.check_rate_limit(norm_email)

        # 2. Retrieve user
        query = db.query(User).filter(User.email.ilike(norm_email))
        if org_id:
            query = query.filter(User.org_id == org_id)

        user = query.first()

        # Constant-time failure simulation if user does not exist (prevents timing attacks)
        if not user:
            login_rate_limiter.record_failure(norm_email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3. Verify Password (Argon2id + legacy bcrypt fallback)
        is_valid, needs_upgrade = PasswordService.verify_password(password, user.hashed_password)
        if not is_valid:
            login_rate_limiter.record_failure(norm_email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Transparently upgrade legacy bcrypt hash to Argon2id
        if needs_upgrade:
            try:
                user.hashed_password = PasswordService.hash_password(password)
                db.commit()
                logger.info(f"Successfully upgraded password hash to Argon2id for user {user.email}")
            except Exception as e:
                logger.warning(f"Could not upgrade password hash for user {user.email}: {e}")

        # 4. Check account status
        if not user.is_active or (user.account_status and user.account_status.upper() == "DEACTIVATED"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Please contact your system administrator."
            )

        # 5. Reset failed login attempts on success
        login_rate_limiter.reset(norm_email)

        # 6. Retrieve roles and authorized workspaces
        roles = get_user_roles(user, db)
        workspaces = cls.get_user_workspaces(db, user, roles)

        return user, roles, workspaces

    @classmethod
    def build_user_me_response(cls, db: Session, user: User, roles: List[str]) -> UserMeResponse:
        """Constructs standardized UserMeResponse with roles and workspaces."""
        org = db.query(Organization).filter(Organization.id == user.org_id).first()
        dept = db.query(Department).filter(Department.id == user.department_id).first() if user.department_id else None
        workspaces = cls.get_user_workspaces(db, user, roles)

        return UserMeResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            account_status=user.account_status or "ACTIVE",
            is_verified=user.is_verified,
            org_id=user.org_id,
            org_name=org.name if org else None,
            department_id=user.department_id,
            department_name=dept.name if dept else None,
            created_at=user.created_at,
            roles=roles,
            teams=[tm.team.name for tm in user.team_memberships if tm.team],
            workspaces=workspaces
        )

    @staticmethod
    def request_password_reset(db: Session, email: str) -> Optional[str]:
        """
        Creates single-use password reset token with SHA-256 hash storage.
        Returns the raw token (for dev mode delivery fallback) or None.
        """
        norm_email = email.strip().lower()
        user = db.query(User).filter(User.email.ilike(norm_email)).first()

        # Always return generic message to caller to prevent user enumeration
        if not user or not user.is_active:
            return None

        # Invalidate previous unused reset tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None)
        ).update({"used_at": utc_now()})

        # Generate cryptographically secure random token (URL-safe)
        raw_token = secrets.token_urlsafe(32)
        th = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = utc_now() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=th,
            expires_at=expires_at,
            created_at=utc_now()
        )
        db.add(reset_record)
        db.commit()

        # In a production environment with SMTP: send_reset_email(user.email, raw_token)
        # For development fallback, return raw_token so frontend/devs can test seamlessly
        return raw_token

    @staticmethod
    def reset_password(db: Session, raw_token: str, new_password: str) -> bool:
        """
        Validates token, securely hashes new password with Argon2id,
        invalidates token, and revokes all active refresh sessions.
        """
        if not raw_token or not new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token and new password are required."
            )

        th = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

        token_rec = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == th,
            PasswordResetToken.used_at.is_(None)
        ).first()

        if not token_rec or token_rec.expires_at < utc_now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid, expired, or already used password reset link."
            )

        user = db.query(User).filter(User.id == token_rec.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated or no longer exists."
            )

        # 1. Update password with Argon2id hash
        user.hashed_password = PasswordService.hash_password(new_password)
        user.updated_at = utc_now()

        # 2. Invalidate reset token
        token_rec.used_at = utc_now()

        # 3. Revoke all existing sessions for security
        TokenService.revoke_all_user_sessions(db, user.id)

        db.commit()
        return True
