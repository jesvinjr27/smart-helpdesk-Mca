import pytest
from fastapi import HTTPException
from backend.app.db.session import SessionLocal
from backend.app.models.all_models import (
    User,
    Organization,
    OrganizationalUnit,
    OrganizationalUnitType,
    Position,
    UserUnitMembership
)
from backend.app.schemas.all_schemas import (
    OrganizationalUnitTypeCreate,
    OrganizationalUnitCreate,
    OrganizationalUnitUpdate,
    OrganizationalUnitMoveRequest,
    PositionCreate,
    UserUnitMembershipCreate
)
from backend.app.services.org_structure_service import OrgStructureService
from backend.app.api.v1.org_structure import (
    get_organization_tree,
    list_unit_types,
    create_unit_type,
    list_positions,
    create_position,
    list_units,
    create_unit,
    get_unit_details,
    update_unit,
    move_unit,
    deactivate_unit,
    assign_member,
    remove_member
)
from backend.app.api.v1.organizations import list_departments, list_teams


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def apex_admin(db):
    user = db.query(User).filter(User.email == "admin@apex.com").first()
    assert user is not None
    return user


@pytest.fixture
def greenwood_admin(db):
    user = db.query(User).filter(User.email == "admin@greenwood.edu").first()
    assert user is not None
    return user


def test_get_organization_tree(db, apex_admin):
    """Test retrieving full organization hierarchy tree for Apex."""
    tree = get_organization_tree(active_only=True, current_user=apex_admin, db=db)
    assert len(tree) >= 1
    # Check that root nodes have children (e.g. IT department has teams)
    it_node = next((n for n in tree if n["code"] == "IT" or "Information Technology" in n["name"]), None)
    assert it_node is not None
    assert len(it_node["children"]) >= 1
    # Check that child node has correct parent_id
    child = it_node["children"][0]
    assert child["parent_id"] == it_node["id"]
    assert "hierarchy_path" in child
    assert child["unit_type_name"] == "Team"


def test_create_custom_unit_type(db, apex_admin):
    """Test creating a custom unit type."""
    import uuid
    code_suffix = uuid.uuid4().hex[:6].upper()
    type_in = OrganizationalUnitTypeCreate(
        name=f"Innovation Hub {code_suffix}",
        code=f"IH_{code_suffix}",
        icon="bi-lightbulb",
        level_hint=2
    )
    res = create_unit_type(type_in=type_in, current_user=apex_admin, db=db)
    assert res.id is not None
    assert res.code == f"IH_{code_suffix}"
    assert res.org_id == apex_admin.org_id


def test_create_and_nest_units(db, apex_admin):
    """Test creating a multi-level organizational unit structure."""
    import uuid
    suffix = uuid.uuid4().hex[:6].upper()
    unit_types = list_unit_types(current_user=apex_admin, db=db)
    div_type = next((t for t in unit_types if t.code == "DIVISION"), unit_types[0])
    team_type = next((t for t in unit_types if t.code == "TEAM"), unit_types[-1])

    # 1. Create root division
    root_in = OrganizationalUnitCreate(
        name=f"Global Cloud Division {suffix}",
        code=f"GCD_{suffix}",
        unit_type_id=div_type.id,
        parent_id=None,
        description="Global cloud infrastructure division"
    )
    root_unit = create_unit(unit_in=root_in, current_user=apex_admin, db=db)
    assert root_unit["parent_id"] is None
    assert root_unit["hierarchy_path"] == f"/{root_unit['id']}"

    # 2. Create child team
    child_in = OrganizationalUnitCreate(
        name=f"SRE Operations Squad {suffix}",
        code=f"SRE_{suffix}",
        unit_type_id=team_type.id,
        parent_id=root_unit["id"],
        description="Site reliability engineering team"
    )
    child_unit = create_unit(unit_in=child_in, current_user=apex_admin, db=db)
    assert child_unit["parent_id"] == root_unit["id"]
    assert child_unit["hierarchy_path"] == f"/{root_unit['id']}/{child_unit['id']}"


def test_circular_relationship_prevention(db, apex_admin):
    """Test that self-parenting and circular parenting are strictly rejected with 422."""
    units = list_units(current_user=apex_admin, db=db)
    parent_unit = units[0]
    child_units = [u for u in units if u["parent_id"] == parent_unit["id"]]
    assert len(child_units) > 0, "Need at least one child unit for circular check"
    child_unit = child_units[0]

    # Attempt 1: Unit cannot be its own parent
    with pytest.raises(HTTPException) as exc_self:
        move_unit(
            unit_id=parent_unit["id"],
            move_in=OrganizationalUnitMoveRequest(new_parent_id=parent_unit["id"]),
            current_user=apex_admin,
            db=db
        )
    assert exc_self.value.status_code == 422
    assert "cannot be its own parent" in exc_self.value.detail.lower()

    # Attempt 2: Parent cannot be moved into its own descendant
    with pytest.raises(HTTPException) as exc_cycle:
        move_unit(
            unit_id=parent_unit["id"],
            move_in=OrganizationalUnitMoveRequest(new_parent_id=child_unit["id"]),
            current_user=apex_admin,
            db=db
        )
    assert exc_cycle.value.status_code == 422
    assert "circular" in exc_cycle.value.detail.lower()


def test_move_unit_reparenting(db, apex_admin):
    """Test moving a unit to another valid parent and verifying path recalculation."""
    units = list_units(current_user=apex_admin, db=db)
    # Find two distinct root units (departments)
    root_units = [u for u in units if u["parent_id"] is None]
    assert len(root_units) >= 2, "Need at least 2 root units to test reparenting"

    dept_it = root_units[0]
    dept_hr = root_units[1]

    # Find a child under dept_it
    child = next(u for u in units if u["parent_id"] == dept_it["id"])

    # Move child from dept_it to dept_hr
    moved = move_unit(
        unit_id=child["id"],
        move_in=OrganizationalUnitMoveRequest(new_parent_id=dept_hr["id"]),
        current_user=apex_admin,
        db=db
    )
    assert moved["parent_id"] == dept_hr["id"]
    assert moved["hierarchy_path"] == f"/{dept_hr['id']}/{child['id']}"

    # Move it back to dept_it to preserve initial test fixture state
    restored = move_unit(
        unit_id=child["id"],
        move_in=OrganizationalUnitMoveRequest(new_parent_id=dept_it["id"]),
        current_user=apex_admin,
        db=db
    )
    assert restored["parent_id"] == dept_it["id"]


def test_member_assignment_and_removal(db, apex_admin):
    """Test assigning a user to a unit with designation and removing them."""
    # Find Johnathan Reed
    agent = db.query(User).filter(User.email == "agent.john@apex.com").first()
    assert agent is not None

    positions = list_positions(current_user=apex_admin, db=db)
    assert len(positions) > 0
    pos = positions[0]

    units = list_units(current_user=apex_admin, db=db)
    target_unit = units[0]

    # Assign member
    res = assign_member(
        unit_id=target_unit["id"],
        member_in=UserUnitMembershipCreate(
            user_id=agent.id,
            position_id=pos.id,
            is_lead=True,
            is_primary=False
        ),
        current_user=apex_admin,
        db=db
    )
    member_record = next((m for m in res["members"] if m["user_id"] == agent.id), None)
    assert member_record is not None
    assert member_record["position_id"] == pos.id
    assert member_record["is_lead"] is True

    # Remove member
    del_res = remove_member(
        unit_id=target_unit["id"],
        user_id=agent.id,
        current_user=apex_admin,
        db=db
    )
    assert del_res.success is True


def test_cross_tenant_isolation(db, apex_admin, greenwood_admin):
    """Test that a tenant admin cannot view or move units belonging to another organization."""
    greenwood_units = list_units(current_user=greenwood_admin, db=db)
    gw_unit = greenwood_units[0]

    # Apex admin attempts to retrieve Greenwood unit -> Should return 404 (isolated)
    with pytest.raises(HTTPException) as exc:
        get_unit_details(unit_id=gw_unit["id"], current_user=apex_admin, db=db)
    assert exc.value.status_code == 404

    # Apex admin attempts to reparent to Greenwood unit
    apex_units = list_units(current_user=apex_admin, db=db)
    with pytest.raises(HTTPException) as exc_move:
        move_unit(
            unit_id=apex_units[0]["id"],
            move_in=OrganizationalUnitMoveRequest(new_parent_id=gw_unit["id"]),
            current_user=apex_admin,
            db=db
        )
    assert exc_move.value.status_code in [400, 404]


def test_legacy_departments_and_teams_compatibility(db, apex_admin):
    """Test that legacy /departments and /teams endpoints continue to function."""
    depts = list_departments(current_user=apex_admin, db=db)
    assert len(depts) >= 1
    assert any(d.code == "IT" for d in depts)

    teams = list_teams(current_user=apex_admin, db=db)
    assert len(teams) >= 1
