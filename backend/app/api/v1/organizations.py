from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.all_models import Organization, Department, Team, Category, User
from backend.app.schemas.all_schemas import (
    OrganizationResponse,
    OrganizationCreate,
    DepartmentResponse,
    DepartmentCreate,
    TeamResponse,
    TeamCreate,
    CategoryResponse,
    CategoryCreate,
    MessageResponse
)
from backend.app.core.dependencies import (
    get_current_user,
    require_role,
    enforce_organization_isolation
)

router = APIRouter(tags=["Organizations & Structure"])


# ---------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------
@router.get("/organizations", response_model=List[OrganizationResponse])
def list_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only return the user's organization unless sysadmin
    if any(r.role.name == "SYS_ADMIN" for r in current_user.user_roles):
        return db.query(Organization).all()
    return db.query(Organization).filter(Organization.id == current_user.org_id).all()


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
def get_organization(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    enforce_organization_isolation(org_id, current_user, db)
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


# ---------------------------------------------------------------------
# Departments
# ---------------------------------------------------------------------
@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Department).filter(
        Department.org_id == current_user.org_id,
        Department.is_active == True
    ).all()


@router.post("/departments", response_model=DepartmentResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))])
def create_department(
    dept_in: DepartmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = enforce_organization_isolation(dept_in.org_id, current_user, db)
    dept = Department(
        org_id=org_id,
        name=dept_in.name,
        code=dept_in.code,
        description=dept_in.description,
        is_active=dept_in.is_active
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/departments/{dept_id}", response_model=MessageResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))])
def delete_department(
    dept_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    enforce_organization_isolation(dept.org_id, current_user, db)
    dept.is_active = False
    db.commit()
    return MessageResponse(message="Department deactivated successfully")


# ---------------------------------------------------------------------
# Teams
# ---------------------------------------------------------------------
@router.get("/teams", response_model=List[TeamResponse])
def list_teams(
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Team).filter(
        Team.org_id == current_user.org_id,
        Team.is_active == True
    )
    if department_id:
        query = query.filter(Team.department_id == department_id)
    return query.all()


@router.post("/teams", response_model=TeamResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN", "LEAD"]))])
def create_team(
    team_in: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = enforce_organization_isolation(team_in.org_id, current_user, db)
    team = Team(
        org_id=org_id,
        department_id=team_in.department_id,
        name=team_in.name,
        description=team_in.description,
        email=team_in.email,
        is_active=team_in.is_active
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


# ---------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------
@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Category).filter(
        Category.org_id == current_user.org_id,
        Category.is_active == True
    ).all()


@router.post("/categories", response_model=CategoryResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))])
def create_category(
    cat_in: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = enforce_organization_isolation(cat_in.org_id, current_user, db)
    cat = Category(
        org_id=org_id,
        name=cat_in.name,
        description=cat_in.description,
        default_priority=cat_in.default_priority,
        default_department_id=cat_in.default_department_id,
        default_team_id=cat_in.default_team_id,
        is_active=cat_in.is_active
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}", response_model=MessageResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))])
def delete_category(
    cat_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    enforce_organization_isolation(cat.org_id, current_user, db)
    cat.is_active = False
    db.commit()
    return MessageResponse(message="Category deactivated successfully")
