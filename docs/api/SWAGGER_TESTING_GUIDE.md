# 🧪 Swagger API Documentation & Interactive Testing Guide

This guide explains how to use the interactive **Swagger UI** to test the RESTful API endpoints of the **AI-Based Smart Help Desk & Ticket Management System**.

---

## 1. Quick Launch

### Start the FastAPI Backend Server
Open PowerShell in the project root (`c:\smart helpdesk`) and run:

```powershell
.\.venv\Scripts\uvicorn.exe backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Accessing the API Documentation
Once the server starts, open your web browser to any of these URLs:

| Tool | URL | Description |
| :--- | :--- | :--- |
| **Interactive Swagger UI** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | **Recommended**: Test all endpoints live with the built-in "Authorize" dialog |
| **Alternative ReDoc UI** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Clean 3-column reference documentation |
| **Root Redirect** | [http://127.0.0.1:8000/](http://127.0.0.1:8000/) | Automatically redirects to `/docs` |
| **Raw OpenAPI Schema** | [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json) | Full OpenAPI 3.1.0 JSON specification |
| **Offline HTML Viewer** | [`docs/api/index.html`](index.html) | Standalone Swagger UI viewer without running server |

---

## 2. Authenticating in Swagger UI

All protected endpoints require a JWT Bearer token. Swagger UI features an integrated **OAuth2 Authorize button** that handles login and header injection automatically.

### How to Authenticate:
1. Navigate to **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.
2. Click the green **Authorize 🔓** button located at the top-right corner.
3. In the modal dialog under **OAuth2PasswordBearer (OAuth2, password)**:
   - **username**: Enter any demo account email (e.g., `agent.john@apex.com` or `admin@apex.com`).
   - **password**: `Password123!`
   - Leave `client_id` and `client_secret` blank.
4. Click **Authorize**, then click **Close**.
5. The padlock icon will now appear closed (**🔒**). All subsequent API requests executed via the **"Try it out"** button will automatically include the `Authorization: Bearer <token>` header.

> **Tip:** You can switch roles at any time by clicking **Authorize**, clicking **Logout**, and entering credentials for a different role!

---

## 3. Demo User Accounts & Roles

All seeded accounts use password: **`Password123!`**

| Role | Email | Tenant / Organization | Typical Test Capabilities |
| :--- | :--- | :--- | :--- |
| **SYS_ADMIN** | `sysadmin@smarthelpdesk.local` | System (Global) | Cross-tenant administration, system health, all audit logs |
| **ORG_ADMIN** | `admin@apex.com` | Apex Enterprises | Manage org users, teams, SLA policies, view org metrics |
| **LEAD** | `lead.it@apex.com` | Apex Enterprises | Ticket triage, agent assignment, team workload, SLA risks |
| **AGENT** | `agent.john@apex.com` | Apex Enterprises | Ticket status transitions, resolution notes, AI RAG assistant |
| **REQUESTER** | `user.alice@apex.com` | Apex Enterprises | Create tickets, view personal tickets, add public comments |
| **REQUESTER** | `student.emma@greenwood.edu` | Greenwood Institute | Student tenant tickets, public campus knowledge base |

---

## 4. End-to-End API Testing Walkthrough

Follow these 9 sequential steps in Swagger UI to test the core features of the system:

### Step 1: Health Check (Public)
- **Endpoint**: `GET /api/v1/health`
- **Tag**: `Health & Diagnostics`
- **Action**: Click **Try it out** -> **Execute**
- **Expected Status**: `200 OK`
- **Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "vector_store": {
    "total_chunks": 13,
    "organizations": ["all", "org-apex-001", "org-git-002"]
  }
}
```

---

### Step 2: Direct Authentication & JWT Tokens
- **Endpoint**: `POST /api/v1/auth/login`
- **Tag**: `Authentication`
- **Request Body**:
```json
{
  "email": "agent.john@apex.com",
  "password": "Password123!"
}
```
- **Expected Status**: `200 OK`
- **Response**: Returns `access_token`, `refresh_token`, and user profile with permissions.

---

### Step 3: Create a Support Ticket (Requester Role)
- **Authenticate as**: `user.alice@apex.com`
- **Endpoint**: `POST /api/v1/tickets`
- **Tag**: `Tickets`
- **Request Body**:
```json
{
  "title": "VPN connection dropping repeatedly during remote login",
  "description": "Whenever I connect to the corporate VPN from home, it disconnects after 5 minutes with error code 800. I have tried restarting my router but the issue persists.",
  "priority": "MEDIUM",
  "channel": "PORTAL"
}
```
- **Expected Status**: `201 Created`
- **Note**: Copy the generated `id` (e.g., `ticket-xxx`) from the response for the next steps!

---

### Step 4: Run Real-Time AI Ticket Analysis
- **Authenticate as**: `agent.john@apex.com` or `lead.it@apex.com`
- **Endpoint**: `POST /api/v1/tickets/{ticket_id}/ai/analyze`
- **Tag**: `Tickets`
- **Parameter**: `ticket_id` = ID from Step 3
- **Action**: Click **Execute**
- **Expected Status**: `200 OK`
- **What this does**:
  - Runs the local scikit-learn TF-IDF + Logistic Regression classifier.
  - Applies deterministic emergency escalation rules (e.g., outages / security threats).
  - Returns suggested category (e.g., `Network & VPN`), confidence score, suggested priority, and top extracted keywords.

---

### Step 5: Assign Ticket and Progress Workflow
- **Authenticate as**: `lead.it@apex.com`
- **Endpoint**: `POST /api/v1/tickets/{ticket_id}/assign`
- **Tag**: `Tickets`
- **Parameter**: `ticket_id` = ID from Step 3
- **Request Body**:
```json
{
  "assigned_to_id": "usr-agent-001",
  "team_id": "team-net-001"
}
```
- **Expected Status**: `200 OK`

Next, advance status to `RESOLVED`:
- **Endpoint**: `POST /api/v1/tickets/{ticket_id}/status`
- **Request Body**:
```json
{
  "status": "RESOLVED",
  "reason": "Reconfigured OpenVPN MTU settings to 1420.",
  "resolution_notes": "Identified packet fragmentation on local ISP. Adjusted adapter MTU to 1420 and updated WireGuard client profile. Stable connection verified for 30 minutes."
}
```

---

### Step 6: Semantic Knowledge Base Search (FAISS Dense Vectors)
- **Authenticate as**: `agent.john@apex.com`
- **Endpoint**: `POST /api/v1/ai/knowledge/search`
- **Tag**: `Knowledge Base & AI RAG`
- **Request Body**:
```json
{
  "query": "How do I reset my company password or unlock my account?",
  "top_k": 3
}
```
- **Expected Status**: `200 OK`
- **Response**: Returns matching knowledge chunks indexed in the FAISS vector database with similarity scores and article metadata.

---

### Step 7: AI Copilot RAG Assistant (Local LLM + Retrieval)
- **Authenticate as**: `agent.john@apex.com`
- **Endpoint**: `POST /api/v1/ai/assist`
- **Tag**: `Knowledge Base & AI RAG`
- **Request Body**:
```json
{
  "prompt": "Customer cannot access corporate Wi-Fi network and reports invalid certificate error. What are the resolution steps?",
  "ticket_id": "tkt-001",
  "max_tokens": 512
}
```
- **Expected Status**: `200 OK`
- **Response**: Grounded response generated by the local RAG engine with strict citations (`[Source: KB-00X ...]`).

---

### Step 8: SLA Breach Risk ML Predictor
- **Authenticate as**: `lead.it@apex.com` or `admin@apex.com`
- **Endpoint**: `GET /api/v1/sla/risks`
- **Tag**: `SLA Management`
- **Query Parameter**: `limit` = 10
- **Expected Status**: `200 OK`
- **Response**: Returns active tickets scored by the scikit-learn SLA breach risk model with risk percentages (`0% - 100%`), risk tier (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), remaining hours, and actionable recommendations.

---

### Step 9: Dashboard KPIs & AI Model Monitoring
- **Endpoint**: `GET /api/v1/dashboard/summary`
  - **Tag**: `Dashboard & Analytics`
  - **Returns**: Open tickets, SLA compliance rate, avg resolution hours, high-risk count, and intake trend timeseries.
- **Endpoint**: `GET /api/v1/admin/ai/metrics`
  - **Tag**: `Administration & Monitoring`
  - **Returns**: Accuracy, precision, recall, and F1 scores for both the Category Classifier and the SLA Risk model, along with vector store index chunk counts and Ollama engine status.

---

## 5. Troubleshooting & Tips

1. **Error: `401 Unauthorized - Could not validate credentials`**:
   - Ensure you authenticated using the green **Authorize** button with one of the valid demo emails listed in Section 3 and password `Password123!`.
2. **Error: `403 Forbidden - Insufficient permissions`**:
   - Requesters cannot access admin endpoints (`/api/v1/admin/*`, `/api/v1/sla/risks`). Switch to an `ORG_ADMIN` or `LEAD` account via the Authorize button.
3. **Cross-Tenant Isolation (`404 Ticket not found`)**:
   - The system strictly isolates tenants. An Apex agent (`agent.john@apex.com`) cannot view Greenwood Institute tickets. Log in as `sysadmin@smarthelpdesk.local` if you need cross-tenant visibility.
4. **Exported Schema**:
   - The OpenAPI spec is always kept in sync at [`docs/api/openapi.json`](openapi.json).
