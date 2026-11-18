import pytest
from backend.app.ai.gateway import ai_gateway
from backend.app.ai.ml.classifier import TicketClassifier
from backend.app.ai.ml.priority import PriorityRecommender
from backend.app.ai.ml.sla import SLARiskPredictor
from backend.app.ai.ml.similar import find_similar_tickets
from backend.app.ai.rag.indexer import TFIDFKnowledgeIndexer
from backend.app.ai.rag.synthesizer import GroundedSynthesizer
from backend.app.ai.llm.factory import get_llm_provider


def test_category_classifier_inference():
    classifier = TicketClassifier()
    res = classifier.classify(
        title="GlobalProtect VPN connection failed with error code 403",
        description="Cannot connect to corporate VPN from home. GlobalProtect gives 403 forbidden error."
    )
    assert res["predicted_category_name"] == "Network & VPN"
    assert res["confidence_scores"]["Network & VPN"] > 0.20
    assert res["execution_time_ms"] < 50.0, "CPU inference must be under 50ms"
    assert "ML Classifier" in res["rationale"] or "Deterministic Rule" in res["rationale"]


def test_deterministic_emergency_escalation():
    classifier = TicketClassifier()
    res = classifier.classify(
        title="Total system outage and data loss in production database",
        description="All web servers are down and data loss is imminent due to power failure."
    )
    recommender = PriorityRecommender()
    prio_res = recommender.recommend(
        title="Total system outage and data loss in production database",
        description="All web servers are down and data loss is imminent due to power failure.",
        predicted_category=res["predicted_category_name"]
    )
    assert prio_res["recommended_priority"] == "CRITICAL"
    assert "Emergency protocol" in prio_res["rationale"]


def test_sla_risk_prediction():
    sla_predictor = SLARiskPredictor()
    # Warmup once to avoid cold-start pandas DataFrame import overhead
    _ = sla_predictor.predict_risk(priority="LOW", category="General")
    res = sla_predictor.predict_risk(
        priority="CRITICAL",
        category="Network & VPN",
        created_hour=23,
        is_weekend=1,
        initial_queue=35,
        desc_length=300
    )
    assert 0.0 <= res["risk_score"] <= 1.0
    assert res["risk_level"] in ["HIGH", "CRITICAL"]
    assert len(res["risk_factors"]) >= 2
    assert res["execution_time_ms"] < 25.0


def test_similar_tickets_detection():
    candidates = [
        {"id": "t-1", "ticket_number": "TK-1001", "title": "VPN connection 403 error", "description": "GlobalProtect failed to reach portal"},
        {"id": "t-2", "ticket_number": "TK-1002", "title": "Broken laptop hinge Dell XPS", "description": "Hardware issue screen won't close"},
        {"id": "t-3", "ticket_number": "TK-1003", "title": "VPN gateway unreachable", "description": "Timeout 403 connecting to Palo Alto"}
    ]
    res = find_similar_tickets("VPN 403 error in GlobalProtect", candidates, top_k=2)
    assert res["total_found"] >= 1
    assert res["similar_tickets"][0]["id"] in ["t-1", "t-3"]
    assert res["execution_time_ms"] < 30.0


def test_extractive_conversation_summarizer():
    thread_text = (
        "User reported Outlook email cannot connect to server on Windows 11. "
        "The error code 500 occurred repeatedly after updating multi-factor authentication. "
        "Support agent verified the password and cleared credential manager cache. "
        "The user restarted Outlook and confirmed email syncing is fully restored."
    )
    res = ai_gateway.summarize_ticket(thread_text, max_sentences=2)
    assert res["sentence_count"] <= 2
    assert len(res["key_points"]) <= 2
    assert res["compression_ratio"] > 0.0
    assert res["execution_time_ms"] < 25.0


def test_rag_anti_hallucination_evidence_gate():
    synthesizer = GroundedSynthesizer()
    # No matching evidence
    res = synthesizer.synthesize(
        query="What is the nuclear launch code?",
        retrieved_chunks=[]
    )
    assert "Insufficient evidence" in res["suggested_response"]
    assert res["citations"] == []
    assert res["grounded"] is True


def test_rag_grounded_citation_synthesis():
    synthesizer = GroundedSynthesizer()
    mock_chunks = [{
        "chunk_id": "chunk-art-1-0",
        "article_id": "art-1",
        "article_title": "GlobalProtect VPN Troubleshooting",
        "content": "Step 1: Open GlobalProtect Settings. Step 2: Clear cache. Step 3: Re-enter corporate credentials.",
        "similarity_score": 0.88,
        "visibility": "PUBLIC"
    }]
    res = synthesizer.synthesize(
        query="How do I troubleshoot VPN?",
        retrieved_chunks=mock_chunks,
        ticket_title="VPN Issue"
    )
    assert len(res["citations"]) == 1
    assert res["citations"][0]["article_title"] == "GlobalProtect VPN Troubleshooting"
    assert "GlobalProtect" in res["suggested_response"]
    assert res["grounded"] is True


def test_small_llm_provider_fallback():
    provider = get_llm_provider()
    info = provider.get_info()
    assert info["provider"] in ["disabled", "small_http"]
    res = provider.generate_response(prompt="Hello", context="Sample troubleshooting content.")
    assert "text" in res
    assert res["grounded"] is True


def test_ai_gateway_diagnostics():
    diag = ai_gateway.get_diagnostics()
    assert "category_classifier" in diag
    assert "sla_risk_predictor" in diag
    assert "rag_retrieval" in diag
    assert "small_llm" in diag
    assert diag["category_classifier"]["status"] == "ACTIVE"
    assert diag["sla_risk_predictor"]["status"] == "ACTIVE"
