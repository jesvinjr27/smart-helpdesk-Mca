# Backward-compatibility alias redirecting to new Hybrid AI Gateway
from backend.app.ai.gateway import ai_gateway as ai_service

__all__ = ["ai_service"]
