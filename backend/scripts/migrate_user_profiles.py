import logging
import sys
from pathlib import Path

_project_root = str(Path(__file__).resolve().parent.parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from sqlalchemy import text
from backend.app.db.session import engine, SessionLocal
from backend.app.models.all_models import User, utc_now

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_and_seed_profiles():
    # 1. Add missing columns safely
    with engine.connect() as conn:
        user_cols = [
            ("alt_phone", "VARCHAR(50)"),
            ("job_title", "VARCHAR(100)"),
            ("location", "VARCHAR(150)"),
            ("timezone", "VARCHAR(50) DEFAULT 'UTC'"),
            ("preferred_language", "VARCHAR(20) DEFAULT 'en'"),
            ("bio", "TEXT"),
            ("skills", "TEXT"),
            ("external_id", "VARCHAR(50)"),
            ("user_type", "VARCHAR(50) DEFAULT 'EMPLOYEE'"),
            ("course", "VARCHAR(100)"),
            ("academic_year", "VARCHAR(50)"),
            ("reporting_manager", "VARCHAR(150)"),
            ("communication_preference", "VARCHAR(50) DEFAULT 'email'"),
            ("theme", "VARCHAR(20) DEFAULT 'light'"),
            ("date_format", "VARCHAR(20) DEFAULT 'YYYY-MM-DD'"),
            ("time_format", "VARCHAR(10) DEFAULT '12h'"),
            ("table_page_size", "INTEGER DEFAULT 10"),
            ("accessibility_preferences", "TEXT"),
            ("notification_preferences", "TEXT"),
        ]
        
        for col_name, col_type in user_cols:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                logger.info(f"Added column users.{col_name}")
            except Exception as e:
                # Column likely already exists
                pass

        token_cols = [
            ("user_agent", "VARCHAR(255)"),
            ("ip_address", "VARCHAR(45)"),
        ]
        for col_name, col_type in token_cols:
            try:
                conn.execute(text(f"ALTER TABLE refresh_tokens ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                logger.info(f"Added column refresh_tokens.{col_name}")
            except Exception as e:
                pass

    # 2. Seed initial profile fields for core demo accounts
    db = SessionLocal()
    try:
        users = {u.email: u for u in db.query(User).all()}

        # SYS_ADMIN
        if "sysadmin@smarthelpdesk.local" in users:
            u = users["sysadmin@smarthelpdesk.local"]
            u.job_title = "Principal Systems Architect"
            u.user_type = "ADMIN"
            u.location = "Global Operations Center"
            u.external_id = "SYS-ADMIN-001"
            u.phone = "+1 (555) 010-9999"
            u.alt_phone = "+1 (555) 010-9998"
            u.timezone = "UTC"
            u.preferred_language = "en"
            u.bio = "Global platform administrator overseeing multi-tenant infrastructure, Argon2id security policies, and AI services."
            u.theme = "light"
            u.date_format = "YYYY-MM-DD"
            u.time_format = "24h"
            u.table_page_size = 20

        # ORG_ADMIN
        if "admin@apex.com" in users:
            u = users["admin@apex.com"]
            u.job_title = "Director of IT Operations"
            u.user_type = "EMPLOYEE"
            u.location = "Apex New York Tower, Floor 14"
            u.external_id = "EMP-1001"
            u.phone = "+1 (555) 234-5678"
            u.alt_phone = "+1 (555) 234-5679"
            u.timezone = "America/New_York"
            u.preferred_language = "en"
            u.bio = "Directing enterprise IT services, queue balancing, organization policy enforcement, and audit governance."
            u.theme = "light"
            u.date_format = "YYYY-MM-DD"
            u.time_format = "12h"
            u.table_page_size = 10

        # LEAD
        if "lead.it@apex.com" in users:
            u = users["lead.it@apex.com"]
            u.job_title = "IT Support Team Lead"
            u.user_type = "EMPLOYEE"
            u.location = "Apex Austin Tech Center"
            u.external_id = "EMP-2045"
            u.phone = "+1 (555) 345-6789"
            u.timezone = "America/Chicago"
            u.preferred_language = "en"
            u.bio = "Team Lead coordinating tier-2 support queues, incident retrospectives, and SLA compliance."
            u.theme = "light"
            u.date_format = "YYYY-MM-DD"
            u.time_format = "12h"
            u.table_page_size = 15

        # AGENT
        if "agent.john@apex.com" in users:
            u = users["agent.john@apex.com"]
            u.job_title = "Senior Technical Support Specialist"
            u.user_type = "EMPLOYEE"
            u.location = "Apex Austin Tech Center"
            u.external_id = "EMP-3088"
            u.phone = "+1 (555) 456-7890"
            u.timezone = "America/Chicago"
            u.preferred_language = "en"
            u.bio = "Specializing in network diagnostics, endpoint security, and local RAG copilot resolutions."
            u.skills = ["Network Infrastructure", "Active Directory", "Hardware Diagnostics", "Cloud Services"]
            u.theme = "light"
            u.date_format = "YYYY-MM-DD"
            u.time_format = "12h"
            u.table_page_size = 10

        # EMPLOYEE (REQUESTER)
        if "user.alice@apex.com" in users:
            u = users["user.alice@apex.com"]
            u.job_title = "Senior Financial Analyst"
            u.user_type = "EMPLOYEE"
            u.location = "Apex Finance Wing, Chicago"
            u.external_id = "EMP-4102"
            u.reporting_manager = "David Vance (VP Finance)"
            u.phone = "+1 (555) 567-8901"
            u.timezone = "America/Chicago"
            u.preferred_language = "en"
            u.bio = "Corporate finance analyst submitting requests for ERP systems and secure payment gateways."
            u.communication_preference = "email"
            u.theme = "light"
            u.date_format = "MM/DD/YYYY"
            u.time_format = "12h"
            u.table_page_size = 10

        # STUDENT (REQUESTER)
        if "student.emma@greenwood.edu" in users:
            u = users["student.emma@greenwood.edu"]
            u.job_title = "Undergraduate Student"
            u.user_type = "STUDENT"
            u.location = "North Campus Residence Hall B"
            u.external_id = "STU-2024-0891"
            u.course = "B.Tech Computer Science & Engineering"
            u.academic_year = "3rd Year (Class of 2026)"
            u.phone = "+1 (555) 678-9012"
            u.timezone = "America/New_York"
            u.preferred_language = "en"
            u.bio = "Computer Science student utilizing Greenwood campus labs, LMS services, and campus Wi-Fi network."
            u.communication_preference = "in_app"
            u.theme = "light"
            u.date_format = "DD/MM/YYYY"
            u.time_format = "12h"
            u.table_page_size = 10

        db.commit()
        logger.info("Successfully updated initial profile fields for all demo accounts.")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_and_seed_profiles()
