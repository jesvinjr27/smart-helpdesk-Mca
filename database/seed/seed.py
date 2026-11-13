import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure backend root is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.db.session import engine, SessionLocal, Base
from backend.app.core.security import get_password_hash
from backend.app.models.all_models import (
    Organization,
    Department,
    Team,
    TeamMember,
    Role,
    User,
    UserRole,
    Category,
    SLAPolicy,
    Ticket,
    TicketAssignment,
    TicketComment,
    TicketEvent,
    SLATracking,
    KnowledgeArticle,
    KnowledgeChunk,
    AIPrediction,
    SLARiskPrediction,
    AuditLog,
    generate_uuid,
    utc_now,
)


def seed_database():
    print("Creating tables if not present...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        existing_org = db.query(Organization).first()
        if existing_org:
            print("Database already contains data. Skipping re-seed.")
            return

        print("Seeding Roles...")
        roles_data = [
            ("SYS_ADMIN", "Global System Administrator with full cross-tenant control", ["*"]),
            ("ORG_ADMIN", "Organization Administrator managing org entities and users", ["org:manage", "user:manage", "ticket:*", "sla:manage", "kb:manage"]),
            ("LEAD", "Department Manager / Team Lead assigning tickets and monitoring SLAs", ["ticket:*", "team:manage", "sla:view", "kb:manage", "reports:view"]),
            ("AGENT", "Support Agent resolving assigned tickets and utilizing AI Copilot", ["ticket:view", "ticket:update", "ticket:comment", "kb:view", "kb:create"]),
            ("REQUESTER", "End-user / Student submitting and tracking own tickets", ["ticket:create", "ticket:view_own", "ticket:comment_own", "kb:view_public"]),
        ]
        roles_map = {}
        for name, desc, perms in roles_data:
            role = Role(name=name, description=desc, permissions=perms)
            db.add(role)
            roles_map[name] = role
        db.flush()

        print("Seeding Organizations...")
        org_apex = Organization(
            name="Apex Enterprises Global",
            code="APEX",
            domain="apex.com",
            is_active=True
        )
        org_greenwood = Organization(
            name="Greenwood Institute of Technology",
            code="GIT",
            domain="greenwood.edu",
            is_active=True
        )
        db.add_all([org_apex, org_greenwood])
        db.flush()

        # Seed Departments
        print("Seeding Departments & Teams...")
        dept_apex_it = Department(org_id=org_apex.id, name="Information Technology", code="IT", description="IT support, infrastructure & security")
        dept_apex_hr = Department(org_id=org_apex.id, name="Human Resources", code="HR", description="People operations and onboarding")
        dept_git_cit = Department(org_id=org_greenwood.id, name="Campus IT Services", code="CIT", description="Student and faculty technology support")
        dept_git_acad = Department(org_id=org_greenwood.id, name="Academic Affairs", code="ACAD", description="Courseware and examination portal support")
        db.add_all([dept_apex_it, dept_apex_hr, dept_git_cit, dept_git_acad])
        db.flush()

        # Seed Teams
        team_apex_l1 = Team(org_id=org_apex.id, department_id=dept_apex_it.id, name="L1 Service Desk", email="servicedesk@apex.com")
        team_apex_net = Team(org_id=org_apex.id, department_id=dept_apex_it.id, name="Network & Cloud Ops", email="netops@apex.com")
        team_git_help = Team(org_id=org_greenwood.id, department_id=dept_git_cit.id, name="Student IT Helpdesk", email="ithelp@greenwood.edu")
        team_git_lab = Team(org_id=org_greenwood.id, department_id=dept_git_cit.id, name="Computer Lab Support", email="labsupport@greenwood.edu")
        db.add_all([team_apex_l1, team_apex_net, team_git_help, team_git_lab])
        db.flush()

        # Seed Categories
        print("Seeding Categories...")
        categories_apex = [
            Category(org_id=org_apex.id, name="Hardware & Workstation", description="Laptops, monitors, docking stations, peripherals", default_priority="MEDIUM", default_department_id=dept_apex_it.id, default_team_id=team_apex_l1.id),
            Category(org_id=org_apex.id, name="Software & Applications", description="Office 365, IDEs, VPN client, ERP access", default_priority="MEDIUM", default_department_id=dept_apex_it.id, default_team_id=team_apex_l1.id),
            Category(org_id=org_apex.id, name="Network & VPN", description="Office Wi-Fi, GlobalProtect VPN, DNS resolution", default_priority="HIGH", default_department_id=dept_apex_it.id, default_team_id=team_apex_net.id),
            Category(org_id=org_apex.id, name="Access & Identity Management", description="Password resets, SSO, MFA tokens, permission changes", default_priority="HIGH", default_department_id=dept_apex_it.id, default_team_id=team_apex_l1.id),
            Category(org_id=org_apex.id, name="Human Resources & Benefits", description="Leave portal, insurance claims, onboarding documents", default_priority="LOW", default_department_id=dept_apex_hr.id),
        ]
        categories_git = [
            Category(org_id=org_greenwood.id, name="Campus Wi-Fi & Network", description="Hostel Wi-Fi, Eduroam login, MAC address registration", default_priority="HIGH", default_department_id=dept_git_cit.id, default_team_id=team_git_help.id),
            Category(org_id=org_greenwood.id, name="Lab & Workstation Hardware", description="Lab PCs, printers, projectors in lecture halls", default_priority="MEDIUM", default_department_id=dept_git_cit.id, default_team_id=team_git_lab.id),
            Category(org_id=org_greenwood.id, name="Student Portal & LMS", description="Canvas LMS, Moodle, student grade book, course registration", default_priority="HIGH", default_department_id=dept_git_acad.id, default_team_id=team_git_help.id),
            Category(org_id=org_greenwood.id, name="Library & Digital Resources", description="IEEE Xplore, research databases, digital catalog access", default_priority="LOW", default_department_id=dept_git_acad.id),
        ]
        db.add_all(categories_apex + categories_git)
        db.flush()

        # Seed SLA Policies
        print("Seeding SLA Policies...")
        sla_policies = [
            # Apex SLAs
            SLAPolicy(org_id=org_apex.id, name="Corporate Critical Incident SLA", priority="CRITICAL", response_time_hours=1.0, resolution_time_hours=4.0, business_hours_only=False),
            SLAPolicy(org_id=org_apex.id, name="Corporate High Priority SLA", priority="HIGH", response_time_hours=2.0, resolution_time_hours=8.0, business_hours_only=True),
            SLAPolicy(org_id=org_apex.id, name="Corporate Medium Priority SLA", priority="MEDIUM", response_time_hours=4.0, resolution_time_hours=24.0, business_hours_only=True),
            SLAPolicy(org_id=org_apex.id, name="Corporate Low Priority SLA", priority="LOW", response_time_hours=8.0, resolution_time_hours=48.0, business_hours_only=True),
            # Greenwood SLAs
            SLAPolicy(org_id=org_greenwood.id, name="Academic Urgent SLA", priority="CRITICAL", response_time_hours=1.0, resolution_time_hours=6.0, business_hours_only=False),
            SLAPolicy(org_id=org_greenwood.id, name="Academic Standard SLA", priority="MEDIUM", response_time_hours=6.0, resolution_time_hours=36.0, business_hours_only=True),
            SLAPolicy(org_id=org_greenwood.id, name="Academic Low Priority SLA", priority="LOW", response_time_hours=12.0, resolution_time_hours=72.0, business_hours_only=True),
        ]
        db.add_all(sla_policies)
        db.flush()

        # Seed Users
        print("Seeding Users across roles...")
        pw_hash = get_password_hash("Password123!")

        users_to_create = [
            # Global Sysadmin (associated with Apex for foreign key context)
            ("sysadmin@smarthelpdesk.local", "System Administrator", org_apex.id, dept_apex_it.id, "SYS_ADMIN", None, False),
            # Apex Users
            ("admin@apex.com", "Sarah Jenkins", org_apex.id, dept_apex_it.id, "ORG_ADMIN", None, False),
            ("lead.it@apex.com", "Marcus Vance", org_apex.id, dept_apex_it.id, "LEAD", team_apex_l1.id, True),
            ("agent.john@apex.com", "Johnathan Reed", org_apex.id, dept_apex_it.id, "AGENT", team_apex_l1.id, False),
            ("agent.sarah@apex.com", "Sarah Connor", org_apex.id, dept_apex_it.id, "AGENT", team_apex_net.id, False),
            ("user.alice@apex.com", "Alice Montgomery", org_apex.id, dept_apex_hr.id, "REQUESTER", None, False),
            ("user.bob@apex.com", "Bob Gallagher", org_apex.id, dept_apex_it.id, "REQUESTER", None, False),
            # Greenwood Users
            ("admin@greenwood.edu", "Dr. Robert Sterling", org_greenwood.id, dept_git_cit.id, "ORG_ADMIN", None, False),
            ("lead.cit@greenwood.edu", "Prof. Alan Turing", org_greenwood.id, dept_git_cit.id, "LEAD", team_git_help.id, True),
            ("agent.raj@greenwood.edu", "Rajesh Patel", org_greenwood.id, dept_git_cit.id, "AGENT", team_git_help.id, False),
            ("student.emma@greenwood.edu", "Emma Watson", org_greenwood.id, dept_git_acad.id, "REQUESTER", None, False),
            ("student.alex@greenwood.edu", "Alex Turner", org_greenwood.id, dept_git_acad.id, "REQUESTER", None, False),
        ]

        users_dict = {}
        for email, name, org_id, dept_id, role_name, team_id, is_lead in users_to_create:
            user = User(
                org_id=org_id,
                department_id=dept_id,
                email=email,
                hashed_password=pw_hash,
                full_name=name,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.flush()
            users_dict[email] = user

            # Add UserRole
            db.add(UserRole(user_id=user.id, role_id=roles_map[role_name].id))

            # Add Team membership if applicable
            if team_id:
                db.add(TeamMember(team_id=team_id, user_id=user.id, is_lead=is_lead))

        db.flush()

        # Seed Knowledge Base Articles
        print("Seeding Knowledge Base Articles...")
        kb_articles_data = [
            (
                org_apex.id,
                users_dict["admin@apex.com"].id,
                categories_apex[2].id,  # Network & VPN
                "Connecting to GlobalProtect Corporate VPN",
                """### Overview
This article provides step-by-step instructions for installing and authenticating with the Apex GlobalProtect VPN gateway.

### Prerequisites
1. Valid corporate credentials (user@apex.com)
2. Microsoft Authenticator push notification enabled on your smartphone
3. GlobalProtect client installed from the IT software portal

### Connection Procedure
1. Open GlobalProtect from your system tray or Applications folder.
2. In the Portal address field, type: **vpn.apex.com**
3. Click **Connect**.
4. A browser window will open for Single Sign-On. Enter your work email and password.
5. Approve the 2-Factor Authentication prompt on your mobile authenticator.
6. Once connected, the shield icon will display a green checkmark indicating active encryption.

### Troubleshooting
- **Error: Gateway not reachable**: Check if your home Wi-Fi is blocking port 443 or UDP 4501. Try switching to a mobile hotspot to isolate network issues.
- **Certificate untrusted**: Run the Corporate Root CA installer located at `https://it.apex.com/certs`.
- **Session Timeout**: VPN sessions automatically expire after 12 hours of inactivity. Simply disconnect and reconnect.""",
                "Step-by-step guide to installing, configuring, and troubleshooting the corporate GlobalProtect VPN connection.",
                ["vpn", "network", "remote-work", "security", "globalprotect"]
            ),
            (
                org_apex.id,
                users_dict["lead.it@apex.com"].id,
                categories_apex[3].id,  # Access & Identity
                "Self-Service Password Reset (SSPR) and MFA Setup",
                """### Self-Service Password Reset Guide
All Apex employees can reset forgotten passwords or update expiring passwords without contacting the Help Desk.

### Steps to Reset Password
1. Navigate to `https://passwordreset.apex.com`.
2. Enter your employee email address and complete the captcha verification.
3. Choose your verification method:
   - SMS One-Time Passcode (OTP)
   - Microsoft Authenticator code
   - Verified security questions
4. Enter the verification code received.
5. Type your new password adhering to the complexity rules:
   - Minimum 12 characters
   - At least 1 uppercase letter
   - At least 1 number and 1 special symbol (!@#$%^&*)
   - Cannot match your previous 5 passwords

### Account Lockout Policy
Accounts automatically lock for 30 minutes after 5 consecutive failed attempts. If locked, you can wait 30 minutes or submit an urgent request to the L1 Service Desk.""",
                "Instructions on using the self-service portal to reset passwords and configure multi-factor authentication.",
                ["password", "mfa", "sspr", "account", "login", "security"]
            ),
            (
                org_greenwood.id,
                users_dict["admin@greenwood.edu"].id,
                categories_git[0].id,  # Campus Wi-Fi
                "Connecting to Greenwood Campus Wi-Fi (Eduroam & GIT-Student)",
                """### Student & Faculty Wi-Fi Access
Greenwood Institute provides high-speed wireless network coverage across all academic blocks, hostels, and libraries.

### Wi-Fi SSIDs
1. **Eduroam**: Recommended for all laptops and smartphones. Works globally across participating universities.
   - Username: `studentID@greenwood.edu`
   - Password: Your campus portal password
   - EAP Method: PEAP
   - Phase 2 Authentication: MSCHAPv2
   - CA Certificate: Use system certificates or select 'Do not validate'

2. **GIT-Student**: Secondary portal for devices that do not support 802.1x enterprise authentication (gaming consoles, smart TVs).
   - Requires MAC address registration at `https://wifi.greenwood.edu/register`.

### Network Support
If you cannot obtain an IP address in the hostel, reset your network adapter or flush DNS via `ipconfig /flushdns` in the command prompt.""",
                "Configuration settings for connecting devices to Eduroam and GIT-Student campus wireless networks.",
                ["wifi", "eduroam", "network", "hostel", "internet", "campus"]
            ),
            (
                org_greenwood.id,
                users_dict["lead.cit@greenwood.edu"].id,
                categories_git[2].id,  # LMS
                "Resolving Canvas LMS Course Enrollment and Submission Issues",
                """### Canvas LMS Student Troubleshooting
This guide covers common issues with Canvas LMS course visibility and assignment submissions.

### Missing Courses on Dashboard
1. Log in to Canvas at `https://lms.greenwood.edu`.
2. Click **Courses** on the left navigation bar, then select **All Courses**.
3. Locate the course and click the star icon to add it to your main dashboard.
4. If the course is missing entirely, check if you have officially registered for the subject on the Registrar Portal. Course sync runs daily at 02:00 AM and 02:00 PM.

### File Submission Errors
- Supported formats: PDF, DOCX, ZIP (under 50MB).
- Ensure your filename contains no special characters or trailing spaces.
- Clear browser cache or submit in an incognito window if the submission spinner hangs.""",
                "Common fixes for course enrollment visibility and assignment submission errors in Canvas LMS.",
                ["canvas", "lms", "courses", "academics", "assignments", "grades"]
            )
        ]

        kb_articles = []
        for org_id, author_id, cat_id, title, content, summary, tags in kb_articles_data:
            art = KnowledgeArticle(
                org_id=org_id,
                author_id=author_id,
                category_id=cat_id,
                title=title,
                content=content,
                summary=summary,
                visibility="PUBLIC",
                status="APPROVED",
                tags=tags,
                view_count=15,
                is_active=True
            )
            db.add(art)
            kb_articles.append(art)
        db.flush()

        # Seed Tickets with Events and Comments
        print("Seeding Initial Tickets...")
        now = utc_now()

        # Ticket 1: VPN Issue (Apex)
        t1 = Ticket(
            org_id=org_apex.id,
            ticket_number="APEX-TK-1001",
            title="GlobalProtect VPN connection failed with error code 403",
            description="Since this morning I cannot connect to the corporate VPN from home. GlobalProtect gives error code 403 forbidden and disconnects immediately after MFA prompt.",
            category_id=categories_apex[2].id,  # Network & VPN
            priority="HIGH",
            status="IN_PROGRESS",
            requester_id=users_dict["user.alice@apex.com"].id,
            assigned_to_id=users_dict["agent.sarah@apex.com"].id,
            assigned_team_id=team_apex_net.id,
            department_id=dept_apex_it.id,
            response_due_at=now + timedelta(hours=2),
            resolution_due_at=now + timedelta(hours=8),
            first_responded_at=now - timedelta(hours=1),
            tags=["vpn", "network", "remote-work"]
        )
        db.add(t1)
        db.flush()

        # Add Comments for Ticket 1
        c1 = TicketComment(
            ticket_id=t1.id,
            author_id=users_dict["agent.sarah@apex.com"].id,
            content="Hello Alice, I have inspected your AD account. It looks like your remote access security group was desynchronized. I have re-added you to the GlobalProtect-Users group. Please restart your client and try again.",
            is_internal=False
        )
        c2 = TicketComment(
            ticket_id=t1.id,
            author_id=users_dict["agent.sarah@apex.com"].id,
            content="Internal Note: Checked firewall logs. Session dropped due to missing group claim in SAML assertion.",
            is_internal=True
        )
        db.add_all([c1, c2])

        # Add Events for Ticket 1
        e1 = TicketEvent(ticket_id=t1.id, actor_id=users_dict["user.alice@apex.com"].id, event_type="CREATED", new_value="NEW", details={"priority": "HIGH"})
        e2 = TicketEvent(ticket_id=t1.id, actor_id=users_dict["lead.it@apex.com"].id, event_type="ASSIGNED", new_value=users_dict["agent.sarah@apex.com"].full_name, details={"team": "Network & Cloud Ops"})
        e3 = TicketEvent(ticket_id=t1.id, actor_id=users_dict["agent.sarah@apex.com"].id, event_type="STATUS_CHANGED", old_value="NEW", new_value="IN_PROGRESS")
        db.add_all([e1, e2, e3])

        # SLA Tracking for Ticket 1
        sla1 = SLATracking(
            ticket_id=t1.id,
            policy_id=sla_policies[1].id,
            response_deadline=t1.response_due_at,
            resolution_deadline=t1.resolution_due_at,
            is_response_breached=False,
            is_resolution_breached=False
        )
        db.add(sla1)

        # AI Prediction for Ticket 1
        p1 = AIPrediction(
            ticket_id=t1.id,
            model_name="SmartHelpdesk-TFIDF-Classifier",
            model_version="v1.0.0",
            predicted_category_id=categories_apex[2].id,
            predicted_priority="HIGH",
            confidence_scores={"Network & VPN": 0.89, "Access & Identity Management": 0.08, "Software & Applications": 0.03},
            rationale="Identified keywords: 'GlobalProtect', 'VPN', 'connect', 'error code 403', 'MFA prompt'. High correlation with Network & VPN.",
            execution_time_ms=14.2
        )
        db.add(p1)

        # SLA Risk Prediction for Ticket 1
        r1 = SLARiskPrediction(
            ticket_id=t1.id,
            model_name="SLARiskPredictor-v1",
            risk_score=0.22,
            risk_level="LOW",
            risk_factors=["Assigned quickly within 15 minutes", "Agent currently has low workload queue"],
            suggested_mitigation="Standard resolution expected within 4 hours."
        )
        db.add(r1)

        # Ticket 2: Laptop Display Flickering (Apex)
        t2 = Ticket(
            org_id=org_apex.id,
            ticket_number="APEX-TK-1002",
            title="Dell XPS laptop screen flickering and shutting down unexpectedly",
            description="My work laptop screen starts flickering violently whenever I plug in the dual external monitors. After 10 minutes the laptop overheats and reboots automatically.",
            category_id=categories_apex[0].id,  # Hardware
            priority="MEDIUM",
            status="NEW",
            requester_id=users_dict["user.bob@apex.com"].id,
            assigned_team_id=team_apex_l1.id,
            department_id=dept_apex_it.id,
            response_due_at=now + timedelta(hours=4),
            resolution_due_at=now + timedelta(hours=24),
            tags=["hardware", "laptop", "monitor", "crash"]
        )
        db.add(t2)
        db.flush()

        e4 = TicketEvent(ticket_id=t2.id, actor_id=users_dict["user.bob@apex.com"].id, event_type="CREATED", new_value="NEW", details={"priority": "MEDIUM"})
        sla2 = SLATracking(ticket_id=t2.id, policy_id=sla_policies[2].id, response_deadline=t2.response_due_at, resolution_deadline=t2.resolution_due_at)
        p2 = AIPrediction(
            ticket_id=t2.id,
            model_name="SmartHelpdesk-TFIDF-Classifier",
            model_version="v1.0.0",
            predicted_category_id=categories_apex[0].id,
            predicted_priority="MEDIUM",
            confidence_scores={"Hardware & Workstation": 0.94, "Software & Applications": 0.04, "Network & VPN": 0.02},
            rationale="High frequency hardware tokens: 'laptop', 'screen flickering', 'monitors', 'overheats'.",
            execution_time_ms=11.5
        )
        db.add_all([e4, sla2, p2])

        # Ticket 3: Campus Wi-Fi Not Connecting (Greenwood)
        t3 = Ticket(
            org_id=org_greenwood.id,
            ticket_number="GIT-TK-1001",
            title="Unable to connect to Eduroam Wi-Fi in Hostel Block 3",
            description="Since yesterday evening, all students in Hostel Block 3 2nd floor are unable to authenticate to Eduroam. It prompts 'Authentication failed' repeatedly.",
            category_id=categories_git[0].id,  # Wi-Fi
            priority="HIGH",
            status="ASSIGNED",
            requester_id=users_dict["student.emma@greenwood.edu"].id,
            assigned_to_id=users_dict["agent.raj@greenwood.edu"].id,
            assigned_team_id=team_git_help.id,
            department_id=dept_git_cit.id,
            response_due_at=now + timedelta(hours=6),
            resolution_due_at=now + timedelta(hours=36),
            tags=["wifi", "eduroam", "hostel", "access-point"]
        )
        db.add(t3)
        db.flush()

        e5 = TicketEvent(ticket_id=t3.id, actor_id=users_dict["student.emma@greenwood.edu"].id, event_type="CREATED", new_value="NEW", details={"priority": "HIGH"})
        e6 = TicketEvent(ticket_id=t3.id, actor_id=users_dict["lead.cit@greenwood.edu"].id, event_type="ASSIGNED", new_value=users_dict["agent.raj@greenwood.edu"].full_name)
        sla3 = SLATracking(ticket_id=t3.id, policy_id=sla_policies[5].id, response_deadline=t3.response_due_at, resolution_deadline=t3.resolution_due_at)
        p3 = AIPrediction(
            ticket_id=t3.id,
            model_name="SmartHelpdesk-TFIDF-Classifier",
            model_version="v1.0.0",
            predicted_category_id=categories_git[0].id,
            predicted_priority="HIGH",
            confidence_scores={"Campus Wi-Fi & Network": 0.96, "Student Portal & LMS": 0.03, "Lab Hardware": 0.01},
            rationale="Detected Wi-Fi failure across multiple users: 'Eduroam', 'Hostel', 'Authentication failed'.",
            execution_time_ms=12.1
        )
        db.add_all([e5, e6, sla3, p3])

        # Commit everything
        db.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
