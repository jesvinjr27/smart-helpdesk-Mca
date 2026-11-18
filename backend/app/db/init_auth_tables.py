import sys
import sqlite3
from backend.app.db.session import engine, Base
from backend.app.models import User, Role, UserRole, UserIdentity, PasswordResetToken, RefreshToken

def init_auth_tables():
    print("Creating new tables with Base.metadata.create_all...")
    Base.metadata.create_all(bind=engine)
    print("Base.metadata.create_all completed!")

    # For SQLite, check if any columns need to be added to existing tables
    with engine.connect() as conn:
        # 1. users table
        cursor = conn.connection.cursor()
        cursor.execute("PRAGMA table_info(users)")
        user_cols = [r[1] for r in cursor.fetchall()]
        if "account_status" not in user_cols:
            print("Adding account_status to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN account_status VARCHAR(50) DEFAULT 'ACTIVE'")
            cursor.execute("UPDATE users SET account_status = 'ACTIVE' WHERE account_status IS NULL")
            conn.connection.commit()

        # 2. user_roles table
        cursor.execute("PRAGMA table_info(user_roles)")
        ur_cols = [r[1] for r in cursor.fetchall()]
        if "organization_id" not in ur_cols:
            print("Adding organization_id to user_roles table...")
            cursor.execute("ALTER TABLE user_roles ADD COLUMN organization_id VARCHAR(36)")
            # populate organization_id from user's current org_id
            cursor.execute("""
                UPDATE user_roles
                SET organization_id = (SELECT org_id FROM users WHERE users.id = user_roles.user_id)
                WHERE organization_id IS NULL
            """)
            conn.connection.commit()

        # 3. refresh_tokens table
        cursor.execute("PRAGMA table_info(refresh_tokens)")
        rt_cols = [r[1] for r in cursor.fetchall()]
        if "token_hash" not in rt_cols:
            print("Adding token_hash to refresh_tokens table...")
            cursor.execute("ALTER TABLE refresh_tokens ADD COLUMN token_hash VARCHAR(255)")
            conn.connection.commit()
        if "revoked_at" not in rt_cols:
            print("Adding revoked_at to refresh_tokens table...")
            cursor.execute("ALTER TABLE refresh_tokens ADD COLUMN revoked_at DATETIME")
            conn.connection.commit()

    print("Database schema migration verified successfully!")


if __name__ == "__main__":
    init_auth_tables()
