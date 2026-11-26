from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.all_models import User
from backend.app.schemas.all_schemas import (
    OrganizationalUnitTypeResponse,
    OrganizationalUnitTypeCreate,
    PositionResponse,
    PositionCreate,
    OrganizationalUnitResponse,
    OrganizationalUnitCreate,
    OrganizationalUnitUpdate,
    OrganizationalUnitMoveRequest,
    OrganizationalUnitTreeNode,
    UserUnitMembershipCreate,
    UnitMemberDetailResponse,
    MessageResponse
)
from backend.app.core.dependencies import (
    get_current_user,
    require_role,
    enforce_organization_isolation
)
from backend.app.services.org_structure_service import OrgStructureService

router = APIRouter(prefix="/org-structure", tags=["Organization Structure"])


# ---------------------------------------------------------------------
# Hierarchy Tree
# ---------------------------------------------------------------------
@router.get("/tree", response_model=List[OrganizationalUnitTreeNode], summary="Get full organization hierarchy tree")
def get_organization_tree(
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the complete organizational hierarchy as an interactive tree structure.
    """
    return OrgStructureService.get_tree(current_user.org_id, db, active_only=active_only)


# ---------------------------------------------------------------------
# Unit Types
# ---------------------------------------------------------------------
@router.get("/unit-types", response_model=List[OrganizationalUnitTypeResponse], summary="List organizational unit types")
def list_unit_types(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OrgStructureService.get_unit_types(current_user.org_id, db)


@router.post("/unit-types", response_model=OrganizationalUnitTypeResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))], summary="Create unit type")
def create_unit_type(
    type_in: OrganizationalUnitTypeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = enforce_organization_isolation(type_in.org_id, current_user, db)
    return OrgStructureService.create_unit_type(org_id, type_in, current_user, db)


# ---------------------------------------------------------------------
# Positions
# ---------------------------------------------------------------------
@router.get("/positions", response_model=List[PositionResponse], summary="List organization positions/designations")
def list_positions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OrgStructureService.get_positions(current_user.org_id, db)


@router.post("/positions", response_model=PositionResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))], summary="Create organization position")
def create_position(
    pos_in: PositionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = enforce_organization_isolation(pos_in.org_id, current_user, db)
    return OrgStructureService.create_position(org_id, pos_in, current_user, db)


# ---------------------------------------------------------------------
# Organizational Units (Flat List & CRUD)
# ---------------------------------------------------------------------
@router.get("/units", response_model=List[OrganizationalUnitResponse], summary="List organizational units")
def list_units(
    parent_id: Optional[str] = None,
    unit_type_id: Optional[str] = None,
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OrgStructureService.get_units(
        org_id=current_user.org_id,
        db=db,
        parent_id=parent_id,
        unit_type_id=unit_type_id,
        active_only=active_only
    )


@router.post("/units", response_model=Dict[str, Any], dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))], summary="Create organizational unit")
def create_unit(
    unit_in: OrganizationalUnitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = enforce_organization_isolation(unit_in.org_id, current_user, db)
    unit = OrgStructureService.create_unit(org_id, unit_in, current_user, db)
    return OrgStructureService.get_unit_by_id(unit.id, org_id, db)


@router.get("/units/{unit_id}", response_model=Dict[str, Any], summary="Get unit details and members")
def get_unit_details(
    unit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OrgStructureService.get_unit_by_id(unit_id, current_user.org_id, db)


@router.put("/units/{unit_id}", response_model=Dict[str, Any], dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))], summary="Update organizational unit")
def update_unit(
    unit_id: str,
    unit_in: OrganizationalUnitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    unit = OrgStructureService.update_unit(unit_id, current_user.org_id, unit_in, current_user, db)
    return OrgStructureService.get_unit_by_id(unit.id, current_user.org_id, db)


@router.put("/units/{unit_id}/move", response_model=Dict[str, Any], dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))], summary="Move unit to a new parent (reparenting with cycle checks)")
def move_unit(
    unit_id: str,
    move_in: OrganizationalUnitMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    unit = OrgStructureService.move_unit(unit_id, current_user.org_id, move_in, current_user, db)
    return OrgStructureService.get_unit_by_id(unit.id, current_user.org_id, db)


@router.delete("/units/{unit_id}", response_model=MessageResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))], summary="Deactivate organizational unit")
def deactivate_unit(
    unit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    OrgStructureService.deactivate_unit(unit_id, current_user.org_id, current_user, db)
    return MessageResponse(message="Organizational unit and its subtree deactivated successfully")


# ---------------------------------------------------------------------
# Unit Memberships
# ---------------------------------------------------------------------
@router.post("/units/{unit_id}/members", response_model=Dict[str, Any], dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN", "LEAD"]))], summary="Assign user to organizational unit")
def assign_member(
    unit_id: str,
    member_in: UserUnitMembershipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = OrgStructureService.add_member(unit_id, current_user.org_id, member_in, current_user, db)
    return OrgStructureService.get_unit_by_id(unit_id, current_user.org_id, db)


@router.delete("/units/{unit_id}/members/{user_id}", response_model=MessageResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN", "LEAD"]))], summary="Remove user from organizational unit")
def remove_member(
    unit_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    OrgStructureService.remove_member(unit_id, user_id, current_user.org_id, current_user, db)
    return MessageResponse(message="User membership removed from unit successfully")
