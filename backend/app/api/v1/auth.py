from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from backend.app.models.all_models import User, RefreshToken, Organization, Department, utc_now
from backend.app.schemas.all_schemas import (
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    MessageResponse,
    UserMeResponse
)
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.core.dependencies import get_user_roles, get_current_user

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
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    roles = get_user_roles(user, db)
    access_token = create_access_token(
        subject=user.id,
        claims={"org_id": user.org_id, "roles": roles}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/login", response_model=TokenResponse)
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    query = db.query(User).filter(User.email == login_in.email)
    if login_in.org_id:
        query = query.filter(User.org_id == login_in.org_id)
        
    user = query.first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    roles = get_user_roles(user, db)
    access_token = create_access_token(
        subject=user.id,
        claims={"org_id": user.org_id, "roles": roles}
    )
    refresh_token_str = create_refresh_token(subject=user.id)

    # Store refresh token
    ref_record = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.fromtimestamp(decode_token(refresh_token_str)["exp"], tz=timezone.utc),
        revoked=False
    )
    db.add(ref_record)
    db.commit()

    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    dept = db.query(Department).filter(Department.id == user.department_id).first() if user.department_id else None

    user_me = UserMeResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        org_id=user.org_id,
        org_name=org.name if org else None,
        department_id=user.department_id,
        department_name=dept.name if dept else None,
        created_at=user.created_at,
        roles=roles,
        teams=[tm.team.name for tm in user.team_memberships if tm.team]
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
        user=user_me
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_in: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(refresh_in.refresh_token)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    token_rec = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_in.refresh_token,
        RefreshToken.revoked == False
    ).first()
    
    if not token_rec or token_rec.expires_at < utc_now():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked or expired")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Rotate refresh token
    token_rec.revoked = True
    roles = get_user_roles(user, db)
    
    new_access_token = create_access_token(
        subject=user.id,
        claims={"org_id": user.org_id, "roles": roles}
    )
    new_refresh_token = create_refresh_token(subject=user.id)

    db.add(RefreshToken(
        user_id=user.id,
        token=new_refresh_token,
        expires_at=datetime.fromtimestamp(decode_token(new_refresh_token)["exp"], tz=timezone.utc),
        revoked=False
    ))
    db.commit()

    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    dept = db.query(Department).filter(Department.id == user.department_id).first() if user.department_id else None

    user_me = UserMeResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        org_id=user.org_id,
        org_name=org.name if org else None,
        department_id=user.department_id,
        department_name=dept.name if dept else None,
        created_at=user.created_at,
        roles=roles,
        teams=[tm.team.name for tm in user.team_memberships if tm.team]
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=user_me
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Revoke all active refresh tokens for the user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked == False
    ).update({"revoked": True})
    db.commit()
    return MessageResponse(message="Successfully logged out and session revoked")
