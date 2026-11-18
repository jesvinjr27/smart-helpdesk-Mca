import time
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.ai.ml.classifier import TicketClassifier
from backend.app.ai.ml.priority import PriorityRecommender
from backend.app.ai.ml.sla import SLARiskPredictor
from backend.app.ai.ml.similar import find_similar_tickets
from backend.app.ai.llm.factory import get_llm_provider
from backend.app.ai.rag.retriever import DatabaseKnowledgeRetriever
from backend.app.ai.rag.indexer import TFIDFKnowledgeIndexer
from backend.app.ai.rag.synthesizer import GroundedSynthesizer
from backend.app.ai.monitoring.health import get_ai_diagnostics

logger = logging.getLogger(__name__)


class AIGatewayService:
    """
    Unified Hybrid AI Gateway for Smart Help Desk.
    Engineered for 4 GB RAM, CPU-only environments:
    - Component A: Lightweight Scikit-learn Machine Learning Engine
    - Component B: Small Local LLM Engine (Provider-Based, Optional)
    - Component C: Lightweight Direct-Database RAG Engine (SQL + TF-IDF)
    """

    def __init__(self):
        self.classifier = TicketClassifier()
        self.priority_recommender = PriorityRecommender()
        self.sla_predictor = SLARiskPredictor()
        self.rag_retriever = DatabaseKnowledgeRetriever()
        self.rag_indexer = TFIDFKnowledgeIndexer()
        self.rag_synthesizer = GroundedSynthesizer()

    # =========================================================================
    # Component A: Machine Learning Engine
    # =========================================================================

    def classify_and_prioritize(
        self,
        title: str,
        description: str,
        categories_map: Optional[Dict[str, str]] = None,
        requester_role: str = "REQUESTER",
        queue_depth: int = 0
    ) -> Dict[str, Any]:
        """Classify ticket category and recommend explainable priority in < 5 ms."""
        cat_res = self.classifier.classify(title, description, categories_map)
        prio_res = self.priority_recommender.recommend(
            title=title,
            description=description,
            predicted_category=cat_res["predicted_category_name"],
            requester_role=requester_role,
            queue_depth=queue_depth
        )

        combined_rationale = f"{prio_res['rationale']} | {cat_res['rationale']}".strip(" |")

        return {
            "model_name": cat_res["model_name"],
            "model_version": cat_res["model_version"],
            "predicted_category_id": cat_res["predicted_category_id"],
            "predicted_category_name": cat_res["predicted_category_name"],
            "predicted_priority": prio_res["recommended_priority"],
            "confidence_scores": cat_res["confidence_scores"],
            "rationale": combined_rationale,
            "execution_time_ms": round(cat_res["execution_time_ms"] + prio_res["execution_time_ms"], 2)
        }

    def predict_sla_risk(
        self,
        priority: str,
        category: str,
        created_hour: int = 12,
        is_weekend: int = 0,
        initial_queue: int = 5,
        desc_length: int = 150
    ) -> Dict[str, Any]:
        """Predict probability of SLA breach in < 2 ms."""
        return self.sla_predictor.predict_risk(
            priority=priority,
            category=category,
            created_hour=created_hour,
            is_weekend=is_weekend,
            initial_queue=initial_queue,
            desc_length=desc_length
        )

    def find_similar_tickets(
        self,
        query_text: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 4
    ) -> Dict[str, Any]:
        """Find matching historical tickets within the tenant using TF-IDF Cosine similarity."""
        return find_similar_tickets(query_text, candidates, top_k=top_k)

    # =========================================================================
    # Component B: Small Local LLM / Extractive Summarizer
    # =========================================================================

    def summarize_ticket(self, thread_text: str, max_sentences: int = 3) -> Dict[str, Any]:
        """Summarize ticket conversation thread into core problem and status points."""
        llm_provider = get_llm_provider()
        return llm_provider.summarize_thread(thread_text, max_sentences=max_sentences)

    # =========================================================================
    # Component C: Lightweight RAG Engine
    # =========================================================================

    def search_knowledge(
        self,
        db: Session,
        query: str,
        org_id: str,
        user_role: str = "REQUESTER",
        top_k: int = 4,
        min_score: float = 0.15
    ) -> List[Dict[str, Any]]:
        """Retrieve and rank authorized knowledge articles within the organization."""
        articles = self.rag_retriever.get_authorized_articles(db, org_id=org_id, user_role=user_role)
        return self.rag_indexer.search_articles(query, articles, top_k=top_k, min_score=min_score)

    def generate_assistance(
        self,
        db: Session,
        query: str,
        org_id: str,
        user_role: str = "REQUESTER",
        top_k: int = 3,
        tone: str = "professional",
        ticket_title: Optional[str] = None
    ) -> Dict[str, Any]:
        """Synthesize verified, citation-backed troubleshooting steps."""
        chunks = self.search_knowledge(
            db=db,
            query=query,
            org_id=org_id,
            user_role=user_role,
            top_k=top_k,
            min_score=0.15
        )
        return self.rag_synthesizer.synthesize(
            query=query,
            retrieved_chunks=chunks,
            tone=tone,
            ticket_title=ticket_title
        )

    # =========================================================================
    # Diagnostics & Monitoring
    # =========================================================================

    def get_diagnostics(self, total_articles: int = 0) -> Dict[str, Any]:
        """Return diagnostic health status across all three hybrid components."""
        return get_ai_diagnostics(
            classifier_loaded=(self.classifier.pipeline is not None),
            sla_loaded=(self.sla_predictor.pipeline is not None),
            total_articles_indexed=total_articles
        )

    # =========================================================================
    # Backward-Compatibility Shims for Seamless Legacy Integration
    # =========================================================================

    def predict_category_and_priority(
        self,
        title: str,
        description: str,
        categories_map: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        return self.classify_and_prioritize(title, description, categories_map)

    async def generate_contextual_response(self, *args, **kwargs) -> Dict[str, Any]:
        return self.generate_assistance(*args, **kwargs)

    def get_model_status_summary(self) -> Dict[str, Any]:
        return self.get_diagnostics()

    async def check_ollama_health(self) -> Dict[str, Any]:
        info = get_llm_provider().get_info()
        return {"status": info.get("status", "STANDBY / OPTIONAL"), "version": "0.5b"}


# Global singleton instance
ai_gateway = AIGatewayService()
