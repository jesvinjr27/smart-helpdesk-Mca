from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.db.session import get_db
from backend.app.ai.gateway import ai_gateway
from backend.app.core.config import settings

router = APIRouter(tags=["Health & Diagnostics"])


@router.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }


@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # Check DB
    db_status = "UP"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"DOWN: {str(e)}"

    # Check Hybrid AI Subsystem
    diag = ai_gateway.get_diagnostics()
    cat_loaded = diag["category_classifier"]["status"] == "ACTIVE"
    sla_loaded = diag["sla_risk_predictor"]["status"] == "ACTIVE"

    return {
        "status": "ready" if db_status == "UP" else "degraded",
        "database": db_status,
        "vector_store": {
            "status": "READY",
            "total_vectors": diag["rag_retrieval"]["metrics"].get("total_articles_indexed", 0)
        },
        "ml_models": {
            "category_classifier": "LOADED" if cat_loaded else "HEURISTIC",
            "sla_risk_model": "LOADED" if sla_loaded else "HEURISTIC"
        },
        "ai_subsystem": {
            "architecture": "4GB_Hybrid_AI_v2",
            "llm_provider": diag["small_llm"]["provider"],
            "llm_status": diag["small_llm"]["status"]
        }
    }
