from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.all_models import User, Role, UserRole, Organization, Department
from backend.app.schemas.all_schemas import (
    UserResponse,
    UserMeResponse,
    UserCreate,
    UserUpdate,
    MessageResponse
)
from backend.app.core.dependencies import (
    get_current_user,
    get_user_roles,
    require_role,
    enforce_organization_isolation
)
from backend.app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserMeResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(current_user, db)
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    dept = db.query(Department).filter(Department.id == current_user.department_id).first() if current_user.department_id else None

    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        org_id=current_user.org_id,
        org_name=org.name if org else None,
        department_id=current_user.department_id,
        department_name=dept.name if dept else None,
        created_at=current_user.created_at,
        roles=roles,
        teams=[tm.team.name for tm in current_user.team_memberships if tm.team]
    )


@router.get("", response_model=List[UserResponse])
def list_users(
    department_id: Optional[str] = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.org_id == current_user.org_id)
    if department_id:
        query = query.filter(User.department_id == department_id)
    if search:
        s = f"%{search}%"
        query = query.filter((User.full_name.ilike(s)) | (User.email.ilike(s)))
        
    users = query.all()
    results = []
    for u in users:
        u_roles = get_user_roles(u, db)
        if role and role not in u_roles:
            continue
        results.append(UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            phone=u.phone,
            avatar_url=u.avatar_url,
            is_active=u.is_active,
            is_verified=u.is_verified,
            org_id=u.org_id,
            department_id=u.department_id,
            created_at=u.created_at,
            roles=u_roles
        ))
    return results


@router.post("", response_model=UserResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))])
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = enforce_organization_isolation(user_in.org_id, current_user, db)

    # Check duplicate
    existing = db.query(User).filter(User.org_id == org_id, User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists in the organization"
        )

    user = User(
        org_id=org_id,
        department_id=user_in.department_id,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        avatar_url=user_in.avatar_url,
        is_active=user_in.is_active,
        is_verified=True
    )
    db.add(user)
    db.flush()

    assigned_roles = []
    for r_name in user_in.role_names:
        role_obj = db.query(Role).filter(Role.name == r_name).first()
        if role_obj:
            db.add(UserRole(user_id=user.id, role_id=role_obj.id))
            assigned_roles.append(r_name)

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        org_id=user.org_id,
        department_id=user.department_id,
        created_at=user.created_at,
        roles=assigned_roles
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    enforce_organization_isolation(user.org_id, current_user, db)
    roles = get_user_roles(user, db)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        org_id=user.org_id,
        department_id=user.department_id,
        created_at=user.created_at,
        roles=roles
    )


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    enforce_organization_isolation(user.org_id, current_user, db)
    
    # Only admins or the user themselves can update their profile
    current_roles = get_user_roles(current_user, db)
    if current_user.id != user.id and not any(r in current_roles for r in ["ORG_ADMIN", "SYS_ADMIN"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.phone is not None:
        user.phone = user_update.phone
    if user_update.avatar_url is not None:
        user.avatar_url = user_update.avatar_url
    if user_update.department_id is not None:
        user.department_id = user_update.department_id
    if user_update.is_active is not None and any(r in current_roles for r in ["ORG_ADMIN", "SYS_ADMIN"]):
        user.is_active = user_update.is_active
    if user_update.password is not None:
        user.hashed_password = get_password_hash(user_update.password)

    db.commit()
    db.refresh(user)
    roles = get_user_roles(user, db)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        org_id=user.org_id,
        department_id=user.department_id,
        created_at=user.created_at,
        roles=roles
    )


@router.delete("/{user_id}", response_model=MessageResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))])
def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    enforce_organization_isolation(user.org_id, current_user, db)

    user.is_active = False
    db.commit()
    return MessageResponse(message="User deactivated successfully")
