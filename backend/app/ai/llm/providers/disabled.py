import re
import time
from typing import Dict, Any, Optional, List

from backend.app.ai.llm.base import BaseLLMProvider


class DisabledLLMProvider(BaseLLMProvider):
    """
    Default Zero-Memory Provider for 4 GB RAM systems.
    - Used when LLM is disabled (default) or offline.
    - Performs instant deterministic extractive synthesis and summarization (< 1 ms on CPU).
    - Requires 0 MB extra RAM and zero external servers.
    """

    def is_available(self) -> bool:
        return True

    def get_info(self) -> Dict[str, Any]:
        return {
            "provider": "disabled",
            "model_name": "Deterministic-Grounded-Synthesizer",
            "status": "STANDBY / 4GB_OPTIMIZED",
            "memory_footprint": "0 MB",
            "description": "Deterministic CPU synthesis; small LLM remains disabled to conserve RAM."
        }

    def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        context: Optional[str] = None,
        max_tokens: int = 256
    ) -> Dict[str, Any]:
        t0 = time.time()
        if not context:
            return {
                "text": "Insufficient evidence in approved knowledge articles to answer this request.",
                "model_used": "disabled/grounded_template",
                "grounded": True,
                "execution_time_ms": round((time.time() - t0) * 1000, 2)
            }

        # Format context cleanly
        response_text = (
            f"Hello,\n\n"
            f"Based on our approved knowledge base articles, here are the recommended resolution steps:\n\n"
            f"{context.strip()}\n\n"
            f"Please verify if these steps resolve your issue. If you still encounter problems, reply directly for human agent escalation."
        )
        return {
            "text": response_text,
            "model_used": "disabled/grounded_synthesizer",
            "grounded": True,
            "execution_time_ms": round((time.time() - t0) * 1000, 2)
        }

    def summarize_thread(
        self,
        thread_text: str,
        max_sentences: int = 3
    ) -> Dict[str, Any]:
        """Extractive frequency-weighted sentence ranker."""
        t0 = time.time()
        bounded = (thread_text or "").strip()[:1500]
        if not bounded:
            return {
                "summary": "No conversation content available to summarize.",
                "key_points": [],
                "sentence_count": 0,
                "compression_ratio": 0.0,
                "model_used": "extractive_ranker",
                "execution_time_ms": 0.0
            }

        raw_sents = re.split(r'(?<=[.!?])\s+', bounded)
        sentences = [s.strip() for s in raw_sents if len(s.strip()) > 10]

        if len(sentences) <= max_sentences:
            return {
                "summary": " ".join(sentences),
                "key_points": sentences,
                "sentence_count": len(sentences),
                "compression_ratio": 1.0,
                "model_used": "extractive_ranker",
                "execution_time_ms": round((time.time() - t0) * 1000, 2)
            }

        # Score by word frequency + position
        words = re.findall(r'\b[a-zA-Z]{3,}\b', bounded.lower())
        freq: Dict[str, float] = {}
        for w in words:
            freq[w] = freq.get(w, 0.0) + 1.0

        scores = []
        for idx, s in enumerate(sentences):
            s_words = re.findall(r'\b[a-zA-Z]{3,}\b', s.lower())
            score = sum(freq.get(w, 0.0) for w in s_words) / max(1, len(s_words))
            weight = 1.0 if idx == 0 else (0.85 if idx == 1 else 0.70)
            scores.append((score * weight, idx, s))

        top = sorted(scores, key=lambda x: x[0], reverse=True)[:max_sentences]
        ordered = sorted(top, key=lambda x: x[1])

        summary_text = " ".join([item[2] for item in ordered])
        compression = round(1.0 - (len(summary_text) / max(1, len(bounded))), 2)

        return {
            "summary": summary_text,
            "key_points": [item[2] for item in ordered],
            "sentence_count": len(ordered),
            "compression_ratio": max(0.0, compression),
            "model_used": "extractive_ranker",
            "execution_time_ms": round((time.time() - t0) * 1000, 2)
        }
