# API Specification: AI-Based Smart Help Desk & Ticket Management System

**Base URL**: `/api/v1`  
**Authentication**: HTTP Bearer JWT Token (`Authorization: Bearer <token>`)

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates a user and issues JWT access and refresh tokens.
- **Request Body**:
  ```json
  {
    "email": "agent.john@apex.com",
    "password": "Password123!",
    "org_id": "optional-org-uuid"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "agent.john@apex.com",
      "full_name": "Johnathan Reed",
      "roles": ["AGENT"],
      "org_id": "uuid",
      "org_name": "Apex Enterprises Global"
    }
  }
  ```

### `POST /auth/refresh`
Rotates and issues a new access token and refresh token.
- **Request Body**: `{"refresh_token": "string"}`
- **Response `200 OK`**: TokenResponse

### `POST /auth/logout`
Revokes active refresh tokens for the current session.

---

## 2. User & Structure Endpoints

- `GET /users/me`: Current user profile, organization, department, and team memberships.
- `GET /users`: List users in organization (filterable by `department_id`, `role`, `search`).
- `POST /users`: Create user (Requires `ORG_ADMIN` or `SYS_ADMIN`).
- `GET /organizations`: List accessible organizations.
- `GET /departments`, `POST /departments`, `DELETE /departments/{id}`
- `GET /teams`, `POST /teams`, `DELETE /teams/{id}`
- `GET /categories`, `POST /categories`, `DELETE /categories/{id}`

---

## 3. Ticket Endpoints

### `GET /tickets`
- **Query Parameters**:
  - `page`: int (default: 1)
  - `page_size`: int (default: 20)
  - `status`: string (NEW, ASSIGNED, IN_PROGRESS, PENDING_CUSTOMER, RESOLVED, CLOSED, REOPENED)
  - `priority`: string (LOW, MEDIUM, HIGH, CRITICAL)
  - `category_id`: string
  - `search`: string (searches title, description, ticket number)
  - `sort_by`: string (`created_at`, `priority`, etc.)
  - `sort_order`: string (`asc`, `desc`)
- **Response `200 OK`**: Paginated ticket list with SLA breach flags.

### `POST /tickets`
Creates ticket, generates organization-scoped ticket number (e.g. `APEX-TK-1002`), calculates SLA deadlines, and executes initial AI classification.
- **Request Body**:
  ```json
  {
    "title": "Cannot connect to VPN gateway",
    "description": "Error 403 on GlobalProtect client since morning",
    "category_id": "uuid",
    "priority": "HIGH",
    "tags": ["vpn", "network"]
  }
  ```

### `GET /tickets/{ticket_id}`
Returns full ticket details, SLA tracking timestamps, latest AI prediction, comments count, and assignee info.

### `POST /tickets/{ticket_id}/transition`
Validates and executes status transition in accordance with the workflow state machine.
- **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS",
    "comment": "Commencing investigation into radius desync.",
    "is_internal": false
  }
  ```

### `POST /tickets/{ticket_id}/assign`
Assigns or reassigns ticket to an agent or team with audit reason.

### `GET /tickets/{ticket_id}/comments`
Retrieves comments stream. Filters out `is_internal: true` for Requester users.

### `POST /tickets/{ticket_id}/comments`
Adds a public comment or internal agent note.

### `GET /tickets/{ticket_id}/history`
Returns chronological audit timeline of all state transitions and assignments.

---

## 4. AI & Knowledge Base Endpoints

### `POST /tickets/{ticket_id}/ai/analyze`
Triggers category prediction, deterministic priority safety check, and SLA risk score.

### `POST /tickets/{ticket_id}/ai/feedback`
Captures agent/user verification or corrections on AI classifications to drive continual model retraining.

### `POST /ai/knowledge/search`
Performs permission-aware dense semantic vector search in FAISS.
- **Request Body**: `{"query": "VPN Error 403", "top_k": 3}`
- **Response `200 OK`**: List of chunks with similarity scores and verified chunk IDs.

### `POST /ai/assist`
Generates grounded troubleshooting draft using local RAG and local Ollama model.
- **Request Body**: `{"query": "VPN connection issues", "tone": "professional"}`
- **Response `200 OK`**: Drafted resolution with exact `[Source ID]` citations.

### `POST /knowledge/ingest`
Triggers background chunking and FAISS vector index rebuilding. Returns `job_id`.

### `GET /knowledge/ingest/{job_id}`
Returns ingestion progress: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.

---

## 5. SLA & Dashboard Endpoints

- `GET /sla/policies`: List configured SLA response/resolution deadlines.
- `POST /sla/policies`: Configure policy for priority level.
- `GET /sla/risks`: Real-time list of tickets sorted by breach risk score and time remaining.
- `GET /dashboard/summary`: High-level KPIs (Total, Open, Resolved, Critical, SLA Compliance %, AI Accuracy).
- `GET /dashboard/trends`: Time-series trends (intake volume, status pie, category breakdown, agent workloads).
- `GET /admin/ai/models`: Diagnostic metrics for all ML models, FAISS vector count, and Ollama status.
- `GET /admin/audit-logs`: System audit trail for compliance auditing.
- `GET /health`, `GET /ready`: Health and readiness probes.
