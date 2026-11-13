import os
import pytest
import joblib
import pandas as pd
from ai.retrieval.vector_store import KnowledgeVectorStore
from ai.retrieval.chunking import chunk_text
from ai.rag.rag_service import LocalRAGService


def test_chunking_overlap():
    text = (
        "Paragraph 1: Introduction to network routing and DNS configuration.\n\n"
        "Paragraph 2: GlobalProtect VPN settings and port allowances.\n\n"
        "Paragraph 3: Troubleshooting steps for gateway timeouts."
    )
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
    assert len(chunks) >= 2
    assert any("GlobalProtect" in c for c in chunks)


def test_category_classifier_inference():
    model_path = "ai/artifacts/category_classifier.joblib"
    assert os.path.exists(model_path), "Model artifact must exist"
    pipeline = joblib.load(model_path)
    
    test_queries = [
        "GlobalProtect VPN connection failed with error 403",
        "Dell XPS laptop screen flickering violently",
        "Forgot Windows password locked out after 5 attempts"
    ]
    predictions = pipeline.predict(test_queries)
    assert len(predictions) == 3
    probs = pipeline.predict_proba(test_queries)
    assert probs.shape[0] == 3
    assert probs.shape[1] == len(pipeline.classes_)


def test_sla_risk_inference():
    model_path = "ai/artifacts/sla_risk_model.joblib"
    assert os.path.exists(model_path), "SLA model artifact must exist"
    pipeline = joblib.load(model_path)
    
    sample_df = pd.DataFrame([{
        "priority": "CRITICAL",
        "category": "Hardware & Workstation",
        "created_hour": 22,
        "is_weekend": 1,
        "initial_queue": 35,
        "desc_length": 350
    }])
    
    prob = pipeline.predict_proba(sample_df)[0, 1]
    assert 0.0 <= prob <= 1.0
    assert prob > 0.4, "Critical ticket during weekend with large queue should have high risk"


def test_vector_store_tenant_isolation():
    vs = KnowledgeVectorStore(index_dir="ai/artifacts")
    assert vs.index.ntotal > 0, "FAISS index should contain vectors"
    
    # Query with non-existent or specific org_id
    fake_org_results = vs.search(query="GlobalProtect VPN", org_id="non-existent-org-uuid", top_k=5)
    assert len(fake_org_results) == 0, "Cross-org leakage: no results should return for mismatched org"


def test_vector_store_role_permission_isolation():
    vs = KnowledgeVectorStore(index_dir="ai/artifacts")
    if vs.metadata:
        sample_org_id = vs.metadata[0]["org_id"]
        # Search as requester
        requester_results = vs.search(query="VPN", org_id=sample_org_id, user_role="REQUESTER", top_k=5)
        for r in requester_results:
            assert r["visibility"] == "PUBLIC", "Requesters should only retrieve PUBLIC knowledge"


@pytest.mark.asyncio
async def test_rag_insufficient_evidence():
    rag = LocalRAGService()
    # Search with completely unrelated nonsense query that yields no match
    res = await rag.generate_response(
        query="qwertyuiopasdfghjklzxcvbnm1234567890",
        org_id="non-existent-org",
        user_role="REQUESTER"
    )
    assert "Insufficient evidence" in res["suggested_response"]
    assert res["citations"] == []
    assert res["grounded"] is True
