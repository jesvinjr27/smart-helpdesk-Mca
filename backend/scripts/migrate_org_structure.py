import sys
from pathlib import Path

# Ensure project root directory is in sys.path
_project_root = str(Path(__file__).resolve().parent.parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

import logging
from sqlalchemy import text, inspect
from backend.app.db.session import engine, SessionLocal, Base
from backend.app.models.all_models import (
    Organization,
    Department,
    Team,
    TeamMember,
    User,
    OrganizationalUnitType,
    OrganizationalUnit,
    Position,
    UserUnitMembership
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s]: %(message)s")
logger = logging.getLogger("migration")


def run_migration():
    logger.info("Starting Phase 2 Dynamic Organizational Structure Migration...")

    # 1. Add missing columns to organizations table if needed
    with engine.connect() as conn:
        inspector = inspect(engine)
        org_cols = [c["name"] for c in inspector.get_columns("organizations")]
        if "org_type" not in org_cols:
            logger.info("Adding org_type column to organizations table...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN org_type VARCHAR(30) DEFAULT 'COMPANY' NOT NULL;"))
            conn.commit()
        if "settings" not in org_cols:
            logger.info("Adding settings column to organizations table...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN settings JSON DEFAULT '{}' NOT NULL;"))
            conn.commit()

    # 2. Create newly declared tables
    logger.info("Creating new tables: organizational_unit_types, organizational_units, positions, user_unit_memberships...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 3. Update Greenwood Institute to COLLEGE
        greenwood = db.query(Organization).filter(Organization.code == "GIT").first()
        if greenwood:
            greenwood.org_type = "COLLEGE"
            db.commit()
            logger.info("Updated Greenwood Institute of Technology org_type to 'COLLEGE'.")

        # 4. Create default unit types for all organizations
        orgs = db.query(Organization).all()
        for org in orgs:
            logger.info(f"Checking unit types for organization: {org.name} ({org.org_type})")
            if org.org_type == "COLLEGE":
                default_types = [
                    ("Faculty", "FACULTY", "bi-mortarboard", 0),
                    ("Department", "DEPARTMENT", "bi-building", 1),
                    ("Programme", "PROGRAMME", "bi-journal-bookmark", 2),
                    ("Team / Unit", "TEAM", "bi-people", 3),
                    ("Laboratory", "LABORATORY", "bi-cpu", 4),
                ]
            else:
                default_types = [
                    ("Division", "DIVISION", "bi-diagram-2", 0),
                    ("Department", "DEPARTMENT", "bi-building", 1),
                    ("Team", "TEAM", "bi-people", 2),
                    ("Squad", "SQUAD", "bi-lightning", 3),
                ]

            for name, code, icon, hint in default_types:
                existing_type = db.query(OrganizationalUnitType).filter(
                    OrganizationalUnitType.org_id == org.id,
                    OrganizationalUnitType.code == code
                ).first()
                if not existing_type:
                    ut = OrganizationalUnitType(
                        org_id=org.id,
                        name=name,
                        code=code,
                        icon=icon,
                        level_hint=hint,
                        is_active=True
                    )
                    db.add(ut)
            db.commit()

        # 5. Seed positions from existing users' job titles
        users = db.query(User).all()
        for u in users:
            if u.job_title:
                title_clean = u.job_title.strip()
                pos = db.query(Position).filter(
                    Position.org_id == u.org_id,
                    Position.title == title_clean
                ).first()
                if not pos:
                    pos = Position(
                        org_id=u.org_id,
                        title=title_clean,
                        description=f"Standard designation: {title_clean}",
                        is_active=True
                    )
                    db.add(pos)
        db.commit()

        # 6. Backfill legacy departments into organizational_units
        depts = db.query(Department).all()
        for d in depts:
            dept_type = db.query(OrganizationalUnitType).filter(
                OrganizationalUnitType.org_id == d.org_id,
                OrganizationalUnitType.code == ("DEPARTMENT" if d.code != "CIT" else "FACULTY")
            ).first()
            if not dept_type:
                dept_type = db.query(OrganizationalUnitType).filter(
                    OrganizationalUnitType.org_id == d.org_id,
                    OrganizationalUnitType.code == "DEPARTMENT"
                ).first()

            existing_unit = db.query(OrganizationalUnit).filter(OrganizationalUnit.id == d.id).first()
            if not existing_unit:
                unit = OrganizationalUnit(
                    id=d.id,
                    org_id=d.org_id,
                    unit_type_id=dept_type.id,
                    parent_id=None,
                    name=d.name,
                    code=d.code,
                    description=d.description,
                    hierarchy_path=f"/{d.id}",
                    is_active=d.is_active
                )
                db.add(unit)
                logger.info(f"Backfilled Department '{d.name}' as OrganizationalUnit.")
        db.commit()

        # 7. Backfill legacy teams into organizational_units
        teams = db.query(Team).all()
        for t in teams:
            team_type = db.query(OrganizationalUnitType).filter(
                OrganizationalUnitType.org_id == t.org_id,
                OrganizationalUnitType.code == "TEAM"
            ).first()

            existing_unit = db.query(OrganizationalUnit).filter(OrganizationalUnit.id == t.id).first()
            if not existing_unit:
                parent_unit = db.query(OrganizationalUnit).filter(OrganizationalUnit.id == t.department_id).first()
                parent_path = parent_unit.hierarchy_path if parent_unit else ""
                
                unit = OrganizationalUnit(
                    id=t.id,
                    org_id=t.org_id,
                    unit_type_id=team_type.id,
                    parent_id=t.department_id,
                    name=t.name,
                    code=f"{t.name[:4].upper()}-{t.id[:4].upper()}",
                    description=t.description,
                    email=t.email,
                    hierarchy_path=f"{parent_path}/{t.id}" if parent_path else f"/{t.id}",
                    is_active=t.is_active
                )
                db.add(unit)
                logger.info(f"Backfilled Team '{t.name}' as OrganizationalUnit under parent {t.department_id}.")
        db.commit()

        # 8. Backfill legacy team_members into user_unit_memberships
        team_members = db.query(TeamMember).all()
        for tm in team_members:
            user = db.query(User).filter(User.id == tm.user_id).first()
            pos_id = None
            if user and user.job_title:
                p = db.query(Position).filter(
                    Position.org_id == user.org_id,
                    Position.title == user.job_title.strip()
                ).first()
                if p:
                    pos_id = p.id

            existing_m = db.query(UserUnitMembership).filter(
                UserUnitMembership.unit_id == tm.team_id,
                UserUnitMembership.user_id == tm.user_id
            ).first()
            if not existing_m:
                m = UserUnitMembership(
                    user_id=tm.user_id,
                    unit_id=tm.team_id,
                    position_id=pos_id,
                    is_lead=tm.is_lead,
                    is_primary=True
                )
                db.add(m)
                logger.info(f"Backfilled TeamMember {tm.user_id} into UserUnitMembership for unit {tm.team_id}.")
        db.commit()

        # 9. Also assign users to their department unit if not already member
        for u in users:
            if u.department_id:
                existing_dept_m = db.query(UserUnitMembership).filter(
                    UserUnitMembership.unit_id == u.department_id,
                    UserUnitMembership.user_id == u.id
                ).first()
                if not existing_dept_m:
                    pos_id = None
                    if u.job_title:
                        p = db.query(Position).filter(
                            Position.org_id == u.org_id,
                            Position.title == u.job_title.strip()
                        ).first()
                        if p:
                            pos_id = p.id

                    # Check if already has a primary
                    has_primary = db.query(UserUnitMembership).filter(
                        UserUnitMembership.user_id == u.id,
                        UserUnitMembership.is_primary == True
                    ).count() > 0

                    dm = UserUnitMembership(
                        user_id=u.id,
                        unit_id=u.department_id,
                        position_id=pos_id,
                        is_lead=False,
                        is_primary=not has_primary
                    )
                    db.add(dm)
        db.commit()

        total_units = db.query(OrganizationalUnit).count()
        total_types = db.query(OrganizationalUnitType).count()
        total_positions = db.query(Position).count()
        total_memberships = db.query(UserUnitMembership).count()
        logger.info(f"Migration completed successfully! Summary: {total_types} unit types, {total_units} units, {total_positions} positions, {total_memberships} memberships.")
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
