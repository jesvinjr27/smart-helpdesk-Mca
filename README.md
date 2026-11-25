# AI-Based Smart Help Desk & Ticket Management System

An enterprise-grade, multi-tenant AI Help Desk and Ticket Management System built as an MCA Major Project. Features a **Lightweight Hybrid AI Architecture** engineered to run on **$\ge$ 4 GB RAM systems using CPU-only execution**, real-time ticket classification, deterministic SLA tracking, predictive breach risk forecasting, database-backed RAG semantic search, pre-submission duplicate incident detection, and a guided 3-stage ticket creation workspace.

---

## 🌟 Key Features

- **Frontend**: React.js 18 + Vite, Tailwind CSS, React Router 6, Axios, and Bootstrap Icons.
  - **Modern 3-Stage Smart Ticket Creation Workspace**:
    - **Step 1: Describe Issue**: Issue type pills (Incident, Service Request, Question), live character counter, formatting snippet helpers, and drag-and-drop attachment dropzone with previews and size validation.
    - **Step 2: Classify Request**: Interactive icon-based category cards, dynamic contextual form fields (Device/OS for Hardware, SSID/Connection for Network, App/Version for Software, System/Account ID for Access), and 4-tier visual priority selector with SLA commitments.
    - **Step 3: Review & Submit**: Structured summary overview, background duplicate ticket warning banner, inline step edit shortcuts, and debounced local draft auto-save.
  - **Global SVG API Loading Indicator**: Centralized request interceptor featuring a smooth infinite-loop loader with overlay.
  - **Comprehensive Form Validation & Red Toast Notifications**: Form field validation and slide-in notifications on authentication workflows.

- **Backend**: Python 3.11+ / FastAPI, SQLAlchemy 2 (23 normalized tables), Alembic migrations, Pydantic v2 schemas.
  - **Multi-Tenant Organization Isolation**: Strict tenant-boundary filtering on all tickets, comments, attachments, and knowledge base articles.
  - **Full Lifecycle Ticket Management**: State machine transitions (`NEW`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_CUSTOMER`, `RESOLVED`, `CLOSED`, `REOPENED`), audit history logs, and internal staff notes.
  - **Attachment Management**: File upload validation, streaming download endpoints, and storage management.

- **Lightweight Hybrid AI Subsystem ($\ge$ 4 GB RAM, CPU-Only)**:
  - **Component A (Lightweight ML Engine)**:
    - **Ticket Category Classifier**: Scikit-learn TF-IDF + Logistic Regression (`17.5 KB` artifact, sub-3 ms inference, 100% test accuracy on helpdesk categories).
    - **Deterministic Safety Escalation**: Auto-detects emergency outages and hazards to set priority to `CRITICAL` with 1-hour SLA.
    - **SLA Breach Risk Predictor**: Machine-learning model evaluating arrival time, queue depth, and category (`1.8 KB` artifact, sub-10 ms).
    - **Similar Ticket Detection**: Real-time TF-IDF cosine similarity over active tenant tickets for duplicate warnings and related ticket suggestions.
  - **Component B (Small Local LLM Gateway)**:
    - Provider-based architecture (`DisabledLLMProvider`, `SmallModelHTTPProvider`).
    - Instant zero-memory deterministic fallback with verified template citations and extractive summarization.
    - Optional support for local small models (`Qwen2.5 0.5B` / `SmolLM2 360M`).
  - **Component C (Database RAG Engine)**:
    - In-memory TF-IDF cosine ranker (`< 3 MB RAM`) directly querying approved articles from SQL database.
    - Zero external vector database (FAISS/Milvus) required.
    - Evidence Verification Gate rejecting unsupported queries without hallucination.
  - **Resource Footprint**: Total process working set **~189 MB RAM** (using `< 5%` of a 4 GB RAM budget), zero GPU or paid external APIs required.

---

## 🏗️ Project Structure

```
smart-helpdesk/
│
├── frontend/                          # React.js + Vite Web Application
│   ├── src/
│   │   ├── api/                       # Centralized Axios client with global SVG loader & endpoints
│   │   ├── components/                # Reusable UI widgets, badges, modals, loaders
│   │   ├── hooks/                     # Auth context & custom hooks
│   │   ├── layouts/                   # Sidebar, topbar, navigation layout
│   │   ├── pages/
│   │   │   ├── tickets/               # TicketListPage, TicketDetailPage, TicketCreatePage
│   │   │   │   └── components/        # Stepper, Dropzone, CategoryCard, DynamicFields, Step forms
│   │   │   ├── knowledge-base/        # Semantic search & documentation articles
│   │   │   ├── administration/        # AI Model Monitor, audit logs, user management
│   │   │   ├── auth/                  # Login, forgot password, reset password
│   │   │   └── dashboard/             # Role-based KPI analytics
│   │   └── routes/                    # Protected & role-based routes
│   └── package.json
│
├── backend/                           # FastAPI Backend Application
│   ├── app/
│   │   ├── api/v1/                    # Versioned API Routers (auth, tickets, knowledge, sla, etc.)
│   │   ├── ai/                        # Hybrid AI Architecture
│   │   │   ├── ml/                    # Classifier, priority, SLA risk, similar detection & models
│   │   │   │   ├── models/            # Pre-trained category_classifier.joblib & sla_risk_model.joblib
│   │   │   │   └── training/          # Dataset & model trainer script
│   │   │   ├── llm/                   # Small Local LLM provider factory (disabled fallback, small_http)
│   │   │   ├── rag/                   # DatabaseKnowledgeRetriever, indexer, synthesizer & evidence gate
│   │   │   ├── gateway/               # Unified AIGatewayService singleton
│   │   │   └── monitoring/            # Diagnostics & metrics reporter
│   │   ├── core/                      # Config, security, JWT token rotation, dependencies
│   │   ├── db/                        # SQLAlchemy session, engine & initialization
│   │   ├── models/                    # Normalized SQLAlchemy models (User, Ticket, Category, etc.)
│   │   ├── schemas/                   # Pydantic v2 schemas
│   │   ├── services/                  # Ticket workflow, SLA tracking, and dashboard services
│   │   └── main.py                    # Application entrypoint & CORS
│   ├── migrations/                    # Alembic database migrations
│   ├── tests/                         # Automated test suite (AI, auth flow, ticket workflow)
│   ├── scripts/                       # Benchmark & import verification scripts
│   └── requirements.txt
│
├── uploads/                           # Ticket attachments and user documents
│   └── tickets/
│
├── database/
│   ├── scripts/                       # Database initialization SQL scripts
│   └── seed/                          # Comprehensive multi-tenant seed script
│
├── pytest.ini                         # Root pytest configuration
└── requirements.txt                   # Root dependency specification
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: 3.11+, 3.12+, or 3.13+
- **Database**: SQLite (default, zero-setup) or MySQL 8.0 Community Edition

---

### 2. Backend & AI Setup

1. **Activate Virtual Environment**:
   ```powershell
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
   *(Note: Heavy dependencies like PyTorch, CUDA, Sentence Transformers, and FAISS are **not** needed; all models run on lightweight CPU-optimized scikit-learn and in-memory TF-IDF).*

3. **Database Seeding (Optional if starting fresh)**:
   ```bash
   # Seeds realistic organizations, users across 6 roles, categories, tickets, and KB articles:
   python database/seed/seed.py
   ```

4. **Verify / Re-Train AI Models (Optional)**:
   The pre-trained models are already included in `backend/app/ai/ml/models/`. If you want to retrain them from dataset:
   ```bash
   python backend/app/ai/ml/training/trainer.py
   ```

5. **Start the FastAPI Backend**:
   ```powershell
   .\.venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **System Health Probe**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - **Readiness & AI Diagnostics**: [http://localhost:8000/api/v1/ready](http://localhost:8000/api/v1/ready)

---

### 3. Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at: **[http://localhost:5173](http://localhost:5173)**

3. **Production Build Verification**:
   ```bash
   npm run build
   ```

---

### 4. Running AI & Performance Benchmarks

To execute the resource footprint and latency benchmark on your local machine:
```bash
python backend/scripts/benchmark_ai_subsystem.py
```
**Sample Benchmark Results (CPU-only, Windows):**
- **Process Working Set (RSS)**: ~189 MB
- **Peak Python Heap**: ~6.9 MB
- **Classification + Priority**: ~2.09 ms (P95: 2.33 ms)
- **SLA Breach Risk Prediction**: ~9.21 ms (P95: 10.44 ms)
- **Similar Ticket Detection**: ~7.99 ms (P95: 8.90 ms)
- **Knowledge Base Search**: ~11.30 ms (P95: 11.52 ms)
- **Conversation Summarization**: ~0.35 ms (P95: 0.41 ms)
- **RAM Utilization**: 4.6% of 4 GB budget (95.4% free)

---

## 🧪 Running Automated Tests

Run the complete test suite:
```powershell
.\.venv\Scripts\pytest.exe backend/tests/test_ticket_creation_workflow.py backend/tests/test_ai_hybrid_architecture.py backend/tests/test_auth_flow.py -v
```
- **Total Tests**: **21 passed**
- **Test Coverage**:
  - `test_ticket_creation_workflow.py`: Duplicate ticket detection and structured ticket creation.
  - `test_ai_hybrid_architecture.py`: TF-IDF category classifier inference, emergency escalation safety layer, SLA risk prediction, similar ticket detection, extractive summarization, RAG Evidence Verification Gate, grounded citation synthesis, and LLM provider fallbacks.
  - `test_auth_flow.py`: Argon2id password hashing, JWT access & refresh token rotation, token reuse detection and revocation, all 6 role logins, forgot/reset password workflows, and session logout.

---

## 👥 Demo Accounts (All Roles)

All demo accounts share the password: `Password123!`

| Role | Email | Organization | Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `sysadmin@smarthelpdesk.local` | Global | Cross-tenant access, system health & AI diagnostics |
| **Organization Admin** | `admin@apex.com` | Apex Enterprises | User management, category management, SLA policies, audit logs |
| **Team Lead** | `lead.it@apex.com` | Apex Enterprises | Ticket assignment, queue balancing, SLA monitoring |
| **Support Agent** | `agent.john@apex.com` | Apex Enterprises | Ticket resolution, AI Copilot draft assistance, internal notes |
| **Employee (Requester)**| `user.alice@apex.com` | Apex Enterprises | Ticket creation, status tracking, public conversation |
| **College Student** | `student.emma@greenwood.edu` | Greenwood Institute | Academic IT requests, campus Wi-Fi guides, student portal |
