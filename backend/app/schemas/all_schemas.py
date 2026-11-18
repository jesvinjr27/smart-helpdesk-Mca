from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, EmailStr, Field

try:
    import email_validator
    email_validator.TEST_ENVIRONMENT = True
    email_validator.SPECIAL_USE_DOMAIN_NAMES = [
        d for d in email_validator.SPECIAL_USE_DOMAIN_NAMES if d not in ("local", "localhost")
    ]
except ImportError:
    pass


# ==========================================
# Common & Pagination Schemas
# ==========================================
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
    success: bool = True


# ==========================================
# Auth & Token Schemas
# ==========================================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    org_id: Optional[str] = None
    remember_me: Optional[bool] = False


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class MicrosoftConfigResponse(BaseModel):
    enabled: bool
    tenant_id: Optional[str] = None
    client_id: Optional[str] = None
    redirect_uri: Optional[str] = None


class MicrosoftExchangeRequest(BaseModel):
    code: Optional[str] = None
    id_token: Optional[str] = None
    access_token: Optional[str] = None


class WorkspaceOption(BaseModel):
    organization_id: str
    organization_name: str
    organization_code: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserMeResponse"
    workspaces: Optional[List[WorkspaceOption]] = []


# ==========================================
# Role & User Schemas
# ==========================================
class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permissions: Optional[List[str]] = []

    model_config = {"from_attributes": True}


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    org_id: str
    department_id: Optional[str] = None
    role_names: List[str] = ["REQUESTER"]


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department_id: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: str
    org_id: str
    department_id: Optional[str] = None
    is_verified: bool
    created_at: datetime
    roles: List[str] = []

    model_config = {"from_attributes": True}


class UserMeResponse(UserResponse):
    org_name: Optional[str] = None
    department_name: Optional[str] = None
    account_status: Optional[str] = "ACTIVE"
    teams: List[str] = []
    workspaces: List[WorkspaceOption] = []


TokenResponse.model_rebuild()


# ==========================================
# Organization & Department & Team Schemas
# ==========================================
class OrganizationBase(BaseModel):
    name: str
    code: str
    domain: Optional[str] = None
    is_active: bool = True


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationResponse(OrganizationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    org_id: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    id: str
    org_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None
    email: Optional[str] = None
    department_id: str
    is_active: bool = True


class TeamCreate(TeamBase):
    org_id: Optional[str] = None


class TeamResponse(TeamBase):
    id: str
    org_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    default_priority: str = "MEDIUM"
    default_department_id: Optional[str] = None
    default_team_id: Optional[str] = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    org_id: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: str
    org_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ==========================================
# Ticket Schemas
# ==========================================
class TicketCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    category_id: str
    priority: Optional[str] = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    department_id: Optional[str] = None
    tags: Optional[List[str]] = []


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    priority: Optional[str] = None
    department_id: Optional[str] = None
    tags: Optional[List[str]] = None


class TicketAssignRequest(BaseModel):
    assigned_to_id: Optional[str] = None
    assigned_team_id: Optional[str] = None
    reason: Optional[str] = None


class TicketTransitionRequest(BaseModel):
    status: str  # NEW, ASSIGNED, IN_PROGRESS, PENDING_CUSTOMER, RESOLVED, CLOSED, REOPENED
    comment: Optional[str] = None
    is_internal: bool = False


class TicketBriefResponse(BaseModel):
    id: str
    org_id: str
    ticket_number: str
    title: str
    category_id: str
    category_name: Optional[str] = None
    priority: str
    status: str
    requester_id: str
    requester_name: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assignee_name: Optional[str] = None
    assigned_team_id: Optional[str] = None
    team_name: Optional[str] = None
    response_due_at: Optional[datetime] = None
    resolution_due_at: Optional[datetime] = None
    is_sla_breached: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TicketDetailResponse(TicketBriefResponse):
    description: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    first_responded_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    tags: List[str] = []
    comments_count: int = 0
    sla_info: Optional[Dict[str, Any]] = None
    latest_ai_prediction: Optional[Dict[str, Any]] = None
    latest_sla_risk: Optional[Dict[str, Any]] = None


# ==========================================
# Comment & Event Schemas
# ==========================================
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    is_internal: bool = False


class CommentResponse(BaseModel):
    id: str
    ticket_id: str
    author_id: str
    author_name: str
    author_role: Optional[str] = None
    content: str
    is_internal: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EventResponse(BaseModel):
    id: str
    ticket_id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    event_type: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ==========================================
# SLA Schemas
# ==========================================
class SLAPolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    priority: str  # LOW, MEDIUM, HIGH, CRITICAL
    response_time_hours: float
    resolution_time_hours: float
    business_hours_only: bool = True
    is_active: bool = True


class SLAPolicyCreate(SLAPolicyBase):
    org_id: Optional[str] = None


class SLAPolicyResponse(SLAPolicyBase):
    id: str
    org_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SLARiskItem(BaseModel):
    ticket_id: str
    ticket_number: str
    title: str
    priority: str
    status: str
    assigned_to_name: Optional[str] = None
    resolution_due_at: Optional[datetime] = None
    time_remaining_minutes: Optional[float] = None
    risk_score: float  # 0.0 - 1.0
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_factors: List[str] = []
    suggested_mitigation: Optional[str] = None


# ==========================================
# Knowledge Base Schemas
# ==========================================
class KnowledgeArticleBase(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    category_id: Optional[str] = None
    visibility: str = "PUBLIC"  # PUBLIC, INTERNAL, RESTRICTED
    status: str = "APPROVED"  # DRAFT, APPROVED, ARCHIVED
    tags: List[str] = []
    is_active: bool = True


class KnowledgeArticleCreate(KnowledgeArticleBase):
    org_id: Optional[str] = None


class KnowledgeArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category_id: Optional[str] = None
    visibility: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class KnowledgeArticleResponse(KnowledgeArticleBase):
    id: str
    org_id: str
    author_id: str
    author_name: Optional[str] = None
    category_name: Optional[str] = None
    view_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeIngestRequest(BaseModel):
    article_ids: Optional[List[str]] = None  # None = ingest all approved articles
    rebuild_index: bool = False


class KnowledgeIngestResponse(BaseModel):
    job_id: str
    status: str  # PENDING, PROCESSING, COMPLETED, FAILED
    total_articles: int
    total_chunks: int
    message: str


# ==========================================
# AI / ML & RAG Schemas
# ==========================================
class AISearchRequest(BaseModel):
    query: str
    top_k: int = 4
    category_id: Optional[str] = None


class AISearchResultItem(BaseModel):
    chunk_id: str
    article_id: str
    article_title: str
    content: str
    similarity_score: float
    visibility: str


class AISearchResponse(BaseModel):
    query: str
    results: List[AISearchResultItem]
    total_retrieved: int


class AIAssistRequest(BaseModel):
    ticket_id: Optional[str] = None
    query: Optional[str] = None
    description: Optional[str] = None
    tone: Optional[str] = "professional"


class AIAssistResponse(BaseModel):
    suggested_response: str
    citations: List[Dict[str, Any]]
    model_used: str
    confidence: float
    grounded: bool
    execution_time_ms: float
    note: Optional[str] = None


class SimilarTicketItem(BaseModel):
    id: str
    ticket_number: str
    title: str
    status: str
    priority: str
    category_name: Optional[str] = None
    similarity_score: float


class SimilarTicketsResponse(BaseModel):
    ticket_id: str
    similar_tickets: List[SimilarTicketItem]
    total_found: int
    execution_time_ms: float


class TicketSummaryRequest(BaseModel):
    max_sentences: int = 3


class TicketSummaryResponse(BaseModel):
    ticket_id: str
    summary: str
    key_points: List[str]
    sentence_count: int
    compression_ratio: float
    execution_time_ms: float


class AIPredictionResponse(BaseModel):
    id: str
    ticket_id: str
    model_name: str
    model_version: str
    predicted_category_id: Optional[str] = None
    predicted_category_name: Optional[str] = None
    predicted_priority: Optional[str] = None
    confidence_scores: Optional[Dict[str, float]] = None
    rationale: Optional[str] = None
    execution_time_ms: float
    created_at: datetime

    model_config = {"from_attributes": True}


class AIFeedbackCreate(BaseModel):
    prediction_id: str
    is_category_accepted: Optional[bool] = None
    corrected_category_id: Optional[str] = None
    is_priority_accepted: Optional[bool] = None
    corrected_priority: Optional[str] = None
    feedback_notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)


class AIModelInfo(BaseModel):
    model_name: str
    model_type: str
    version: str
    status: str  # ACTIVE, DEGRADED, OFFLINE
    metrics: Dict[str, Any]
    last_trained: Optional[str] = None
    description: str


class AIAdminModelsResponse(BaseModel):
    category_classifier: AIModelInfo
    sla_risk_predictor: AIModelInfo
    rag_retrieval: AIModelInfo
    ollama_llm: AIModelInfo


# ==========================================
# Dashboard & Analytics Schemas
# ==========================================
class DashboardSummary(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    critical_tickets: int
    sla_compliance_rate: float
    avg_resolution_hours: float
    ai_assisted_tickets: int
    ai_category_accuracy: float


class DashboardTrends(BaseModel):
    ticket_volume_by_day: List[Dict[str, Any]]  # [{"date": "2026-10-15", "count": 12}, ...]
    status_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    category_breakdown: List[Dict[str, Any]]
    agent_workload: List[Dict[str, Any]]


# ==========================================
# Audit Log Schemas
# ==========================================
class AuditLogResponse(BaseModel):
    id: str
    org_id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}
