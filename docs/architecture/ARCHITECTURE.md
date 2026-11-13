# System Architecture: AI-Based Smart Help Desk & Ticket Management System

## 1. High-Level Architecture Overview

The system is engineered as an enterprise-grade, multi-tenant solution designed for corporations and educational institutions. It tightly integrates a modern React frontend, a high-throughput Python FastAPI backend, a MySQL database, and a local AI/ML subsystem powered by scikit-learn, Sentence Transformers, FAISS, and Ollama.

```mermaid
graph TD
    Client[React.js + Vite Web Frontend] -->|REST APIs + JWT| Gateway[FastAPI v1 API Gateway]
    
    subgraph "Core Backend Services"
        Gateway --> Auth[Auth & RBAC Middleware]
        Gateway --> TicketSvc[Ticket Workflow & SLA Engine]
        Gateway --> KBSvc[Knowledge Base Engine]
        Gateway --> DashSvc[Dashboard & Analytics Engine]
    end
    
    subgraph "Data Tier"
        TicketSvc --> DB[(MySQL / SQLite Relational DB)]
        KBSvc --> DB
        DashSvc --> DB
    end
    
    subgraph "AI & Machine Learning Subsystem"
        Gateway --> AISvc[AI Service Integration Layer]
        AISvc --> Classifier[TF-IDF + Logistic Regression Classifier]
        AISvc --> SLAPredictor[SLA Risk Prediction Model]
        AISvc --> VectorStore[FAISS Vector Store FlatIP]
        AISvc --> LocalLLM[Local Ollama Qwen2.5 3B LLM]
        KBSvc -->|Chunking & Ingestion| VectorStore
    end
```

---

## 2. Multi-Tenant Organization Isolation

Every critical entity in the system (`User`, `Ticket`, `Category`, `SLAPolicy`, `KnowledgeArticle`, `AuditLog`) is strictly scoped by `org_id` (UUID).

1. **Authentication Claims**: Upon authentication (`/api/v1/auth/login`), the JWT payload encapsulates `sub` (User ID), `org_id`, and `roles`.
2. **Access Control Verification**: Every repository query automatically enforces `WHERE org_id = current_user.org_id`.
3. **Cross-Tenant Guard**: Mismatched organization requests by non-SysAdmin users immediately trigger `403 Forbidden: Cross-organization access forbidden`.
4. **Vector Search Isolation**: In `KnowledgeVectorStore`, search queries accept the caller's `org_id`. Candidate vectors originating from other organizations are strictly discarded during similarity ranking.

---

## 3. Ticket Workflow State Machine

The ticket lifecycle follows an audited state machine preventing illegal status jumps:

```mermaid
stateDiagram-v2
    [*] --> NEW: User Submits Ticket
    NEW --> ASSIGNED: Lead/Agent Assigns
    NEW --> IN_PROGRESS: Agent Commences Work
    NEW --> CLOSED: Canceled/Duplicate
    
    ASSIGNED --> IN_PROGRESS: Agent Investigates
    ASSIGNED --> CLOSED: Invalid
    
    IN_PROGRESS --> PENDING_CUSTOMER: Awaiting User Input
    PENDING_CUSTOMER --> IN_PROGRESS: User Replies
    
    IN_PROGRESS --> RESOLVED: Fix Deployed
    PENDING_CUSTOMER --> RESOLVED: Issue Resolved
    
    RESOLVED --> CLOSED: User/System Confirms Closure
    RESOLVED --> REOPENED: Issue Still Persists
    CLOSED --> REOPENED: Within Reopen Window
    REOPENED --> ASSIGNED: Re-assigned to Queue
    REOPENED --> IN_PROGRESS: Direct Investigation
```

Every transition records an immutable `TicketEvent` in `ticket_events` capturing the actor, previous state, new state, notes, and UTC timestamp.

---

## 4. Local RAG Pipeline Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Agent as Support Agent
    participant UI as React Ticket Workspace
    participant API as FastAPI Backend
    participant RAG as Local RAG Service
    participant FAISS as FAISS Vector Store
    participant Ollama as Local Ollama Qwen2.5 3B

    Agent->>UI: Clicks "Insert AI Solution Draft"
    UI->>API: POST /api/v1/ai/assist (query: Ticket text)
    API->>RAG: generate_response(query, org_id, role)
    RAG->>FAISS: search(query_vector, org_id, top_k=3)
    FAISS-->>RAG: Return top matching chunks & scores
    alt Sufficient Evidence Found
        RAG->>Ollama: POST /api/generate (Context + Query + Grounding Prompt)
        Ollama-->>RAG: Synthesized grounded draft with [Source ID] citations
        RAG-->>API: Response + Verified Citations + Execution Time
    else Insufficient Evidence / Low Similarity
        RAG-->>API: Explicit "Insufficient evidence in approved knowledge articles"
    end
    API-->>UI: Return AIAssistResponse
    UI->>Agent: Pre-fills draft in response composer
```
