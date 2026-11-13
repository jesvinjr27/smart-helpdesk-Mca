import time
import logging
from typing import Dict, Any, List, Optional
import httpx

from ai.retrieval.vector_store import KnowledgeVectorStore

logger = logging.getLogger(__name__)


class LocalRAGService:
    def __init__(
        self,
        ollama_base_url: str = "http://localhost:11434",
        ollama_model: str = "qwen2.5:3b",
        vector_store: Optional[KnowledgeVectorStore] = None
    ):
        self.ollama_base_url = ollama_base_url.rstrip("/")
        self.ollama_model = ollama_model
        self.vector_store = vector_store or KnowledgeVectorStore()

    async def generate_response(
        self,
        query: str,
        org_id: str,
        user_role: str = "REQUESTER",
        top_k: int = 3,
        tone: str = "professional"
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Retrieve authorized knowledge chunks
        chunks = self.vector_store.search(
            query=query,
            org_id=org_id,
            user_role=user_role,
            top_k=top_k,
            min_score=0.20
        )
        
        citations = []
        context_blocks = []
        for c in chunks:
            citations.append({
                "chunk_id": c["chunk_id"],
                "article_id": c["article_id"],
                "article_title": c["article_title"],
                "similarity_score": c["similarity_score"]
            })
            context_blocks.append(
                f"[Source ID: {c['chunk_id']} | Article: {c['article_title']}]\n{c['content']}"
            )
            
        context_text = "\n\n---\n\n".join(context_blocks)
        
        # 2. Check if any evidence was retrieved
        if not chunks:
            execution_time = (time.time() - start_time) * 1000
            return {
                "suggested_response": (
                    "Insufficient evidence in approved knowledge articles to answer this request. "
                    "Please escalate this ticket to a human support agent."
                ),
                "citations": [],
                "model_used": "evidence_verification_gate",
                "confidence": 0.0,
                "grounded": True,
                "execution_time_ms": round(execution_time, 2),
                "note": "No authorized knowledge articles matched the query above similarity threshold."
            }

        # 3. Formulate strict grounding prompt for Ollama
        system_prompt = (
            "You are the AI Helpdesk Copilot for Smart Help Desk. "
            "You provide technical assistance by strictly following the retrieved approved knowledge articles.\n"
            "CRITICAL INSTRUCTIONS:\n"
            "1. Base your answer EXCLUSIVELY on the provided Context below.\n"
            "2. Never fabricate facts, URLs, port numbers, or instructions not found in the Context.\n"
            "3. If the context does not contain enough info, state clearly that information is insufficient.\n"
            "4. Always cite the Source ID in brackets (e.g. [Source ID: ...]).\n"
            f"5. Maintain a {tone} tone."
        )
        
        user_prompt = f"Context:\n{context_text}\n\nUser Question/Ticket:\n{query}\n\nResolution Draft:"
        
        # 4. Attempt call to local Ollama service
        ollama_endpoint = f"{self.ollama_base_url}/api/generate"
        payload = {
            "model": self.ollama_model,
            "prompt": f"{system_prompt}\n\n{user_prompt}",
            "stream": False,
            "options": {
                "temperature": 0.2,
                "top_p": 0.8,
                "num_predict": 400
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(ollama_endpoint, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    response_text = data.get("response", "").strip()
                    execution_time = (time.time() - start_time) * 1000
                    return {
                        "suggested_response": response_text,
                        "citations": citations,
                        "model_used": f"ollama/{self.ollama_model}",
                        "confidence": round(float(chunks[0]["similarity_score"]), 2),
                        "grounded": True,
                        "execution_time_ms": round(execution_time, 2),
                        "note": "Response synthesized by local Ollama LLM and grounded in local KB."
                    }
        except Exception as e:
            logger.info(f"Ollama local inference unavailable ({e}). Utilizing grounded fallback.")

        # 5. Grounded Fallback: Synthesize structured draft from top matching knowledge chunk
        top_match = chunks[0]
        fallback_draft = (
            f"Based on approved article '{top_match['article_title']}' [Source ID: {top_match['chunk_id']}]:\n\n"
            f"{top_match['content']}\n\n"
            f"Please verify these steps with the requester. If the problem persists, escalate to team lead."
        )
        
        execution_time = (time.time() - start_time) * 1000
        return {
            "suggested_response": fallback_draft,
            "citations": citations,
            "model_used": "local_vector_grounded_draft",
            "confidence": round(float(top_match["similarity_score"]), 2),
            "grounded": True,
            "execution_time_ms": round(execution_time, 2),
            "note": "Grounded response retrieved directly from local vector store (Ollama offline/standby)."
        }
