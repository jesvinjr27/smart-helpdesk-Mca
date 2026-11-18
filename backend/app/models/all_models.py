import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Float,
    Text,
    JSON,
    Enum as SQLEnum,
    Index,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True, index=True)
    domain = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    departments = relationship("Department", back_populates="organization", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="organization", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="organization", cascade="all, delete-orphan")
    sla_policies = relationship("SLAPolicy", back_populates="organization", cascade="all, delete-orphan")
    knowledge_articles = relationship("KnowledgeArticle", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("org_id", "code", name="uq_org_department_code"),
    )

    # Relationships
    organization = relationship("Organization", back_populates="departments")
    teams = relationship("Team", back_populates="department", cascade="all, delete-orphan")
    users = relationship("User", back_populates="department")
    tickets = relationship("Ticket", back_populates="department")


class Team(Base):
    __tablename__ = "teams"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="teams")
    department = relationship("Department", back_populates="teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="assigned_team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_lead = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_user"),
    )

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), nullable=False, unique=True, index=True)  # REQUESTER, AGENT, LEAD, ORG_ADMIN, SYS_ADMIN
    description = Column(String(255), nullable=True)
    permissions = Column(JSON, nullable=True)  # list of permission strings

    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    account_status = Column(String(50), default="ACTIVE", nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    @property
    def password_hash(self) -> str:
        return self.hashed_password

    @password_hash.setter
    def password_hash(self, value: str):
        self.hashed_password = value

    __table_args__ = (
        UniqueConstraint("org_id", "email", name="uq_org_user_email"),
    )

    # Relationships
    organization = relationship("Organization", back_populates="users")
    department = relationship("Department", back_populates="users")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    identities = relationship("UserIdentity", back_populates="user", cascade="all, delete-orphan")
    created_tickets = relationship("Ticket", back_populates="requester", foreign_keys="Ticket.requester_id")
    assigned_tickets = relationship("Ticket", back_populates="assignee", foreign_keys="Ticket.assigned_to_id")
    comments = relationship("TicketComment", back_populates="author")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="uq_user_role"),
    )

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")


class UserIdentity(Base):
    __tablename__ = "user_identities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # e.g., 'microsoft'
    provider_tenant_id = Column(String(255), nullable=True)
    provider_object_id = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("provider", "provider_object_id", name="uq_provider_object_id"),
    )

    user = relationship("User", back_populates="identities")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="password_reset_tokens")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(500), nullable=True, index=True)
    token_hash = Column(String(255), nullable=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")


class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    default_priority = Column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    default_department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    default_team_id = Column(String(36), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("org_id", "name", name="uq_org_category_name"),
    )

    organization = relationship("Organization", back_populates="categories")
    tickets = relationship("Ticket", back_populates="category")
    articles = relationship("KnowledgeArticle", back_populates="category")


class SLAPolicy(Base):
    __tablename__ = "sla_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    response_time_hours = Column(Float, nullable=False)
    resolution_time_hours = Column(Float, nullable=False)
    business_hours_only = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("org_id", "priority", name="uq_org_sla_priority"),
    )

    organization = relationship("Organization", back_populates="sla_policies")
    trackings = relationship("SLATracking", back_populates="policy")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_number = Column(String(50), nullable=False, index=True)  # e.g., TECH-1001
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    priority = Column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="NEW", nullable=False, index=True)  # NEW, ASSIGNED, IN_PROGRESS, PENDING_CUSTOMER, RESOLVED, CLOSED, REOPENED
    
    requester_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_to_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_team_id = Column(String(36), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)

    response_due_at = Column(DateTime, nullable=True)
    resolution_due_at = Column(DateTime, nullable=True)
    first_responded_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    tags = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("org_id", "ticket_number", name="uq_org_ticket_number"),
        Index("idx_ticket_org_status", "org_id", "status"),
        Index("idx_ticket_org_priority", "org_id", "priority"),
    )

    # Relationships
    organization = relationship("Organization", back_populates="tickets")
    category = relationship("Category", back_populates="tickets")
    requester = relationship("User", foreign_keys=[requester_id], back_populates="created_tickets")
    assignee = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_tickets")
    assigned_team = relationship("Team", back_populates="tickets")
    department = relationship("Department", back_populates="tickets")
    
    assignments = relationship("TicketAssignment", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketAssignment.created_at.desc()")
    comments = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketComment.created_at.asc()")
    attachments = relationship("TicketAttachment", back_populates="ticket", cascade="all, delete-orphan")
    events = relationship("TicketEvent", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketEvent.created_at.asc()")
    sla_tracking = relationship("SLATracking", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    ai_predictions = relationship("AIPrediction", back_populates="ticket", cascade="all, delete-orphan", order_by="AIPrediction.created_at.desc()")
    sla_risk_predictions = relationship("SLARiskPrediction", back_populates="ticket", cascade="all, delete-orphan", order_by="SLARiskPrediction.created_at.desc()")
    ai_feedbacks = relationship("AIFeedback", back_populates="ticket", cascade="all, delete-orphan")


class TicketAssignment(Base):
    __tablename__ = "ticket_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    previous_assignee_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    new_assignee_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    previous_team_id = Column(String(36), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    new_team_id = Column(String(36), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    ticket = relationship("Ticket", back_populates="assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    previous_assignee = relationship("User", foreign_keys=[previous_assignee_id])
    new_assignee = relationship("User", foreign_keys=[new_assignee_id])


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)  # True = internal agent note
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User", back_populates="comments")
    attachments = relationship("TicketAttachment", back_populates="comment")


class TicketAttachment(Base):
    __tablename__ = "ticket_attachments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    comment_id = Column(String(36), ForeignKey("ticket_comments.id", ondelete="SET NULL"), nullable=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String(100), nullable=True)
    uploaded_by_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    ticket = relationship("Ticket", back_populates="attachments")
    comment = relationship("TicketComment", back_populates="attachments")
    uploader = relationship("User")


class TicketEvent(Base):
    __tablename__ = "ticket_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False)  # CREATED, STATUS_CHANGED, ASSIGNED, COMMENT_ADDED, PRIORITY_CHANGED, SLA_BREACHED, AI_ANALYZED
    old_value = Column(String(255), nullable=True)
    new_value = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    ticket = relationship("Ticket", back_populates="events")
    actor = relationship("User")


class SLATracking(Base):
    __tablename__ = "sla_trackings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    policy_id = Column(String(36), ForeignKey("sla_policies.id", ondelete="SET NULL"), nullable=True)
    response_deadline = Column(DateTime, nullable=True)
    resolution_deadline = Column(DateTime, nullable=True)
    is_response_breached = Column(Boolean, default=False, nullable=False)
    is_resolution_breached = Column(Boolean, default=False, nullable=False)
    response_breach_minutes = Column(Integer, default=0, nullable=False)
    resolution_breach_minutes = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    ticket = relationship("Ticket", back_populates="sla_tracking")
    policy = relationship("SLAPolicy", back_populates="trackings")


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    visibility = Column(String(30), default="PUBLIC", nullable=False)  # PUBLIC, INTERNAL, RESTRICTED
    status = Column(String(30), default="APPROVED", nullable=False, index=True)  # DRAFT, APPROVED, ARCHIVED
    tags = Column(JSON, default=list, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="knowledge_articles")
    author = relationship("User")
    category = relationship("Category", back_populates="articles")
    chunks = relationship("KnowledgeChunk", back_populates="article", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    article_id = Column(String(36), ForeignKey("knowledge_articles.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)
    vector_id = Column(Integer, nullable=True, index=True)  # maps to FAISS vector index
    created_at = Column(DateTime, default=utc_now, nullable=False)

    article = relationship("KnowledgeArticle", back_populates="chunks")


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    predicted_category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    predicted_priority = Column(String(20), nullable=True)
    confidence_scores = Column(JSON, nullable=True)
    rationale = Column(Text, nullable=True)
    execution_time_ms = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    ticket = relationship("Ticket", back_populates="ai_predictions")
    predicted_category = relationship("Category")
    feedbacks = relationship("AIFeedback", back_populates="prediction", cascade="all, delete-orphan")


class SLARiskPrediction(Base):
    __tablename__ = "sla_risk_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    risk_score = Column(Float, nullable=False)  # 0.0 - 1.0
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    risk_factors = Column(JSON, nullable=True)
    suggested_mitigation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    ticket = relationship("Ticket", back_populates="sla_risk_predictions")


class AIFeedback(Base):
    __tablename__ = "ai_feedbacks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(String(36), ForeignKey("ai_predictions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    is_category_accepted = Column(Boolean, nullable=True)
    corrected_category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    is_priority_accepted = Column(Boolean, nullable=True)
    corrected_priority = Column(String(20), nullable=True)
    feedback_notes = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)  # 1 to 5
    created_at = Column(DateTime, default=utc_now, nullable=False)

    ticket = relationship("Ticket", back_populates="ai_feedbacks")
    prediction = relationship("AIPrediction", back_populates="feedbacks")
    user = relationship("User")
    corrected_category = relationship("Category")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    notification_type = Column(String(50), default="INFO", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="notifications")
    organization = relationship("Organization")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    organization = relationship("Organization", back_populates="audit_logs")
    actor = relationship("User")
