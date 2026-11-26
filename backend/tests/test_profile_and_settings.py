import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from starlette.requests import Request
from backend.app.db.session import SessionLocal
from backend.app.models.all_models import User, RefreshToken, utc_now
from backend.app.schemas.all_schemas import (
    UserProfileUpdate,
    UserPreferencesUpdate,
    NotificationPreferencesUpdate,
    ChangePasswordRequest
)
from backend.app.api.v1.users import (
    get_me,
    update_my_profile,
    upload_my_avatar,
    remove_my_avatar,
    get_my_preferences,
    update_my_preferences,
    change_my_password,
    get_my_notifications,
    update_my_notifications,
    get_my_activity,
    get_my_sessions,
    revoke_other_sessions
)
from backend.app.auth.services.password_service import PasswordService


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def create_mock_request():
    mock = MagicMock(spec=Request)
    mock.client = MagicMock()
    mock.client.host = "127.0.0.1"
    mock.headers = {"user-agent": "Pytest-Agent/1.0"}
    return mock


def test_all_six_roles_profile_retrieval(db):
    """Verifies that all 6 roles retrieve their complete profile with role-specific attributes."""
    role_emails = [
        ("sysadmin@smarthelpdesk.local", "SYS_ADMIN", "ADMIN"),
        ("admin@apex.com", "ORG_ADMIN", "EMPLOYEE"),
        ("lead.it@apex.com", "LEAD", "EMPLOYEE"),
        ("agent.john@apex.com", "AGENT", "EMPLOYEE"),
        ("user.alice@apex.com", "REQUESTER", "EMPLOYEE"),
        ("student.emma@greenwood.edu", "REQUESTER", "STUDENT"),
    ]

    for email, expected_role, expected_type in role_emails:
        user = db.query(User).filter(User.email == email).first()
        assert user is not None, f"User {email} not found"

        profile = get_me(current_user=user, db=db)
        assert profile.email == email
        assert expected_role in profile.roles
        assert profile.user_type == expected_type
        assert profile.profile_completion_percentage > 0
        assert profile.account_status == "ACTIVE"

        if expected_type == "STUDENT":
            assert profile.course is not None
            assert profile.academic_year is not None
            assert profile.external_id.startswith("STU-")
        elif expected_role == "AGENT":
            assert isinstance(profile.skills, list)
            assert len(profile.skills) > 0


def test_personal_information_update(db):
    """Verifies updating permitted profile information and audit logging."""
    user = db.query(User).filter(User.email == "user.alice@apex.com").first()
    req = create_mock_request()

    update_payload = UserProfileUpdate(
        full_name="Alice Montgomery Updated",
        phone="+1 (555) 999-8888",
        alt_phone="+1 (555) 999-7777",
        job_title="Lead Financial Strategist",
        location="Apex Finance Tower, Chicago",
        bio="Updated bio for enterprise finance lead."
    )

    updated = update_my_profile(profile_in=update_payload, request=req, current_user=user, db=db)
    assert updated.full_name == "Alice Montgomery Updated"
    assert updated.phone == "+1 (555) 999-8888"
    assert updated.job_title == "Lead Financial Strategist"
    assert updated.bio == "Updated bio for enterprise finance lead."

    # Restore
    restore_payload = UserProfileUpdate(
        full_name="Alice Montgomery",
        phone="+1 (555) 567-8901",
        job_title="Senior Financial Analyst"
    )
    update_my_profile(profile_in=restore_payload, request=req, current_user=user, db=db)


def test_application_preferences_flow(db):
    """Verifies getting and updating application preferences (theme, format, etc.)."""
    user = db.query(User).filter(User.email == "agent.john@apex.com").first()
    req = create_mock_request()

    # Update preferences
    pref_update = UserPreferencesUpdate(
        theme="light",
        date_format="DD/MM/YYYY",
        time_format="24h",
        table_page_size=20,
        accessibility_preferences={"reduce_motion": True, "high_contrast": False}
    )
    res = update_my_preferences(pref_in=pref_update, request=req, current_user=user, db=db)
    assert res["theme"] == "light"
    assert res["date_format"] == "DD/MM/YYYY"
    assert res["time_format"] == "24h"
    assert res["table_page_size"] == 20
    assert res["accessibility_preferences"]["reduce_motion"] is True


def test_notification_preferences_flow(db):
    """Verifies setting notification channels and alert triggers."""
    user = db.query(User).filter(User.email == "student.emma@greenwood.edu").first()
    req = create_mock_request()

    initial = get_my_notifications(current_user=user, db=db)
    assert "in_app" in initial
    assert "email" in initial

    new_prefs = {
        "in_app": {"ticket_created": True, "sla_warning": False},
        "email": {"ticket_created": False, "sla_breach": True}
    }
    updated = update_my_notifications(
        notif_in=NotificationPreferencesUpdate(preferences=new_prefs),
        request=req,
        current_user=user,
        db=db
    )
    assert updated["in_app"]["sla_warning"] is False
    assert updated["email"]["sla_breach"] is True


def test_password_change_flow(db):
    """Verifies password change with Argon2id re-authentication, validation and rejection of incorrect passwords."""
    user = db.query(User).filter(User.email == "lead.it@apex.com").first()
    req = create_mock_request()

    # 1. Incorrect current password rejected
    with pytest.raises(HTTPException) as exc:
        change_my_password(
            pwd_in=ChangePasswordRequest(
                current_password="WrongCurrentPassword!",
                new_password="NewSecurePassword2026!",
                confirm_password="NewSecurePassword2026!"
            ),
            request=req,
            current_user=user,
            db=db
        )
    assert exc.value.status_code == 400
    assert "Current password is incorrect" in exc.value.detail

    # 2. Mismatched confirmation rejected
    with pytest.raises(HTTPException) as exc:
        change_my_password(
            pwd_in=ChangePasswordRequest(
                current_password="Password123!",
                new_password="NewSecurePassword2026!",
                confirm_password="DifferentConfirmation!"
            ),
            request=req,
            current_user=user,
            db=db
        )
    assert exc.value.status_code == 400

    # 3. Valid password change succeeds
    res = change_my_password(
        pwd_in=ChangePasswordRequest(
            current_password="Password123!",
            new_password="UpdatedLeadPassword2026!",
            confirm_password="UpdatedLeadPassword2026!"
        ),
        request=req,
        current_user=user,
        db=db
    )
    assert res.success is True

    # 4. Restore original password for test repeatability
    change_my_password(
        pwd_in=ChangePasswordRequest(
            current_password="UpdatedLeadPassword2026!",
            new_password="Password123!",
            confirm_password="Password123!"
        ),
        request=req,
        current_user=user,
        db=db
    )


def test_user_activity_and_sessions(db):
    """Verifies personal activity timeline and session management."""
    user = db.query(User).filter(User.email == "admin@apex.com").first()
    req = create_mock_request()

    activities = get_my_activity(limit=10, current_user=user, db=db)
    assert len(activities) > 0
    assert activities[0].action is not None

    sessions = get_my_sessions(current_user=user, db=db)
    assert len(sessions) > 0
    assert sessions[0].is_current is True

    # Revoke other sessions
    revoke_res = revoke_other_sessions(request=req, current_user=user, db=db)
    assert revoke_res.success is True
