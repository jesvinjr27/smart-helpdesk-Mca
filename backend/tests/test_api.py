import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_and_readiness():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

    ready_resp = client.get("/api/v1/ready")
    assert ready_resp.status_code == 200
    assert ready_resp.json()["database"] == "UP"


def test_auth_login_invalid():
    resp = client.post("/api/v1/auth/login", json={
        "email": "admin@apex.com",
        "password": "WrongPassword!"
    })
    assert resp.status_code == 401


def test_auth_login_and_me():
    # Login as Apex Admin
    resp = client.post("/api/v1/auth/login", json={
        "email": "admin@apex.com",
        "password": "Password123!"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "admin@apex.com"
    assert "ORG_ADMIN" in data["user"]["roles"]

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test /users/me
    me_resp = client.get("/api/v1/users/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "admin@apex.com"
    assert me_resp.json()["org_name"] == "Apex Enterprises Global"


def test_ticket_creation_and_workflow():
    # Login as Alice (Requester in Apex)
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "user.alice@apex.com",
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch categories
    cats_resp = client.get("/api/v1/categories", headers=headers)
    assert cats_resp.status_code == 200
    categories = cats_resp.json()
    assert len(categories) > 0
    cat_id = categories[0]["id"]

    # Create ticket
    new_ticket_payload = {
        "title": "Dual external monitor blinking black screen",
        "description": "Whenever I open Figma or Teams on the second monitor, the screen blinks black for 3 seconds.",
        "category_id": cat_id,
        "priority": "MEDIUM",
        "tags": ["hardware", "monitor"]
    }
    create_resp = client.post("/api/v1/tickets", json=new_ticket_payload, headers=headers)
    assert create_resp.status_code == 200
    ticket_data = create_resp.json()
    ticket_id = ticket_data["id"]
    assert ticket_data["status"] == "NEW"
    assert ticket_data["ticket_number"].startswith("APEX-TK-")
    assert ticket_data["latest_ai_prediction"] is not None

    # Transition ticket: Login as Agent John
    agent_login = client.post("/api/v1/auth/login", json={
        "email": "agent.john@apex.com",
        "password": "Password123!"
    })
    agent_token = agent_login.json()["access_token"]
    agent_headers = {"Authorization": f"Bearer {agent_token}"}

    trans_payload = {
        "status": "IN_PROGRESS",
        "comment": "Investigating display driver version.",
        "is_internal": False
    }
    trans_resp = client.post(f"/api/v1/tickets/{ticket_id}/transition", json=trans_payload, headers=agent_headers)
    assert trans_resp.status_code == 200
    assert trans_resp.json()["status"] == "IN_PROGRESS"

    # Verify comment was added
    comments_resp = client.get(f"/api/v1/tickets/{ticket_id}/comments", headers=agent_headers)
    assert comments_resp.status_code == 200
    comments = comments_resp.json()
    assert any("display driver" in c["content"] for c in comments)


def test_ai_knowledge_search_and_assist():
    # Login as Agent John
    agent_login = client.post("/api/v1/auth/login", json={
        "email": "agent.john@apex.com",
        "password": "Password123!"
    })
    agent_headers = {"Authorization": f"Bearer {agent_login.json()['access_token']}"}

    # Test semantic vector search
    search_payload = {
        "query": "GlobalProtect VPN gateway connection 403",
        "top_k": 3
    }
    search_resp = client.post("/api/v1/ai/knowledge/search", json=search_payload, headers=agent_headers)
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert search_data["total_retrieved"] > 0
    assert any("GlobalProtect" in item["article_title"] for item in search_data["results"])

    # Test AI Assist
    assist_payload = {
        "query": "User cannot connect to corporate VPN from home. What are the troubleshooting steps?",
        "tone": "professional"
    }
    assist_resp = client.post("/api/v1/ai/assist", json=assist_payload, headers=agent_headers)
    assert assist_resp.status_code == 200
    assist_data = assist_resp.json()
    assert len(assist_data["suggested_response"]) > 20
    assert assist_data["grounded"] is True
    assert len(assist_data["citations"]) > 0


def test_dashboard_and_sla():
    agent_login = client.post("/api/v1/auth/login", json={
        "email": "lead.it@apex.com",
        "password": "Password123!"
    })
    headers = {"Authorization": f"Bearer {agent_login.json()['access_token']}"}

    # Summary
    sum_resp = client.get("/api/v1/dashboard/summary", headers=headers)
    assert sum_resp.status_code == 200
    summary = sum_resp.json()
    assert summary["total_tickets"] >= 2
    assert summary["sla_compliance_rate"] >= 0.0

    # Trends
    trends_resp = client.get("/api/v1/dashboard/trends?days=7", headers=headers)
    assert trends_resp.status_code == 200
    trends = trends_resp.json()
    assert "status_distribution" in trends
    assert "priority_distribution" in trends

    # SLA Risks
    sla_resp = client.get("/api/v1/sla/risks", headers=headers)
    assert sla_resp.status_code == 200
    risks = sla_resp.json()
    assert isinstance(risks, list)
    assert len(risks) > 0


def test_admin_ai_models_monitoring():
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@apex.com",
        "password": "Password123!"
    })
    headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    resp = client.get("/api/v1/admin/ai/models", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["category_classifier"]["status"] == "ACTIVE"
    assert data["sla_risk_predictor"]["status"] == "ACTIVE"
    assert data["rag_retrieval"]["status"] == "ACTIVE"
    assert data["rag_retrieval"]["metrics"]["total_vectors"] > 0
