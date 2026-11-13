import os
import time
import json
import logging
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
import httpx

from backend.app.core.config import settings
from ai.retrieval.vector_store import KnowledgeVectorStore
from ai.rag.rag_service import LocalRAGService

logger = logging.getLogger(__name__)

CRITICAL_SAFETY_KEYWORDS = [
    "server down", "outage", "data loss", "security breach",
    "ransomware", "fire", "leakage", "production down", "emergency", "system crash"
]

HIGH_SAFETY_KEYWORDS = [
    "vpn connection failed", "account locked", "cannot access", "exam portal down", "tuition payment"
]


class AIServiceIntegration:
    def __init__(self):
        self.category_model = None
        self.sla_model = None
        self.vector_store = KnowledgeVectorStore(index_dir=settings.AI_FAISS_INDEX_DIR)
        self.rag_service = LocalRAGService(
            ollama_base_url=settings.OLLAMA_BASE_URL,
            ollama_model=settings.OLLAMA_MODEL,
            vector_store=self.vector_store
        )
        self._load_models()

    def _load_models(self):
        # Load category classification model
        if os.path.exists(settings.AI_CLASSIFICATION_MODEL_PATH):
            try:
                self.category_model = joblib.load(settings.AI_CLASSIFICATION_MODEL_PATH)
                logger.info(f"Loaded category classifier from {settings.AI_CLASSIFICATION_MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load category model: {e}")

        # Load SLA risk prediction model
        if os.path.exists(settings.AI_SLA_MODEL_PATH):
            try:
                self.sla_model = joblib.load(settings.AI_SLA_MODEL_PATH)
                logger.info(f"Loaded SLA risk model from {settings.AI_SLA_MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load SLA model: {e}")

    def predict_category_and_priority(
        self,
        title: str,
        description: str,
        categories_map: Dict[str, str]  # name -> id
    ) -> Dict[str, Any]:
        start = time.time()
        combined_text = f"{title} {description}"
        lower_text = combined_text.lower()
        
        # 1. Deterministic Priority Safety Rules
        detected_priority = "MEDIUM"
        rationale_tags = []
        
        is_critical = any(kw in lower_text for kw in CRITICAL_SAFETY_KEYWORDS)
        is_high = any(kw in lower_text for kw in HIGH_SAFETY_KEYWORDS)
        
        if is_critical:
            detected_priority = "CRITICAL"
            rationale_tags.append("Deterministic Safety Rule: Critical operational keyword detected")
        elif is_high:
            detected_priority = "HIGH"
            rationale_tags.append("Deterministic Safety Rule: Urgent incident keyword detected")

        # 2. Category Classification using TF-IDF + Logistic Regression
        predicted_category_name = None
        confidence_scores = {}
        
        if self.category_model:
            try:
                probs = self.category_model.predict_proba([combined_text])[0]
                classes = self.category_model.classes_
                for cls, prob in zip(classes, probs):
                    confidence_scores[cls] = round(float(prob), 4)
                
                # Get best class
                best_idx = probs.argmax()
                predicted_category_name = classes[best_idx]
                rationale_tags.append(
                    f"ML Category Classifier: Classified as '{predicted_category_name}' with {confidence_scores[predicted_category_name]*100:.1f}% confidence."
                )
            except Exception as e:
                logger.warning(f"Error during category prediction: {e}")
                
        # Resolve category ID
        predicted_category_id = None
        if predicted_category_name and predicted_category_name in categories_map:
            predicted_category_id = categories_map[predicted_category_name]
        elif categories_map:
            # Fallback to first available category
            first_cat = list(categories_map.keys())[0]
            predicted_category_id = categories_map[first_cat]
            predicted_category_name = first_cat

        exec_time = (time.time() - start) * 1000
        
        return {
            "model_name": "SmartHelpdesk-TFIDF-Classifier",
            "model_version": "v1.0.0",
            "predicted_category_id": predicted_category_id,
            "predicted_category_name": predicted_category_name,
            "predicted_priority": detected_priority,
            "confidence_scores": confidence_scores,
            "rationale": " | ".join(rationale_tags) if rationale_tags else "Standard baseline heuristics",
            "execution_time_ms": round(exec_time, 2)
        }

    def predict_sla_risk(
        self,
        priority: str,
        category: str,
        created_hour: int,
        is_weekend: int,
        initial_queue: int,
        desc_length: int
    ) -> Dict[str, Any]:
        risk_score = 0.25
        risk_level = "LOW"
        risk_factors = []
        suggested_mitigation = "Follow standard operational procedures."
        
        if self.sla_model:
            try:
                sample_df = pd.DataFrame([{
                    "priority": priority,
                    "category": category,
                    "created_hour": created_hour,
                    "is_weekend": is_weekend,
                    "initial_queue": initial_queue,
                    "desc_length": desc_length
                }])
                risk_score = float(self.sla_model.predict_proba(sample_df)[0, 1])
                risk_score = round(risk_score, 4)
            except Exception as e:
                logger.warning(f"Error evaluating SLA risk model: {e}")

        # Determine level and mitigation
        if risk_score >= 0.70:
            risk_level = "CRITICAL"
            risk_factors.append("High probability of SLA breach under current workload and priority")
            suggested_mitigation = "Immediately assign dedicated senior agent and notify team lead."
        elif risk_score >= 0.45:
            risk_level = "HIGH"
            risk_factors.append("Elevated risk due to priority urgency or queue backlog")
            suggested_mitigation = "Prioritize first response within the next 45 minutes."
        elif risk_score >= 0.25:
            risk_level = "MEDIUM"
            risk_factors.append("Moderate turnaround timeline")
            suggested_mitigation = "Maintain standard assignment pacing."
        else:
            risk_level = "LOW"
            risk_factors.append("Low complexity or generous SLA window")
            suggested_mitigation = "Standard queue processing."
            
        return {
            "model_name": "SLARiskPredictor-v1",
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "suggested_mitigation": suggested_mitigation
        }

    async def check_ollama_health(self) -> Dict[str, Any]:
        endpoint = f"{settings.OLLAMA_BASE_URL}/api/version"
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(endpoint)
                if res.status_code == 200:
                    return {"status": "ONLINE", "version": res.json().get("version", "unknown")}
        except Exception:
            pass
        return {"status": "STANDBY / OFFLINE", "detail": "Local Ollama service not responding on port 11434"}

    def get_model_status_summary(self) -> Dict[str, Any]:
        cat_metrics_file = os.path.join(settings.AI_FAISS_INDEX_DIR, "category_classifier_metrics.json")
        sla_metrics_file = os.path.join(settings.AI_FAISS_INDEX_DIR, "sla_risk_model_metrics.json")
        
        cat_metrics = {}
        if os.path.exists(cat_metrics_file):
            with open(cat_metrics_file, "r") as f:
                cat_metrics = json.load(f)
                
        sla_metrics = {}
        if os.path.exists(sla_metrics_file):
            with open(sla_metrics_file, "r") as f:
                sla_metrics = json.load(f)

        return {
            "category_classifier": {
                "model_name": "SmartHelpdesk-TFIDF-Classifier",
                "model_type": "TF-IDF + Logistic Regression",
                "version": "1.0.0",
                "status": "ACTIVE" if self.category_model else "UNINITIALIZED",
                "metrics": cat_metrics,
                "description": "Multi-class ticket classification for IT, Network, Access, Hardware, and LMS categories."
            },
            "sla_risk_predictor": {
                "model_name": "SLARiskPredictor-v1",
                "model_type": "Logistic Regression (Balanced)",
                "version": "1.0.0",
                "status": "ACTIVE" if self.sla_model else "UNINITIALIZED",
                "metrics": sla_metrics,
                "description": "Predicts probability of SLA breach based on arrival hour, priority, category, and queue depth."
            },
            "rag_retrieval": {
                "model_name": "FAISS-IndexFlatIP",
                "model_type": "Dense Vector Search (Cosine Similarity)",
                "version": "1.0.0",
                "status": "ACTIVE" if (self.vector_store.index and self.vector_store.index.ntotal > 0) else "EMPTY",
                "metrics": {
                    "total_vectors": self.vector_store.index.ntotal if self.vector_store.index else 0,
                    "dimension": self.vector_store.dimension,
                    "index_type": "IndexFlatIP"
                },
                "description": "Stores and retrieves chunked embeddings of approved knowledge base articles with tenant isolation."
            },
            "ollama_llm": {
                "model_name": settings.OLLAMA_MODEL,
                "model_type": "Local Generative LLM via Ollama",
                "version": "3B",
                "status": "CONFIGURED",
                "metrics": {
                    "base_url": settings.OLLAMA_BASE_URL,
                    "model": settings.OLLAMA_MODEL,
                    "temperature": 0.2
                },
                "description": "Local grounded RAG response generation running completely on-device without external API calls."
            }
        }


# Singleton instance
ai_service = AIServiceIntegration()
