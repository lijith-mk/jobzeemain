from __future__ import annotations

import os
import math
import pickle
from typing import Dict, Tuple, Any

import numpy as np


DEFAULT_FEATURES = [
    "is_revoked",
    "has_blockchain_tx",
    "has_wallet_address",
    "wallet_reuse_count",
    "honors",
    "grade_numeric",
    "completion_percentage",
    "total_lessons",
    "completed_lessons",
    "total_quizzes",
    "passed_quizzes",
    "average_quiz_score",
    "total_time_spent_min",
    "certificate_age_hours",
    "blockchain_delay_minutes",
    "total_verifications",
    "successful_verifications",
    "failed_verifications",
    "suspicious_attempts",
    "unique_verifier_ips",
    "unique_user_agents",
    "avg_response_time_ms",
    "max_suspicious_score",
    "verification_window_hours",
]


class FraudModel:
    def __init__(self, model_path: str | None = None):
        self.model = None
        self.feature_names = list(DEFAULT_FEATURES)
        self.model_path = model_path or os.getenv("FRAUD_MODEL_PATH", "./models/xgboost_fraud_model.pkl")
        self.loaded = False
        self.load_error = None
        self._load()

    def _load(self) -> None:
        if not os.path.exists(self.model_path):
            self.load_error = f"Model file not found: {self.model_path}"
            self.loaded = False
            return

        try:
            with open(self.model_path, "rb") as f:
                self.model = pickle.load(f)

            if hasattr(self.model, "feature_names_in_"):
                self.feature_names = [str(name) for name in self.model.feature_names_in_]

            self.loaded = True
            self.load_error = None
        except Exception as exc:
            self.loaded = False
            self.load_error = f"Failed to load model: {exc}"

    def health(self) -> Dict[str, Any]:
        return {
            "loaded": self.loaded,
            "model_path": self.model_path,
            "feature_count": len(self.feature_names),
            "load_error": self.load_error,
        }

    @staticmethod
    def _sigmoid(x: float) -> float:
        x = max(min(x, 60), -60)
        return 1.0 / (1.0 + math.exp(-x))

    def _fallback_score(self, features: Dict[str, float]) -> float:
        suspicious_attempts = float(features.get("suspicious_attempts", 0) or 0)
        max_suspicious_score = float(features.get("max_suspicious_score", 0) or 0)
        failed_verifications = float(features.get("failed_verifications", 0) or 0)
        total_verifications = float(features.get("total_verifications", 0) or 0)
        unique_ips = float(features.get("unique_verifier_ips", 0) or 0)
        is_revoked = float(features.get("is_revoked", 0) or 0)

        failure_ratio = (failed_verifications / total_verifications) if total_verifications > 0 else 0

        logit = (
            0.9 * suspicious_attempts
            + 0.035 * max_suspicious_score
            + 2.2 * failure_ratio
            + 0.12 * unique_ips
            + 2.5 * is_revoked
            - 3.0
        )
        return float(self._sigmoid(logit))

    def score(self, feature_payload: Dict[str, float]) -> Tuple[float, str, Dict[str, float], bool]:
        sanitized = {}
        for name in self.feature_names:
            value = feature_payload.get(name, 0)
            if value is None:
                value = 0
            sanitized[name] = float(value)

        if self.loaded and self.model is not None:
            vector = np.array([[sanitized[name] for name in self.feature_names]], dtype=np.float64)
            probability = float(self.model.predict_proba(vector)[0][1])
            used_fallback = False
        else:
            probability = self._fallback_score(sanitized)
            used_fallback = True

        if probability >= 0.75:
            risk_level = "high"
        elif probability >= 0.45:
            risk_level = "medium"
        else:
            risk_level = "low"

        return probability, risk_level, sanitized, used_fallback
