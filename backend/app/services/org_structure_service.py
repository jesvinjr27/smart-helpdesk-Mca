import logging
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from backend.app.models.all_models import (
    OrganizationalUnit,
    OrganizationalUnitType,
    Position,
    UserUnitMembership,
    User,
    AuditLog,
    utc_now
)
from backend.app.schemas.all_schemas import (
    OrganizationalUnitCreate,
    OrganizationalUnitUpdate,
    OrganizationalUnitMoveRequest,
    OrganizationalUnitResponse,
    OrganizationalUnitTreeNode,
    UnitMemberDetailResponse,
    OrganizationalUnitTypeCreate,
    PositionCreate,
    UserUnitMembershipCreate
)

logger = logging.getLogger(__name__)


class OrgStructureService:
    @staticmethod
    def get_unit_types(org_id: str, db: Session) -> List[OrganizationalUnitType]:
        return db.query(OrganizationalUnitType).filter(
            OrganizationalUnitType.org_id == org_id,
            OrganizationalUnitType.is_active == True
        ).order_by(OrganizationalUnitType.level_hint.asc(), OrganizationalUnitType.name.asc()).all()

    @staticmethod
    def create_unit_type(org_id: str, type_in: OrganizationalUnitTypeCreate, current_user: User, db: Session) -> OrganizationalUnitType:
        existing = db.query(OrganizationalUnitType).filter(
            OrganizationalUnitType.org_id == org_id,
            OrganizationalUnitType.code == type_in.code.upper().strip()
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unit type with code '{type_in.code}' already exists in this organization."
            )

        unit_type = OrganizationalUnitType(
            org_id=org_id,
            name=type_in.name.strip(),
            code=type_in.code.upper().strip(),
            icon=type_in.icon or "bi-diagram-3",
            level_hint=type_in.level_hint or 0,
            is_active=type_in.is_active if type_in.is_active is not None else True
        )
        db.add(unit_type)
        db.commit()
        db.refresh(unit_type)
        return unit_type

    @staticmethod
    def get_positions(org_id: str, db: Session) -> List[Position]:
        return db.query(Position).filter(
            Position.org_id == org_id,
            Position.is_active == True
        ).order_by(Position.title.asc()).all()

    @staticmethod
    def create_position(org_id: str, pos_in: PositionCreate, current_user: User, db: Session) -> Position:
        existing = db.query(Position).filter(
            Position.org_id == org_id,
            Position.title == pos_in.title.strip()
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Position '{pos_in.title}' already exists in this organization."
            )

        pos = Position(
            org_id=org_id,
            title=pos_in.title.strip(),
            description=pos_in.description,
            is_active=pos_in.is_active if pos_in.is_active is not None else True
        )
        db.add(pos)
        db.commit()
        db.refresh(pos)
        return pos

    @staticmethod
    def get_units(
        org_id: str,
        db: Session,
        parent_id: Optional[str] = None,
        unit_type_id: Optional[str] = None,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        query = db.query(OrganizationalUnit).filter(OrganizationalUnit.org_id == org_id)
        if active_only:
            query = query.filter(OrganizationalUnit.is_active == True)
        if parent_id is not None:
            if parent_id == "root":
                query = query.filter(OrganizationalUnit.parent_id == None)
            else:
                query = query.filter(OrganizationalUnit.parent_id == parent_id)
        if unit_type_id:
            query = query.filter(OrganizationalUnit.unit_type_id == unit_type_id)

        units = query.order_by(OrganizationalUnit.name.asc()).all()
        result = []
        for u in units:
            member_count = db.query(UserUnitMembership).filter(UserUnitMembership.unit_id == u.id).count()
            result.append({
                "id": u.id,
                "org_id": u.org_id,
                "unit_type_id": u.unit_type_id,
                "unit_type_name": u.unit_type.name if u.unit_type else None,
                "unit_type_icon": u.unit_type.icon if u.unit_type else "bi-diagram-3",
                "parent_id": u.parent_id,
                "parent_name": u.parent.name if u.parent else None,
                "name": u.name,
                "code": u.code,
                "description": u.description,
                "email": u.email,
                "hierarchy_path": u.hierarchy_path,
                "is_active": u.is_active,
                "member_count": member_count,
                "created_at": u.created_at,
                "updated_at": u.updated_at
            })
        return result

    @staticmethod
    def get_unit_by_id(unit_id: str, org_id: str, db: Session) -> Dict[str, Any]:
        u = db.query(OrganizationalUnit).filter(
            OrganizationalUnit.id == unit_id,
            OrganizationalUnit.org_id == org_id
        ).first()
        if not u:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizational unit not found")

        members = (
            db.query(UserUnitMembership, User, Position)
            .join(User, UserUnitMembership.user_id == User.id)
            .outerjoin(Position, UserUnitMembership.position_id == Position.id)
            .filter(UserUnitMembership.unit_id == u.id)
            .order_by(UserUnitMembership.is_lead.desc(), User.full_name.asc())
            .all()
        )
        members_data = [
            {
                "membership_id": m.UserUnitMembership.id,
                "user_id": m.User.id,
                "full_name": m.User.full_name,
                "email": m.User.email,
                "avatar_url": m.User.avatar_url,
                "position_id": m.Position.id if m.Position else None,
                "position_title": m.Position.title if m.Position else None,
                "is_lead": m.UserUnitMembership.is_lead,
                "is_primary": m.UserUnitMembership.is_primary,
                "created_at": m.UserUnitMembership.created_at
            }
            for m in members
        ]

        return {
            "id": u.id,
            "org_id": u.org_id,
            "unit_type_id": u.unit_type_id,
            "unit_type_name": u.unit_type.name if u.unit_type else None,
            "unit_type_icon": u.unit_type.icon if u.unit_type else "bi-diagram-3",
            "parent_id": u.parent_id,
            "parent_name": u.parent.name if u.parent else None,
            "name": u.name,
            "code": u.code,
            "description": u.description,
            "email": u.email,
            "hierarchy_path": u.hierarchy_path,
            "is_active": u.is_active,
            "member_count": len(members_data),
            "members": members_data,
            "created_at": u.created_at,
            "updated_at": u.updated_at
        }

    @staticmethod
    def get_tree(org_id: str, db: Session, active_only: bool = True) -> List[Dict[str, Any]]:
        """
        Builds and returns the full interactive organizational hierarchy tree.
        """
        query = db.query(OrganizationalUnit).filter(OrganizationalUnit.org_id == org_id)
        if active_only:
            query = query.filter(OrganizationalUnit.is_active == True)
        all_units = query.all()

        # Pre-fetch all memberships for fast dictionary lookup
        memberships = (
            db.query(UserUnitMembership, User, Position)
            .join(User, UserUnitMembership.user_id == User.id)
            .outerjoin(Position, UserUnitMembership.position_id == Position.id)
            .filter(User.org_id == org_id)
            .all()
        )
        members_by_unit: Dict[str, List[Dict[str, Any]]] = {}
        for m in memberships:
            uid = m.UserUnitMembership.unit_id
            if uid not in members_by_unit:
                members_by_unit[uid] = []
            members_by_unit[uid].append({
                "membership_id": m.UserUnitMembership.id,
                "user_id": m.User.id,
                "full_name": m.User.full_name,
                "email": m.User.email,
                "avatar_url": m.User.avatar_url,
                "position_id": m.Position.id if m.Position else None,
                "position_title": m.Position.title if m.Position else None,
                "is_lead": m.UserUnitMembership.is_lead,
                "is_primary": m.UserUnitMembership.is_primary,
                "created_at": m.UserUnitMembership.created_at
            })

        # Build mapping of id -> node dictionary
        nodes: Dict[str, Dict[str, Any]] = {}
        for u in all_units:
            m_list = members_by_unit.get(u.id, [])
            nodes[u.id] = {
                "id": u.id,
                "org_id": u.org_id,
                "unit_type_id": u.unit_type_id,
                "unit_type_name": u.unit_type.name if u.unit_type else "Unit",
                "unit_type_icon": u.unit_type.icon if u.unit_type else "bi-diagram-3",
                "parent_id": u.parent_id,
                "name": u.name,
                "code": u.code,
                "description": u.description,
                "email": u.email,
                "hierarchy_path": u.hierarchy_path,
                "is_active": u.is_active,
                "member_count": len(m_list),
                "members": m_list,
                "children": []
            }

        # Assemble tree
        root_nodes: List[Dict[str, Any]] = []
        for node in nodes.values():
            pid = node["parent_id"]
            if pid and pid in nodes:
                nodes[pid]["children"].append(node)
            else:
                root_nodes.append(node)

        # Sort children deterministically by name
        def sort_children(n):
            n["children"].sort(key=lambda x: x["name"])
            for c in n["children"]:
                sort_children(c)

        root_nodes.sort(key=lambda x: x["name"])
        for r in root_nodes:
            sort_children(r)

        return root_nodes

    @staticmethod
    def create_unit(org_id: str, unit_in: OrganizationalUnitCreate, current_user: User, db: Session) -> OrganizationalUnit:
        # 1. Validate unit type belongs to org
        unit_type = db.query(OrganizationalUnitType).filter(
            OrganizationalUnitType.id == unit_in.unit_type_id,
            OrganizationalUnitType.org_id == org_id
        ).first()
        if not unit_type:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid unit type specified for organization")

        # 2. Validate parent if specified
        parent_path = ""
        if unit_in.parent_id:
            parent = db.query(OrganizationalUnit).filter(
                OrganizationalUnit.id == unit_in.parent_id,
                OrganizationalUnit.org_id == org_id
            ).first()
            if not parent:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent organizational unit not found in this organization")
            parent_path = parent.hierarchy_path or f"/{parent.id}"

        # 3. Check code uniqueness within org
        code_clean = unit_in.code.upper().strip()
        existing = db.query(OrganizationalUnit).filter(
            OrganizationalUnit.org_id == org_id,
            OrganizationalUnit.code == code_clean
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unit code '{code_clean}' already exists in this organization")

        # 4. Create unit
        unit = OrganizationalUnit(
            org_id=org_id,
            unit_type_id=unit_in.unit_type_id,
            parent_id=unit_in.parent_id,
            name=unit_in.name.strip(),
            code=code_clean,
            description=unit_in.description,
            email=unit_in.email,
            is_active=unit_in.is_active if unit_in.is_active is not None else True
        )
        db.add(unit)
        db.flush()

        unit.hierarchy_path = f"{parent_path}/{unit.id}" if parent_path else f"/{unit.id}"
        
        # Log to audit log
        audit = AuditLog(
            org_id=org_id,
            actor_id=current_user.id,
            action="ORGANIZATION_UNIT_CREATED",
            entity_type="ORGANIZATIONAL_UNIT",
            entity_id=unit.id,
            details={"name": unit.name, "code": unit.code, "parent_id": unit.parent_id, "type": unit_type.name}
        )
        db.add(audit)
        db.commit()
        db.refresh(unit)
        return unit

    @staticmethod
    def update_unit(unit_id: str, org_id: str, unit_in: OrganizationalUnitUpdate, current_user: User, db: Session) -> OrganizationalUnit:
        unit = db.query(OrganizationalUnit).filter(
            OrganizationalUnit.id == unit_id,
            OrganizationalUnit.org_id == org_id
        ).first()
        if not unit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizational unit not found")

        if unit_in.code:
            clean_code = unit_in.code.upper().strip()
            existing = db.query(OrganizationalUnit).filter(
                OrganizationalUnit.org_id == org_id,
                OrganizationalUnit.code == clean_code,
                OrganizationalUnit.id != unit.id
            ).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unit code '{clean_code}' already exists")
            unit.code = clean_code

        if unit_in.name is not None:
            unit.name = unit_in.name.strip()
        if unit_in.unit_type_id is not None:
            ut = db.query(OrganizationalUnitType).filter(
                OrganizationalUnitType.id == unit_in.unit_type_id,
                OrganizationalUnitType.org_id == org_id
            ).first()
            if not ut:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid unit type")
            unit.unit_type_id = unit_in.unit_type_id
        if unit_in.description is not None:
            unit.description = unit_in.description
        if unit_in.email is not None:
            unit.email = unit_in.email
        if unit_in.is_active is not None:
            unit.is_active = unit_in.is_active

        unit.updated_at = utc_now()
        audit = AuditLog(
            org_id=org_id,
            actor_id=current_user.id,
            action="ORGANIZATION_UNIT_UPDATED",
            entity_type="ORGANIZATIONAL_UNIT",
            entity_id=unit.id,
            details={"name": unit.name, "code": unit.code, "is_active": unit.is_active}
        )
        db.add(audit)
        db.commit()
        db.refresh(unit)
        return unit

    @staticmethod
    def move_unit(unit_id: str, org_id: str, move_in: OrganizationalUnitMoveRequest, current_user: User, db: Session) -> OrganizationalUnit:
        unit = db.query(OrganizationalUnit).filter(
            OrganizationalUnit.id == unit_id,
            OrganizationalUnit.org_id == org_id
        ).first()
        if not unit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizational unit not found")

        new_parent_id = move_in.new_parent_id

        # Hierarchy validation rules
        if new_parent_id == unit.id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A unit cannot be its own parent."
            )

        new_parent_path = ""
        if new_parent_id:
            new_parent = db.query(OrganizationalUnit).filter(
                OrganizationalUnit.id == new_parent_id,
                OrganizationalUnit.org_id == org_id
            ).first()
            if not new_parent:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Target parent unit not found in this organization."
                )

            # Cycle detection: Ensure target parent is not already a descendant of this unit
            # By checking hierarchy_path or traversing ancestors
            curr_unit_path = unit.hierarchy_path or f"/{unit.id}"
            target_parent_path = new_parent.hierarchy_path or f"/{new_parent.id}"
            if curr_unit_path in target_parent_path:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Circular relationship detected: cannot move a parent unit into one of its own descendants."
                )
            new_parent_path = target_parent_path

        old_parent_id = unit.parent_id
        old_path = unit.hierarchy_path or f"/{unit.id}"
        new_path = f"{new_parent_path}/{unit.id}" if new_parent_path else f"/{unit.id}"

        unit.parent_id = new_parent_id
        unit.hierarchy_path = new_path
        unit.updated_at = utc_now()

        # Recursively update all descendants' hierarchy_path
        descendants = db.query(OrganizationalUnit).filter(
            OrganizationalUnit.org_id == org_id,
            OrganizationalUnit.hierarchy_path.like(f"{old_path}/%")
        ).all()
        for d in descendants:
            d.hierarchy_path = d.hierarchy_path.replace(old_path, new_path, 1)

        audit = AuditLog(
            org_id=org_id,
            actor_id=current_user.id,
            action="ORGANIZATION_UNIT_MOVED",
            entity_type="ORGANIZATIONAL_UNIT",
            entity_id=unit.id,
            details={"old_parent_id": old_parent_id, "new_parent_id": new_parent_id, "descendants_affected": len(descendants)}
        )
        db.add(audit)
        db.commit()
        db.refresh(unit)
        return unit

    @staticmethod
    def deactivate_unit(unit_id: str, org_id: str, current_user: User, db: Session) -> bool:
        unit = db.query(OrganizationalUnit).filter(
            OrganizationalUnit.id == unit_id,
            OrganizationalUnit.org_id == org_id
        ).first()
        if not unit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizational unit not found")

        unit.is_active = False
        unit.updated_at = utc_now()

        # Deactivate all descendants
        unit_path = unit.hierarchy_path or f"/{unit.id}"
        descendants = db.query(OrganizationalUnit).filter(
            OrganizationalUnit.org_id == org_id,
            OrganizationalUnit.hierarchy_path.like(f"{unit_path}/%")
        ).all()
        for d in descendants:
            d.is_active = False

        audit = AuditLog(
            org_id=org_id,
            actor_id=current_user.id,
            action="ORGANIZATION_UNIT_DEACTIVATED",
            entity_type="ORGANIZATIONAL_UNIT",
            entity_id=unit.id,
            details={"descendants_deactivated": len(descendants)}
        )
        db.add(audit)
        db.commit()
        return True

    @staticmethod
    def add_member(unit_id: str, org_id: str, member_in: UserUnitMembershipCreate, current_user: User, db: Session) -> UserUnitMembership:
        unit = db.query(OrganizationalUnit).filter(
            OrganizationalUnit.id == unit_id,
            OrganizationalUnit.org_id == org_id
        ).first()
        if not unit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizational unit not found")

        target_user = db.query(User).filter(
            User.id == member_in.user_id,
            User.org_id == org_id
        ).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found in this organization")

        if member_in.position_id:
            pos = db.query(Position).filter(
                Position.id == member_in.position_id,
                Position.org_id == org_id
            ).first()
            if not pos:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Position not found in this organization")

        existing = db.query(UserUnitMembership).filter(
            UserUnitMembership.unit_id == unit_id,
            UserUnitMembership.user_id == member_in.user_id
        ).first()
        if existing:
            # Update existing membership
            existing.position_id = member_in.position_id
            existing.is_lead = bool(member_in.is_lead)
            existing.is_primary = bool(member_in.is_primary)
            db.commit()
            db.refresh(existing)
            return existing

        membership = UserUnitMembership(
            user_id=member_in.user_id,
            unit_id=unit_id,
            position_id=member_in.position_id,
            is_lead=bool(member_in.is_lead),
            is_primary=bool(member_in.is_primary)
        )
        db.add(membership)
        
        audit = AuditLog(
            org_id=org_id,
            actor_id=current_user.id,
            action="UNIT_MEMBER_ASSIGNED",
            entity_type="USER_UNIT_MEMBERSHIP",
            entity_id=membership.id,
            details={"user_id": target_user.id, "unit_id": unit.id, "is_lead": member_in.is_lead}
        )
        db.add(audit)
        db.commit()
        db.refresh(membership)
        return membership

    @staticmethod
    def remove_member(unit_id: str, user_id: str, org_id: str, current_user: User, db: Session) -> bool:
        membership = (
            db.query(UserUnitMembership)
            .join(OrganizationalUnit, UserUnitMembership.unit_id == OrganizationalUnit.id)
            .filter(
                UserUnitMembership.unit_id == unit_id,
                UserUnitMembership.user_id == user_id,
                OrganizationalUnit.org_id == org_id
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User membership not found in this unit")

        db.delete(membership)
        audit = AuditLog(
            org_id=org_id,
            actor_id=current_user.id,
            action="UNIT_MEMBER_REMOVED",
            entity_type="USER_UNIT_MEMBERSHIP",
            entity_id=unit_id,
            details={"removed_user_id": user_id, "unit_id": unit_id}
        )
        db.add(audit)
        db.commit()
        return True
