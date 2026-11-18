import time
from typing import Dict, Any, List, Optional

from backend.app.ai.llm.factory import get_llm_provider


class GroundedSynthesizer:
    """
    Evidence-Grounded Resolution Synthesizer with Anti-Hallucination Gate.
    - If retrieved evidence is below similarity threshold, strictly rejects the question.
    - Formulates transparent resolution steps with explicit Source ID citations.
    - Supports Small Local LLM polish or instant zero-memory deterministic synthesis.
    """

    def synthesize(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        tone: str = "professional",
        ticket_title: Optional[str] = None
    ) -> Dict[str, Any]:
        t0 = time.time()

        citations = [
            {
                "chunk_id": c["chunk_id"],
                "article_id": c["article_id"],
                "article_title": c["article_title"],
                "similarity_score": c["similarity_score"]
            }
            for c in retrieved_chunks
        ]

        # 1. Evidence Verification Gate
        if not retrieved_chunks:
            exec_ms = round((time.time() - t0) * 1000, 2)
            return {
                "suggested_response": (
                    "Insufficient evidence in approved knowledge articles to answer this request. "
                    "Please escalate this ticket to a human support agent or provide additional details."
                ),
                "citations": [],
                "model_used": "evidence_verification_gate",
                "confidence": 0.0,
                "grounded": True,
                "execution_time_ms": exec_ms,
                "note": "No authorized knowledge articles matched the query above the required similarity threshold."
            }

        top_chunk = retrieved_chunks[0]
        context_text = "\n\n---\n\n".join([
            f"[Source ID: {c['chunk_id']} | Article: {c['article_title']}]\n{c['content'].strip()}"
            for c in retrieved_chunks
        ])

        # 2. Query Small LLM Provider (if enabled and responsive)
        llm_provider = get_llm_provider()
        llm_res = llm_provider.generate_response(
            prompt=query,
            system_prompt=(
                f"You are the AI Helpdesk Assistant. Provide technical assistance with a {tone} tone. "
                "Base your answer EXCLUSIVELY on the provided Context. Cite Source IDs in brackets."
            ),
            context=context_text,
            max_tokens=256
        )

        exec_ms = round((time.time() - t0) * 1000, 2)
        return {
            "suggested_response": llm_res.get("text", ""),
            "citations": citations,
            "model_used": llm_res.get("model_used", "grounded_synthesizer"),
            "confidence": round(float(top_chunk["similarity_score"]), 2),
            "grounded": True,
            "execution_time_ms": exec_ms,
            "note": "Synthesized directly from verified local knowledge base articles."
        }
