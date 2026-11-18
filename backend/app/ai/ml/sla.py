import os
import time
import logging
from typing import Dict, Any, Optional, List
import pandas as pd
import joblib

from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class SLARiskPredictor:
    """
    Balanced Machine Learning Predictor for SLA breach forecasting.
    - CPU inference in < 2 ms.
    - Features: priority, category, arrival hour, weekend status, queue depth, description length.
    - Provides specific risk factors and suggested operational mitigations.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or settings.AI_SLA_MODEL_PATH
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.pipeline = joblib.load(self.model_path)
                logger.info(f"Loaded SLA risk model from {self.model_path}")
            except Exception as e:
                logger.warning(f"Could not load SLA model ({e}). Using heuristic risk evaluator.")
                self.pipeline = None
        else:
            logger.info("SLA model artifact not found. Will use heuristic risk evaluator.")

    def predict_risk(
        self,
        priority: str,
        category: str,
        created_hour: int = 12,
        is_weekend: int = 0,
        initial_queue: int = 5,
        desc_length: int = 150
    ) -> Dict[str, Any]:
        t0 = time.time()
        risk_score = 0.25
        risk_factors: List[str] = []
        suggested_mitigation = "Follow standard operational procedures."

        if self.pipeline is not None:
            try:
                features_df = pd.DataFrame([{
                    "priority": priority,
                    "category": category,
                    "created_hour": created_hour,
                    "is_weekend": is_weekend,
                    "initial_queue": initial_queue,
                    "desc_length": desc_length
                }])
                prob = self.pipeline.predict_proba(features_df)[0, 1]
                risk_score = float(prob)
            except Exception as e:
                logger.warning(f"SLA model prediction error ({e}). Using rule fallback.")
                risk_score = self._heuristic_risk(priority, is_weekend, initial_queue)
        else:
            risk_score = self._heuristic_risk(priority, is_weekend, initial_queue)

        # Factor identification
        if priority == "CRITICAL":
            risk_factors.append("Critical priority requires immediate 1-hour response SLA.")
        elif priority == "HIGH":
            risk_factors.append("High priority has strict 4-hour resolution window.")

        if is_weekend:
            risk_factors.append("Ticket arrived during weekend with reduced support staffing.")

        if initial_queue > 25:
            risk_factors.append(f"Significant queue backlog ({initial_queue} tickets waiting).")

        if created_hour >= 20 or created_hour <= 6:
            risk_factors.append(f"Off-hours ticket creation ({created_hour:02d}:00).")

        # Risk level categorization
        if risk_score >= 0.70:
            risk_level = "CRITICAL"
            suggested_mitigation = "Immediately page on-call technician and escalate queue priority."
        elif risk_score >= 0.45:
            risk_level = "HIGH"
            suggested_mitigation = "Assign directly to active specialist; target first response within 45 minutes."
        elif risk_score >= 0.25:
            risk_level = "MEDIUM"
            suggested_mitigation = "Monitor ticket in tier-1 queue according to standard priority."
        else:
            risk_level = "LOW"
            suggested_mitigation = "Ticket is well within target SLA boundaries."

        exec_ms = round((time.time() - t0) * 1000, 2)
        return {
            "model_name": "SLARiskPredictor-v2",
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "risk_factors": risk_factors or ["Normal operational pacing."],
            "suggested_mitigation": suggested_mitigation,
            "execution_time_ms": exec_ms
        }

    def _heuristic_risk(self, priority: str, is_weekend: int, queue: int) -> float:
        base = 0.20
        if priority == "CRITICAL":
            base += 0.45
        elif priority == "HIGH":
            base += 0.25
        elif priority == "MEDIUM":
            base += 0.10

        if is_weekend:
            base += 0.15
        if queue > 20:
            base += 0.15
        return min(0.95, base)
