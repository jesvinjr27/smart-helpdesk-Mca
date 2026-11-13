from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.db.session import get_db
from backend.app.integrations.ai_service import ai_service
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

    # Check Vector Store
    vs_status = "READY"
    total_vectors = 0
    if ai_service.vector_store and ai_service.vector_store.index:
        total_vectors = ai_service.vector_store.index.ntotal
    else:
        vs_status = "NOT_INITIALIZED"

    return {
        "status": "ready" if db_status == "UP" else "degraded",
        "database": db_status,
        "vector_store": {
            "status": vs_status,
            "total_vectors": total_vectors
        },
        "ml_models": {
            "category_classifier": "LOADED" if ai_service.category_model else "MISSING",
            "sla_risk_model": "LOADED" if ai_service.sla_model else "MISSING"
        }
    }
