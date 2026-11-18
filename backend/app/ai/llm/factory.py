import threading
from typing import Optional

from backend.app.core.config import settings
from backend.app.ai.llm.base import BaseLLMProvider
from backend.app.ai.llm.providers.disabled import DisabledLLMProvider
from backend.app.ai.llm.providers.small_http import SmallModelHTTPProvider

_PROVIDER_INSTANCE: Optional[BaseLLMProvider] = None
_LOCK = threading.Lock()


def get_llm_provider() -> BaseLLMProvider:
    """
    Lazy factory returning the configured Small Local LLM provider.
    - If AI_LLM_ENABLED is False (default), returns DisabledLLMProvider.
    - Avoids loading any model into memory unless explicitly enabled.
    """
    global _PROVIDER_INSTANCE
    if _PROVIDER_INSTANCE is not None:
        return _PROVIDER_INSTANCE

    with _LOCK:
        if _PROVIDER_INSTANCE is not None:
            return _PROVIDER_INSTANCE

        if not settings.AI_LLM_ENABLED or settings.AI_LLM_PROVIDER == "disabled":
            _PROVIDER_INSTANCE = DisabledLLMProvider()
        elif settings.AI_LLM_PROVIDER in ["small_http", "ollama", "llama_server"]:
            _PROVIDER_INSTANCE = SmallModelHTTPProvider(
                base_url=settings.AI_LLM_BASE_URL,
                model_name=settings.AI_LLM_MODEL
            )
        else:
            _PROVIDER_INSTANCE = DisabledLLMProvider()

        return _PROVIDER_INSTANCE
