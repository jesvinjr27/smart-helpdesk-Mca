# AI-Based Smart Help Desk and Ticket Management System

An enterprise-grade, multi-tenant AI Help Desk and Ticket Management System built as an MCA Major Project. Features real-time AI category classification, deterministic SLA deadline tracking, predictive SLA breach risk forecasting, dense vector search via FAISS, and local LLM RAG with Ollama & Qwen2.5 3B.

---

## 🌟 Key Features

- **Frontend**: React.js 18 + Vite, React Router 6, Axios, Bootstrap 5, Bootstrap Icons, and Apache ECharts.
- **Backend**: Python 3.12+ / FastAPI, SQLAlchemy 2 (async-compatible, 23 normalized tables), Alembic migrations, Pydantic v2 schemas.
- **Database**: MySQL 8.0 Community Edition (with Docker Compose) and seamless SQLite test support.
- **Local AI & Machine Learning Subsystem**:
  - **Category Classification**: scikit-learn TF-IDF + Logistic Regression baseline with confidence scores and rationale tags.
  - **Deterministic Safety Layer**: Automatic emergency escalation to CRITICAL priority for outages, security breaches, and hazards.
  - **SLA Breach Risk Forecasting**: Machine-learning predictor evaluating ticket urgency, submission hour, and queue depth.
  - **Dense Vector Search**: Sentence Transformers / TF-IDF + FAISS `IndexFlatIP` with tenant and role-based access filtering.
  - **Local LLM Copilot**: Grounded RAG with Ollama (`qwen2.5:3b`) providing verified citations and automatic fallback.
  - **No Paid APIs**: 100% on-device inference with zero external cloud dependencies.

---

## 🏗️ Project Structure

```
smart-helpdesk/
│
├── frontend/                    # React.js + Vite Web Application
│   ├── src/
│   │   ├── api/                 # Centralized Axios client & API endpoints
│   │   ├── components/          # Reusable UI widgets
│   │   ├── hooks/               # Auth context & custom hooks
│   │   ├── layouts/             # Sidebar, topbar, navigation layout
│   │   ├── pages/               # Auth, Dashboards, Tickets, KB, AI Copilot, SLA, Admin
│   │   └── routes/              # Protected & Role-based routes
│   └── package.json
│
├── backend/                     # FastAPI Application
│   ├── app/
│   │   ├── api/v1/              # Versioned API Routers (Auth, Tickets, SLA, AI, etc.)
│   │   ├── core/                # Config, security, JWT, dependencies
│   │   ├── db/                  # SQLAlchemy session & engine
│   │   ├── models/              # Normalized SQLAlchemy models
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   ├── services/            # Ticket workflow, SLA, and dashboard services
│   │   ├── integrations/        # AI Service integration bridge
│   │   └── main.py
│   ├── migrations/              # Alembic database migrations
│   ├── tests/                   # Backend API integration tests
│   ├── requirements.txt
│   └── .env.example
│
├── ai/                          # Local AI/ML Subsystem
│   ├── datasets/                # IT Helpdesk training datasets
│   ├── training/                # Category classifier & SLA risk training scripts
│   ├── retrieval/               # Overlapping chunking & FAISS vector store
│   ├── rag/                     # Grounded local RAG generation service
│   ├── artifacts/               # Saved models & vector index
│   └── tests/                   # AI pipeline unit tests
│
├── database/
│   ├── scripts/                 # MySQL initialization SQL scripts
│   └── seed/                    # Comprehensive database seeding script
│
├── docs/                        # Project Documentation
│   ├── architecture/            # Architecture diagrams & isolation specs
│   ├── api/                     # OpenAPI endpoint specifications
│   └── project-report/          # Formal MCA Major Project Report
│
├── docker-compose.yml           # MySQL 8.0 Community Edition service
└── pytest.ini                   # Root testing configuration
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v24+
- **Python**: 3.11+ / 3.12+ / 3.13+
- **Docker** (Optional, for MySQL container)
- **Ollama** (Optional, for local LLM text generation): Download from [ollama.com](https://ollama.com) and run `ollama run qwen2.5:3b`.

---

### 2. Backend & AI Setup

1. **Create and Activate Virtual Environment**:
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   pip install sentence-transformers faiss-cpu "pydantic[email]"
   ```

3. **Database Setup & Seeding**:
   ```bash
   # Seeds realistic organizations, users across 5 roles, categories, tickets, and KB articles:
   python database/seed/seed.py
   ```

4. **Train AI Models & Index Knowledge Base**:
   ```bash
   # Train Category Classifier:
   python ai/training/train_classifier.py

   # Train SLA Breach Risk Predictor:
   python ai/training/train_sla_risk.py

   # Embed & Index Knowledge Base into FAISS:
   python ai/scripts/ingest_knowledge_base.py
   ```

5. **Start the FastAPI Backend**:
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ..\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Documentation (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health Probe: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 3. Frontend Setup

1. **Install NPM Packages**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at: **[http://localhost:5173](http://localhost:5173)**

3. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🧪 Running Automated Tests

Run the complete test suite (Backend APIs + AI Pipeline):
```bash
pytest
```
- Total tests: **13 passed**
- Coverage includes JWT authentication, cross-tenant isolation, ticket transitions, FAISS vector search, SLA deadline calculations, and AI prediction schemas.

---

## 👥 Demo Accounts (All 5 Roles)

All demo accounts share the password: `Password123!`

| Role | Email | Organization | Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `sysadmin@smarthelpdesk.local` | Global | Cross-tenant access, system diagnostics |
| **Organization Admin** | `admin@apex.com` | Apex Enterprises | User management, SLA policies, audit logs |
| **Team Lead** | `lead.it@apex.com` | Apex Enterprises | Ticket assignment, queue balancing, SLA monitoring |
| **Support Agent** | `agent.john@apex.com` | Apex Enterprises | Ticket resolution, AI Copilot draft insertion, internal notes |
| **Employee (Requester)**| `user.alice@apex.com` | Apex Enterprises | Ticket submission, status tracking, public comments |
| **College Student** | `student.emma@greenwood.edu` | Greenwood Institute | Academic IT requests, Wi-Fi guides, student portal |
