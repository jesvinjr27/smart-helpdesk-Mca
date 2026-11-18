import time
import logging
from typing import Dict, Any, Optional
import httpx

from backend.app.core.config import settings
from backend.app.ai.llm.base import BaseLLMProvider
from backend.app.ai.llm.providers.disabled import DisabledLLMProvider

logger = logging.getLogger(__name__)


class SmallModelHTTPProvider(BaseLLMProvider):
    """
    Lightweight HTTP Provider for Small Local LLMs:
    - Qwen2.5 0.5B Instruct (~350 MB RAM in 4-bit)
    - SmolLM2 360M Instruct (~250 MB RAM in 4-bit)
    - Connects to local llama-server, Ollama, or OpenAI-compatible endpoint.
    - Strict 2.5s timeout with automatic fallback to DisabledLLMProvider.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: float = 2.5
    ):
        self.base_url = (base_url or settings.AI_LLM_BASE_URL).rstrip("/")
        self.model_name = model_name or settings.AI_LLM_MODEL
        self.timeout = timeout
        self.fallback = DisabledLLMProvider()

    def is_available(self) -> bool:
        try:
            with httpx.Client(timeout=0.5) as client:
                res = client.get(f"{self.base_url}/api/version")
                return res.status_code == 200
        except Exception:
            return False

    def get_info(self) -> Dict[str, Any]:
        return {
            "provider": "small_http",
            "model_name": self.model_name,
            "base_url": self.base_url,
            "status": "ONLINE" if self.is_available() else "STANDBY / OFFLINE",
            "memory_footprint": "~350 MB (External process)",
            "description": f"Lightweight instruction model ({self.model_name}) running on CPU."
        }

    def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        context: Optional[str] = None,
        max_tokens: int = 256
    ) -> Dict[str, Any]:
        t0 = time.time()
        sys_p = system_prompt or (
            "You are the AI Helpdesk Assistant. Base your answer strictly on the provided Context. "
            "Be direct, polite, and technical. Do not fabricate facts."
        )
        full_prompt = f"Context:\n{context or 'No context.'}\n\nUser Question:\n{prompt}\n\nHelpful Resolution Draft:"

        try:
            with httpx.Client(timeout=self.timeout) as client:
                # Try OpenAI-compatible /v1/chat/completions first
                payload = {
                    "model": self.model_name,
                    "messages": [
                        {"role": "system", "content": sys_p},
                        {"role": "user", "content": full_prompt}
                    ],
                    "max_tokens": min(max_tokens, settings.AI_LLM_MAX_TOKENS),
                    "temperature": 0.2
                }
                resp = client.post(f"{self.base_url}/v1/chat/completions", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    return {
                        "text": content,
                        "model_used": f"small_http/{self.model_name}",
                        "grounded": True,
                        "execution_time_ms": round((time.time() - t0) * 1000, 2)
                    }

                # Try /api/generate fallback (e.g. Ollama syntax)
                ollama_payload = {
                    "model": self.model_name,
                    "prompt": f"{sys_p}\n\n{full_prompt}",
                    "stream": False,
                    "options": {"num_predict": max_tokens, "temperature": 0.2}
                }
                resp_o = client.post(f"{self.base_url}/api/generate", json=ollama_payload)
                if resp_o.status_code == 200:
                    text = resp_o.json().get("response", "").strip()
                    if text:
                        return {
                            "text": text,
                            "model_used": f"small_http/{self.model_name}",
                            "grounded": True,
                            "execution_time_ms": round((time.time() - t0) * 1000, 2)
                        }
        except Exception as e:
            logger.debug(f"Small LLM HTTP call unavailable ({e}). Gracefully falling back to deterministic synthesis.")

        # Fallback to deterministic synthesis
        return self.fallback.generate_response(prompt, system_prompt, context, max_tokens)

    def summarize_thread(
        self,
        thread_text: str,
        max_sentences: int = 3
    ) -> Dict[str, Any]:
        t0 = time.time()
        prompt = (
            f"Summarize the following support conversation thread into {max_sentences} concise bullet points. "
            f"Focus on the root problem, actions taken, and current status.\n\n"
            f"Conversation:\n{thread_text[:1200]}\n\nSummary:"
        )

        try:
            with httpx.Client(timeout=self.timeout) as client:
                payload = {
                    "model": self.model_name,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 150,
                    "temperature": 0.1
                }
                resp = client.post(f"{self.base_url}/v1/chat/completions", json=payload)
                if resp.status_code == 200:
                    summary_text = resp.json()["choices"][0]["message"]["content"].strip()
                    points = [p.strip("- *").strip() for p in summary_text.split("\n") if p.strip()]
                    return {
                        "summary": summary_text,
                        "key_points": points[:max_sentences],
                        "sentence_count": len(points[:max_sentences]),
                        "compression_ratio": round(1.0 - (len(summary_text) / max(1, len(thread_text))), 2),
                        "model_used": f"small_http/{self.model_name}",
                        "execution_time_ms": round((time.time() - t0) * 1000, 2)
                    }
        except Exception:
            pass

        return self.fallback.summarize_thread(thread_text, max_sentences)
