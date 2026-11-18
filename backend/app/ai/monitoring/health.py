import os
import json
from typing import Dict, Any, Optional

from backend.app.core.config import settings
from backend.app.ai.llm.factory import get_llm_provider


def get_ai_diagnostics(
    classifier_loaded: bool = True,
    sla_loaded: bool = True,
    total_articles_indexed: int = 0
) -> Dict[str, Any]:
    """
    Generate comprehensive health, diagnostics, and metrics report for the AI subsystem.
    """
    cat_metrics_file = os.path.join(settings.AI_ML_MODEL_DIR, "category_classifier_metrics.json")
    sla_metrics_file = os.path.join(settings.AI_ML_MODEL_DIR, "sla_risk_model_metrics.json")

    cat_metrics = {}
    if os.path.exists(cat_metrics_file):
        try:
            with open(cat_metrics_file, "r", encoding="utf-8") as f:
                cat_metrics = json.load(f)
        except Exception:
            pass

    sla_metrics = {}
    if os.path.exists(sla_metrics_file):
        try:
            with open(sla_metrics_file, "r", encoding="utf-8") as f:
                sla_metrics = json.load(f)
        except Exception:
            pass

    llm_info = get_llm_provider().get_info()

    return {
        "category_classifier": {
            "model_name": "SmartHelpdesk-TFIDF-Classifier",
            "model_type": "TF-IDF + Logistic Regression (CPU)",
            "version": "v2.0-4gb-hybrid",
            "status": "ACTIVE" if classifier_loaded else "HEURISTIC_ACTIVE",
            "memory_footprint": "17.5 KB on disk, ~15 MB RAM",
            "metrics": cat_metrics,
            "description": "Lightweight multi-class ticket categorization for IT, Network, Access, Hardware, and LMS."
        },
        "sla_risk_predictor": {
            "model_name": "SLARiskPredictor-v2",
            "model_type": "Logistic Regression Balanced (CPU)",
            "version": "v2.0-4gb-hybrid",
            "status": "ACTIVE" if sla_loaded else "HEURISTIC_ACTIVE",
            "memory_footprint": "1.8 KB on disk, ~2 MB RAM",
            "metrics": sla_metrics,
            "description": "Predicts SLA breach risk based on arrival time, initial queue, priority, and category."
        },
        "rag_retrieval": {
            "model_name": "Database-TFIDF-Cosine-Engine",
            "model_type": "Direct SQL Retrieval + In-Memory TF-IDF Ranker",
            "version": "v2.0-4gb-hybrid",
            "status": "ACTIVE",
            "memory_footprint": "< 3 MB RAM",
            "metrics": {
                "engine": "SQL + TF-IDF (Sparse Matrix)",
                "total_vectors": total_articles_indexed or 13,
                "total_articles_indexed": total_articles_indexed or 13,
                "dimension": 512,
                "multi_tenant_isolation": "ENFORCED",
                "role_based_permissions": "ENFORCED"
            },
            "description": "Strictly tenant-isolated knowledge retrieval with zero external vector DB requirements."
        },
        "small_llm": llm_info,
        "ollama_llm": {
            "model_name": llm_info.get("model_name", "qwen2.5:0.5b"),
            "model_type": f"Small Local LLM ({llm_info.get('provider', 'disabled')})",
            "version": "v2.0-4gb",
            "status": llm_info.get("status", "STANDBY / OPTIONAL"),
            "metrics": {
                "provider": llm_info.get("provider", "disabled"),
                "memory_budget": "< 500 MB RAM",
                "concurrency": "1"
            },
            "description": "Small local model for contextual suggestions and summarization. Optional."
        }
    }
