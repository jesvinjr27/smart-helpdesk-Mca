from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class CitationItem(BaseModel):
    chunk_id: Optional[str] = None
    article_id: Optional[str] = None
    article_title: str
    similarity_score: float


class AIPredictionResponse(BaseModel):
    id: str
    ticket_id: str
    model_name: str
    model_version: str
    predicted_category_id: Optional[str] = None
    predicted_category_name: Optional[str] = None
    predicted_priority: str
    confidence_scores: Dict[str, float]
    rationale: Optional[str] = None
    execution_time_ms: float
    created_at: datetime


class SimilarTicketItem(BaseModel):
    id: str
    ticket_number: str
    title: str
    status: str
    priority: str
    category_name: Optional[str] = None
    similarity_score: float


class SimilarTicketsResponse(BaseModel):
    ticket_id: str
    similar_tickets: List[SimilarTicketItem]
    total_found: int
    execution_time_ms: float


class TicketSummaryRequest(BaseModel):
    max_sentences: int = Field(default=3, ge=1, le=10)


class TicketSummaryResponse(BaseModel):
    ticket_id: str
    summary: str
    key_points: List[str]
    sentence_count: int
    compression_ratio: float
    model_used: str = "extractive_sentence_ranker"
    execution_time_ms: float


class AISearchRequest(BaseModel):
    query: str
    top_k: int = Field(default=4, ge=1, le=10)


class AISearchResultItem(BaseModel):
    chunk_id: Optional[str] = None
    article_id: str
    article_title: str
    content: str
    similarity_score: float
    visibility: str


class AISearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[AISearchResultItem]
    execution_time_ms: float


class AIAssistRequest(BaseModel):
    query: Optional[str] = None
    description: Optional[str] = None
    ticket_id: Optional[str] = None
    tone: Optional[str] = "professional"


class AIAssistResponse(BaseModel):
    suggested_response: str
    citations: List[CitationItem]
    model_used: str
    confidence: float
    grounded: bool
    execution_time_ms: float
    note: Optional[str] = None


class AIFeedbackCreate(BaseModel):
    prediction_id: str
    is_category_accepted: Optional[bool] = None
    corrected_category_id: Optional[str] = None
    is_priority_accepted: Optional[bool] = None
    corrected_priority: Optional[str] = None
    feedback_notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)


class KnowledgeIngestRequest(BaseModel):
    rebuild_index: bool = True


class KnowledgeIngestResponse(BaseModel):
    job_id: str
    status: str  # PENDING, PROCESSING, COMPLETED, FAILED
    total_articles: int
    total_chunks: int
    message: str


class AIComponentStatus(BaseModel):
    component_name: str
    engine_type: str
    version: str
    status: str
    memory_footprint: str
    metrics: Dict[str, Any]
    description: str


class AIAdminModelsResponse(BaseModel):
    category_classifier: Dict[str, Any]
    sla_risk_predictor: Dict[str, Any]
    rag_retrieval: Dict[str, Any]
    small_llm: Dict[str, Any]
