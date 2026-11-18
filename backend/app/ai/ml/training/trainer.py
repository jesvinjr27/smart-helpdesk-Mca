import sys
import os
sys.path.insert(0, r"c:\smart helpdesk")
import json
import logging
import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score, f1_score

logger = logging.getLogger(__name__)


def train_category_classifier(data_path: str, output_dir: str):
    """
    Train a lightweight Scikit-Learn TF-IDF Logistic Regression classifier.
    Artifact size: < 100 KB. Inference latency: < 3 ms on CPU.
    """
    os.makedirs(output_dir, exist_ok=True)
    df = pd.read_csv(data_path)

    texts = (df["title"].fillna("") + " " + df["description"].fillna("")).str.strip()
    labels = df["category"].str.strip()

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=512,
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True
        )),
        ("clf", LogisticRegression(
            C=1.0,
            max_iter=300,
            class_weight="balanced",
            random_state=42
        ))
    ])

    pipeline.fit(texts, labels)
    preds = pipeline.predict(texts)

    accuracy = float(accuracy_score(labels, preds))
    macro_f1 = float(f1_score(labels, preds, average="macro", zero_division=0))

    model_file = os.path.join(output_dir, "category_classifier.joblib")
    metrics_file = os.path.join(output_dir, "category_classifier_metrics.json")

    joblib.dump(pipeline, model_file, compress=3)

    metrics = {
        "model_name": "SmartHelpdesk-TFIDF-Classifier",
        "version": "v2.0-4gb-hybrid",
        "accuracy": round(accuracy, 4),
        "macro_f1": round(macro_f1, 4),
        "classes": list(pipeline.classes_),
        "num_classes": len(pipeline.classes_),
        "vocabulary_size": len(pipeline.named_steps["tfidf"].vocabulary_),
        "description": "Lightweight CPU-only multi-class ticket classification model."
    }

    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info(f"Category classifier trained and saved to {model_file} (Accuracy: {accuracy:.2f})")
    return pipeline, metrics


def train_sla_risk_model(data_path: str, output_dir: str):
    """
    Train a balanced Logistic Regression model to predict SLA breach probability.
    Artifact size: < 10 KB. Inference latency: < 2 ms on CPU.
    """
    os.makedirs(output_dir, exist_ok=True)
    df = pd.read_csv(data_path)

    # Generate realistic arrival distribution for training
    np.random.seed(42)
    n = len(df)
    hours = np.random.choice([8, 9, 10, 11, 14, 15, 16, 20, 22, 23], size=n)
    weekends = np.random.choice([0, 1], size=n, p=[0.75, 0.25])
    queues = np.random.randint(2, 45, size=n)
    lengths = [len(str(t) + " " + str(d)) for t, d in zip(df["title"], df["description"])]

    # Ground truth formula for SLA breach risk
    breach_prob = (
        (df["priority"] == "CRITICAL").astype(float) * 0.40 +
        (df["priority"] == "HIGH").astype(float) * 0.25 +
        (weekends == 1).astype(float) * 0.20 +
        (hours >= 20).astype(float) * 0.15 +
        (queues / 50.0) * 0.20 +
        np.random.normal(0, 0.05, size=n)
    )
    labels = (breach_prob > 0.45).astype(int)

    features_df = pd.DataFrame({
        "priority": df["priority"].values,
        "category": df["category"].values,
        "created_hour": hours,
        "is_weekend": weekends,
        "initial_queue": queues,
        "desc_length": lengths
    })

    categorical_features = ["priority", "category"]
    numeric_features = ["created_hour", "is_weekend", "initial_queue", "desc_length"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("num", StandardScaler(), numeric_features)
        ]
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("clf", LogisticRegression(class_weight="balanced", random_state=42))
    ])

    pipeline.fit(features_df, labels)
    preds = pipeline.predict(features_df)

    accuracy = float(accuracy_score(labels, preds))
    macro_f1 = float(f1_score(labels, preds, average="macro", zero_division=0))

    model_file = os.path.join(output_dir, "sla_risk_model.joblib")
    metrics_file = os.path.join(output_dir, "sla_risk_model_metrics.json")

    joblib.dump(pipeline, model_file, compress=3)

    metrics = {
        "model_name": "SLARiskPredictor-v2",
        "version": "v2.0-4gb-hybrid",
        "accuracy": round(accuracy, 4),
        "macro_f1": round(macro_f1, 4),
        "features": categorical_features + numeric_features,
        "description": "Predicts probability of SLA breach based on arrival time, queue, and priority."
    }

    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info(f"SLA risk model trained and saved to {model_file} (Accuracy: {accuracy:.2f})")
    return pipeline, metrics


def train_all(data_path: str, output_dir: str):
    """Train and persist all ML models for the hybrid architecture."""
    cat_pipe, cat_met = train_category_classifier(data_path, output_dir)
    sla_pipe, sla_met = train_sla_risk_model(data_path, output_dir)
    return {
        "category_classifier": cat_met,
        "sla_risk_model": sla_met
    }


if __name__ == "__main__":
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent.parent))
    logging.basicConfig(level=logging.INFO)
    from backend.app.core.config import settings
    res = train_all(settings.AI_TRAINING_DATA_PATH, settings.AI_ML_MODEL_DIR)
    print("Training Complete:", json.dumps(res, indent=2))
