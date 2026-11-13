# MCA MAJOR PROJECT REPORT

## PROJECT TITLE:
### **AI-BASED SMART HELP DESK AND TICKET MANAGEMENT SYSTEM**

**Academic Specialization**: Master of Computer Applications (MCA)  
**Core Technologies**: React.js, Vite, Bootstrap 5, Apache ECharts, Python 3, FastAPI, SQLAlchemy 2, Alembic, MySQL Community Edition, scikit-learn, Sentence Transformers, FAISS, Ollama & Qwen2.5 3B.

---

## 1. ABSTRACT

Modern enterprises and educational institutions face high ticket intake volumes across IT infrastructure, software tooling, user access, and facilities. Traditional service desks suffer from manual triage delays, misrouted tickets, missed SLA deadlines, and repetitive agent responses. 

This project implements the **AI-Based Smart Help Desk and Ticket Management System**, a complete, production-grade enterprise application. The platform features strict multi-tenant organization isolation, granular role-based access control (Requester, Agent, Team Lead, Organization Admin, System Admin), deterministic SLA computation, and an end-to-end local AI/ML subsystem. 

Crucially, all AI processing runs strictly on-device without external, paid LLM APIs:
1. **Ticket Categorization**: A scikit-learn pipeline utilizing TF-IDF n-gram vectorization and balanced Logistic Regression.
2. **Deterministic Priority Rules**: Safety heuristics ensuring emergency keywords immediately elevate critical incidents.
3. **SLA Breach Risk Forecasting**: Predictive modeling based on temporal features, priority, and queue depth.
4. **Retrieval-Augmented Generation (RAG)**: A document ingestion pipeline chunking approved knowledge articles, generating local vector embeddings, indexing into FAISS, and performing permission-aware semantic search.
5. **Local LLM Grounding**: Grounded resolution drafts generated via Ollama with `qwen2.5:3b`, requiring explicit citations from retrieved metadata and preventing hallucinations.

---

## 2. PROBLEM DEFINITION & OBJECTIVES

### 2.1 Problem Statement
Existing commercial service desk solutions (e.g. ServiceNow, Zendesk, Jira Service Management) are prohibitively expensive for university campuses and medium businesses. Furthermore, emerging generative AI integrations rely heavily on third-party cloud APIs (such as OpenAI or Google Cloud Vertex AI), which introduce data privacy risks, recurring operational costs, and vendor lock-in.

### 2.2 Project Objectives
- Develop a responsive React.js single-page application with role-tailored dashboards and interactive Apache ECharts visualizations.
- Build an asynchronous RESTful API backend using Python FastAPI and SQLAlchemy 2 with MySQL Community Edition persistence.
- Implement an audited ticket workflow state machine preventing illegal transitions.
- Enforce strict cross-tenant organization isolation and role permissions across all database records and vector queries.
- Train and evaluate local scikit-learn classification and risk models on realistic IT service desk data.
- Construct a local RAG copilot grounded in verified organization knowledge articles with full source attribution.

---

## 3. SYSTEM REQUIREMENTS SPECIFICATION (SRS)

### 3.1 Functional Requirements
1. **Authentication & Session Management**: Secure user authentication using bcrypt password hashing, JWT access tokens, and rolling refresh token revocation.
2. **Role-Based Access Control**:
   - `REQUESTER`: Create tickets, view personal ticket status, comment publicly, search public knowledge articles.
   - `AGENT`: Manage assigned queue, start progress, submit public replies and internal notes, use AI draft copilot, resolve tickets.
   - `LEAD`: Reassign tickets, balance team workloads, monitor SLA risk alerts.
   - `ORG_ADMIN`: Manage users, departments, teams, categories, SLA policies, and view audit logs.
   - `SYS_ADMIN`: Cross-tenant supervision and system diagnostics.
3. **Ticket Management Engine**: Auto-generated ticket keys (`APEX-TK-1001`), SLA response/resolution deadline calculators, and transition state validation.
4. **AI Triage & Classification**: Real-time category recommendation, confidence score distribution, rationale reporting, and agent feedback capture.
5. **Knowledge Management & Vector Ingestion**: Article authoring, chunking with overlap, FAISS vector indexing, and background synchronization.
6. **Local Grounded AI Copilot**: Semantic vector search and RAG synthesis with exact citation references.
7. **Analytics & SLA Monitoring**: Executive KPI cards, intake trends, status pie charts, and SLA risk alert tables.

### 3.2 Non-Functional Requirements
- **Security & Privacy**: Zero cloud data egress for AI inference; password hashing using bcrypt; parameterized SQL queries preventing SQL injection; strict tenant scoping.
- **Performance**: Sub-50ms REST API response latency; sub-15ms vector retrieval via FAISS `IndexFlatIP`.
- **Reliability & Portability**: Runs on standard CPU hardware without mandatory GPU hardware requirements.

---

## 4. DATABASE DESIGN & SCHEMA

The database schema is normalized into 23 tables:

1. `organizations`: Core tenant definition (`id`, `name`, `code`, `domain`, `is_active`, `created_at`).
2. `departments` & `teams`: Organizational structure.
3. `team_members`: Association table linking users to teams with team-lead flags.
4. `roles` & `user_roles`: RBAC definition.
5. `users` & `refresh_tokens`: User identity and token rotation tracking.
6. `categories`: Ticket classification categories with default priority and team routing.
7. `sla_policies`: Priority-based target hours for response and resolution.
8. `tickets`: Core ticket records with status, priority, dates, and foreign keys.
9. `ticket_assignments`: Reassignment history log.
10. `ticket_comments`: Public responses and internal agent notes (`is_internal: true`).
11. `ticket_events`: Immutable audit trail for every status change, assignment, and comment.
12. `sla_trackings`: Target deadlines and breach records.
13. `knowledge_articles` & `knowledge_chunks`: Articles and chunked passages mapped to vector IDs.
14. `ai_predictions`: Model version, confidence scores, rationale, and execution latency.
15. `sla_risk_predictions`: Estimated breach probability, risk factors, and mitigations.
16. `ai_feedbacks`: Agent validation/corrections driving retraining.
17. `audit_logs`: Administrative actions log with IP addresses and actor IDs.

---

## 5. AI / MACHINE LEARNING METHODOLOGY

### 5.1 Category Classification Pipeline
- **Dataset**: Ticket descriptions across IT, Network, Access, Hardware, LMS, and Facilities.
- **Feature Extraction**: `TfidfVectorizer` extracting unigrams and bigrams, sublinear term frequency scaling, and English stop-word filtering.
- **Classification Model**: Multi-class `LogisticRegression` with balanced class weighting and L2 regularization ($C=2.0$).
- **Metrics Evaluated**: Accuracy, Macro F1, Weighted F1, Macro Precision, Macro Recall, and Confusion Matrix.

### 5.2 Deterministic Safety Rules
Machine learning models alone can be susceptible to out-of-distribution misses on critical emergencies. The AI engine applies a deterministic safety layer: any ticket containing emergency tokens (e.g. `outage`, `security breach`, `server down`, `fire`, `data loss`) is elevated immediately to `CRITICAL` priority.

### 5.3 SLA Breach Risk Estimation
Predicts whether an incoming ticket is at risk of breaching its SLA deadline.
- Features: Ticket Priority, Category, Submission Hour, Weekend flag, Initial Queue Depth, and Description character length.
- Preprocessing: `ColumnTransformer` with `OneHotEncoder` on categorical fields and `StandardScaler` on numerical features.
- Model: Balanced `LogisticRegression` with threshold scoring mapping probabilities into `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL` risk tiers.

### 5.4 Document Ingestion & Dense Vector Search (FAISS)
1. Approved knowledge base articles are parsed and segmented into overlapping text passages (400 characters, 60 characters overlap).
2. Passages are converted into dense vector embeddings.
3. Embeddings are indexed into a FAISS `IndexFlatIP` (Inner Product on L2-normalized vectors), which directly computes Cosine Similarity.
4. Each vector ID is mapped to metadata: `article_id`, `org_id`, `title`, `content`, and `visibility`.
5. **Tenant Isolation**: When an agent searches, vectors are filtered to enforce `org_id == current_user.org_id` and visibility authorization (`PUBLIC` vs `INTERNAL`).

### 5.5 Local RAG with Qwen2.5 3B
Retrieved knowledge chunks are formatted into an untrusted context block and passed to the local `qwen2.5:3b` model running on Ollama. The system prompt strictly prohibits hallucinations and requires exact `[Source ID]` citation bracket notation. If no relevant chunks meet the similarity threshold, the system explicitly returns "Insufficient evidence in approved knowledge articles."

---

## 6. EXPERIMENTAL RESULTS & VERIFICATION

Automated test suites were developed and executed across the full stack:

### 6.1 Backend API & Workflow Integration Tests (`backend/tests/test_api.py`)
- `test_health_and_readiness`: PASSED (Database UP, Models LOADED).
- `test_auth_login_invalid`: PASSED (Rejects invalid password with 401).
- `test_auth_login_and_me`: PASSED (Validates JWT issuance and `/users/me`).
- `test_ticket_creation_and_workflow`: PASSED (Validates number generation, AI prediction attachment, and state transition).
- `test_ai_knowledge_search_and_assist`: PASSED (Vector search returns matching chunks and citations).
- `test_dashboard_and_sla`: PASSED (KPI calculation and risk scoring).
- `test_admin_ai_models_monitoring`: PASSED (Diagnostic reporting).

### 6.2 AI Subsystem Unit Tests (`ai/tests/test_ai_pipeline.py`)
- `test_chunking_overlap`: PASSED (Verifies chunk boundaries and overlap).
- `test_category_classifier_inference`: PASSED (Confidence scores output).
- `test_sla_risk_inference`: PASSED (Breach risk probability calculation).
- `test_vector_store_tenant_isolation`: PASSED (Zero cross-organization leakage).
- `test_vector_store_role_permission_isolation`: PASSED (Requesters cannot access internal articles).
- `test_rag_insufficient_evidence`: PASSED (Returns explicit evidence lack notice).

### 6.3 Frontend Production Build
- Vite production compilation: **682 modules transformed, 0 errors, built in 10.51s**.

---

## 7. CONCLUSION & FUTURE SCOPE

The **AI-Based Smart Help Desk and Ticket Management System** successfully delivers a complete MCA capstone project. By unifying a modern React enterprise frontend, an asynchronous FastAPI backend, and an entirely local AI/ML subsystem (scikit-learn + FAISS + Ollama), the project demonstrates that state-of-the-art AI assistance can be achieved with zero paid API dependencies and complete data privacy.

Future enhancements include:
- Audio/voice ticket submission using local Whisper models.
- Email inbound/outbound parsing for automatic ticket creation via IMAP/SMTP.
- Multi-language translation for cross-border student assistance.
