import logging
import sys
from pathlib import Path

# Ensure project root directory is in sys.path so 'backend.app' imports work from any cwd
_project_root = str(Path(__file__).resolve().parent.parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from backend.app.core.config import settings
from backend.app.api.v1 import (
    auth,
    users,
    organizations,
    tickets,
    knowledge,
    sla,
    dashboard,
    admin,
    health
)

# Configure structured logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

SWAGGER_DESCRIPTION = """
## 🚀 AI-Based Smart Help Desk & Ticket Management System (API v1)

Welcome to the interactive Swagger API documentation for the **Smart Help Desk** MCA Major Project.
This API provides full lifecycle ticket management, deterministic SLA tracking, multi-tenant organization isolation, and local AI/ML features with **zero paid external AI API dependencies**.

---

### 🔑 Quick Interactive Authentication Guide:
1. Click the **Authorize 🔓** button at the top right of this page.
2. In the OAuth2 form:
   - **username**: Enter any demo account email (e.g. `admin@apex.com` or `agent.john@apex.com`)
   - **password**: Enter `Password123!`
3. Click **Authorize** then **Close**.
4. All protected endpoints are now authorized and will send the `Authorization: Bearer <token>` header automatically!

---

### 👥 Preset Demo Accounts (Password: `Password123!`):

| Role | Email | Organization | Access Level |
| :--- | :--- | :--- | :--- |
| **System Admin** | `sysadmin@smarthelpdesk.local` | Global | Full Cross-Tenant System Control |
| **Org Admin** | `admin@apex.com` | Apex Enterprises | Org Users, Categories, SLA Policies, Audit Logs |
| **Team Lead** | `lead.it@apex.com` | Apex Enterprises | Ticket Assignment, Queue Balancing, SLA Monitor |
| **Support Agent** | `agent.john@apex.com` | Apex Enterprises | Ticket Resolution, RAG Copilot Drafts, Internal Notes |
| **Requester (Employee)** | `user.alice@apex.com` | Apex Enterprises | Ticket Submission, Status Tracking, Public Comments |
| **Requester (Student)** | `student.emma@greenwood.edu` | Greenwood Institute | Campus Wi-Fi, LMS Courses, Public Knowledge |

---

### 🧠 Local AI & ML Subsystem Highlights:
- **Category Classification**: TF-IDF + balanced Logistic Regression (`POST /api/v1/tickets/{id}/ai/analyze`)
- **Deterministic Emergency Rules**: Immediate elevation to `CRITICAL` for outages, security breaches, and hazards
- **SLA Breach Risk Forecasting**: Machine learning predictor scoring breach probability (`GET /api/v1/sla/risks`)
- **Dense Vector Search**: FAISS `IndexFlatIP` with strict organization & role isolation (`POST /api/v1/ai/knowledge/search`)
- **Local RAG Copilot**: Grounded responses via local Ollama (`qwen2.5:3b`) with source citations (`POST /api/v1/ai/assist`)
"""

TAGS_METADATA = [
    {
        "name": "Authentication",
        "description": "JWT authentication, login, rolling refresh-token rotation, and session logout."
    },
    {
        "name": "Tickets",
        "description": "Full ticket lifecycle, state machine transitions, assignments, comments, audit history, and AI feedback."
    },
    {
        "name": "Knowledge Base & AI RAG",
        "description": "Article management, background FAISS vector embedding sync, semantic search, and local RAG Copilot assistance."
    },
    {
        "name": "SLA Management",
        "description": "Organization SLA target policies and real-time operational breach risk monitors."
    },
    {
        "name": "Dashboard & Analytics",
        "description": "KPI summaries, intake trends, status distributions, category breakdowns, and agent workloads."
    },
    {
        "name": "Users",
        "description": "User profiles, member creation, and role-based directory management."
    },
    {
        "name": "Organizations & Structure",
        "description": "Multi-tenant organizations, departments, teams, and categories."
    },
    {
        "name": "Administration & Monitoring",
        "description": "AI model evaluation metrics, FAISS vector count, Ollama service health, and system audit logs."
    },
    {
        "name": "Health & Diagnostics",
        "description": "Liveness and readiness probes for database connectivity and vector store status."
    }
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=SWAGGER_DESCRIPTION,
    version="1.0.0",
    openapi_tags=TAGS_METADATA,
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
        "filter": True,
        "defaultModelsExpandDepth": -1
    }
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 API Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(health.router, prefix=api_v1_prefix)
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(users.router, prefix=api_v1_prefix)
app.include_router(organizations.router, prefix=api_v1_prefix)
app.include_router(tickets.router, prefix=api_v1_prefix)
app.include_router(knowledge.router, prefix=api_v1_prefix)
app.include_router(sla.router, prefix=api_v1_prefix)
app.include_router(dashboard.router, prefix=api_v1_prefix)
app.include_router(admin.router, prefix=api_v1_prefix)


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/api/info")
def api_info():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "online",
        "swagger_docs": "/docs",
        "redoc_docs": "/redoc",
        "api_v1": settings.API_V1_STR
    }
