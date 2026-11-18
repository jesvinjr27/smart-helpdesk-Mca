import time
from typing import Dict, Any, Optional

from backend.app.ai.ml.classifier import CRITICAL_SAFETY_KEYWORDS, HIGH_SAFETY_KEYWORDS


class PriorityRecommender:
    """
    Explainable Multi-Signal Priority Recommendation Engine.
    Combines rule-based safety triggers with classifier confidence and queue context.
    - Zero heavy model dependencies.
    - Latency: < 1 ms on CPU.
    """

    def recommend(
        self,
        title: str,
        description: str,
        predicted_category: Optional[str] = None,
        requester_role: str = "REQUESTER",
        queue_depth: int = 0
    ) -> Dict[str, Any]:
        t0 = time.time()
        combined = f"{title or ''} {description or ''}".lower()

        priority = "MEDIUM"
        rationale_items = []

        # 1. Deterministic safety triggers
        if any(kw in combined for kw in CRITICAL_SAFETY_KEYWORDS):
            priority = "CRITICAL"
            rationale_items.append("Emergency protocol: critical operational/safety keyword detected.")
        elif any(kw in combined for kw in HIGH_SAFETY_KEYWORDS):
            priority = "HIGH"
            rationale_items.append("Urgent workflow keyword detected.")

        # 2. Category-based adjustment
        if priority == "MEDIUM":
            if predicted_category in ["Network & VPN", "Access & Identity Management"]:
                if "error" in combined or "cannot" in combined or "failed" in combined:
                    priority = "HIGH"
                    rationale_items.append(f"Work stoppage risk in {predicted_category}.")
            elif predicted_category in ["Hostel & Facilities", "Human Resources & Benefits"]:
                if not any(k in combined for k in ["urgent", "immediately", "hazard"]):
                    priority = "LOW"
                    rationale_items.append(f"Standard operational priority for {predicted_category}.")

        # 3. Queue backlog context
        if queue_depth > 30 and priority == "HIGH":
            rationale_items.append(f"Heavy queue backlog ({queue_depth} tickets pending).")

        if not rationale_items:
            rationale_items.append("Standard business priority triage based on ticket description.")

        exec_ms = round((time.time() - t0) * 1000, 2)
        return {
            "recommended_priority": priority,
            "rationale": " ".join(rationale_items),
            "execution_time_ms": exec_ms
        }
