from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class BaseLLMProvider(ABC):
    """
    Abstract interface for Small Local LLM providers.
    All providers must implement non-blocking inference with strict context/output limits.
    """

    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is initialized and ready."""
        pass

    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        """Return diagnostic metadata about the provider and active model."""
        pass

    @abstractmethod
    def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        context: Optional[str] = None,
        max_tokens: int = 256
    ) -> Dict[str, Any]:
        """Generate a response suggestion grounded in provided context."""
        pass

    @abstractmethod
    def summarize_thread(
        self,
        thread_text: str,
        max_sentences: int = 3
    ) -> Dict[str, Any]:
        """Summarize a conversation thread into key problem and status points."""
        pass
