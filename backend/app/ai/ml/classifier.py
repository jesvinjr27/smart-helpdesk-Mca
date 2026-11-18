import os
import time
import logging
from typing import Dict, Any, Optional
import joblib

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

CRITICAL_SAFETY_KEYWORDS = [
    "server down", "outage", "data loss", "security breach",
    "ransomware", "fire", "leakage", "production down", "emergency", "system crash"
]

HIGH_SAFETY_KEYWORDS = [
    "vpn connection failed", "account locked", "cannot access", "exam portal down",
    "tuition payment", "wi-fi disconnecting", "dns failure"
]

CATEGORY_FALLBACK_RULES = {
    "Network & VPN": ["vpn", "wi-fi", "wifi", "dns", "subnet", "router", "gateway", "firewall", "eduroam", "internet"],
    "Hardware & Workstation": ["laptop", "screen", "keyboard", "battery", "display", "monitor", "docking", "charger"],
    "Access & Identity Management": ["password", "login", "locked", "mfa", "2fa", "active directory", "sso", "authenticator"],
    "Student Portal & LMS": ["lms", "moodle", "canvas", "portal", "grade", "course", "assignment", "exam", "tuition"],
    "Software & Applications": ["outlook", "teams", "excel", "software", "license", "install", "crash", "bug"],
    "Human Resources & Benefits": ["leave", "payroll", "salary", "reimbursement", "insurance", "hr", "benefits"],
    "Hostel & Facilities": ["hostel", "room", "maintenance", "power", "water", "ac", "air conditioner", "electricity"]
}


class TicketClassifier:
    """
    Lightweight, high-speed Scikit-learn ticket classification engine.
    - Operates on CPU in < 3 ms.
    - Enforces input text length bounding (< 1 KB) to prevent memory spikes.
    - Incorporates deterministic emergency safety heuristics.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or settings.AI_CLASSIFIER_PATH
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.pipeline = joblib.load(self.model_path)
                logger.info(f"Loaded category classifier from {self.model_path}")
            except Exception as e:
                logger.warning(f"Could not load category classifier ({e}). Using deterministic heuristics.")
                self.pipeline = None
        else:
            logger.info("Category classifier artifact not found. Will use heuristic classification.")

    def classify(
        self,
        title: str,
        description: str,
        categories_map: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Classify ticket into category with confidence scores and rationale.
        """
        t0 = time.time()
        b_title = (title or "").strip()[:200]
        b_desc = (description or "").strip()[:800]
        combined = f"{b_title} {b_desc}".strip()
        lower_text = combined.lower()

        predicted_category = None
        confidence_scores: Dict[str, float] = {}
        rationale_tags = []

        # 1. Deterministic emergency rule check
        is_critical = any(kw in lower_text for kw in CRITICAL_SAFETY_KEYWORDS)
        is_high = any(kw in lower_text for kw in HIGH_SAFETY_KEYWORDS)
        if is_critical:
            rationale_tags.append("Deterministic Rule: Critical operational incident keyword detected")
        elif is_high:
            rationale_tags.append("Deterministic Rule: Urgent issue keyword detected")

        # 2. Scikit-learn statistical model inference
        if self.pipeline is not None and combined:
            try:
                proba = self.pipeline.predict_proba([combined])[0]
                classes = self.pipeline.classes_

                for cat, score in zip(classes, proba):
                    confidence_scores[cat] = round(float(score), 4)

                best_idx = proba.argmax()
                predicted_category = str(classes[best_idx])
                top_conf = round(float(proba[best_idx]) * 100.0, 1)
                rationale_tags.append(f"ML Classifier: '{predicted_category}' with {top_conf}% confidence")
            except Exception as e:
                logger.warning(f"Inference error in classifier ({e}). Falling back to heuristics.")
                predicted_category = None

        # 3. Rule-based heuristic fallback if unclassified
        if not predicted_category:
            best_cat = "Software & Applications"
            max_matches = 0
            for cat, kws in CATEGORY_FALLBACK_RULES.items():
                matches = sum(1 for kw in kws if kw in lower_text)
                if matches > max_matches:
                    max_matches = matches
                    best_cat = cat

            predicted_category = best_cat
            confidence_scores = {best_cat: 0.85 if max_matches > 0 else 0.50}
            rationale_tags.append(f"Heuristic Matcher: matched '{predicted_category}' ({max_matches} keywords)")

        # Resolve category ID if map provided
        predicted_category_id = None
        if categories_map:
            # Case-insensitive lookup
            for c_name, c_id in categories_map.items():
                if c_name.strip().lower() == predicted_category.strip().lower():
                    predicted_category_id = c_id
                    break
            # Fallback to first available category if exact name missing
            if not predicted_category_id and categories_map:
                predicted_category_id = next(iter(categories_map.values()))

        exec_ms = round((time.time() - t0) * 1000, 2)
        return {
            "predicted_category_name": predicted_category,
            "predicted_category_id": predicted_category_id,
            "confidence_scores": confidence_scores,
            "rationale": " | ".join(rationale_tags),
            "execution_time_ms": exec_ms,
            "model_name": "SmartHelpdesk-TFIDF-Classifier",
            "model_version": "v2.0-4gb-hybrid"
        }
