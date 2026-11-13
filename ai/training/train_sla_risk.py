import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score


def generate_sla_historical_dataset(n_samples: int = 500, random_state: int = 42) -> pd.DataFrame:
    np.random.seed(random_state)
    
    priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    categories = [
        "Hardware & Workstation",
        "Software & Applications",
        "Network & VPN",
        "Access & Identity Management",
        "Student Portal & LMS",
        "Hostel & Facilities",
        "Human Resources & Benefits"
    ]
    
    data = []
    for _ in range(n_samples):
        priority = np.random.choice(priorities, p=[0.25, 0.40, 0.25, 0.10])
        category = np.random.choice(categories)
        created_hour = np.random.randint(0, 24)
        is_weekend = int(np.random.rand() < 0.28)
        initial_queue = np.random.randint(1, 40)
        desc_length = int(np.random.normal(200, 60))
        desc_length = max(30, desc_length)
        
        # Risk probability formula reflecting realistic operations
        risk_logit = -2.0
        if priority == "CRITICAL":
            risk_logit += 1.8
        elif priority == "HIGH":
            risk_logit += 0.9
        elif priority == "LOW":
            risk_logit -= 0.6
            
        if is_weekend:
            risk_logit += 1.2
        if created_hour < 8 or created_hour > 18:
            risk_logit += 0.8
        if initial_queue > 20:
            risk_logit += 0.05 * (initial_queue - 20)
        if category in ["Hardware & Workstation", "Network & VPN"]:
            risk_logit += 0.5  # physical intervention or vendor escalations take longer
            
        prob = 1.0 / (1.0 + np.exp(-risk_logit))
        breached = int(np.random.rand() < prob)
        
        data.append({
            "priority": priority,
            "category": category,
            "created_hour": created_hour,
            "is_weekend": is_weekend,
            "initial_queue": initial_queue,
            "desc_length": desc_length,
            "is_breached": breached
        })
        
    return pd.DataFrame(data)


def train_sla_risk_model(artifact_dir: str = "ai/artifacts"):
    print("Generating representative historical SLA operational dataset...")
    df = generate_sla_historical_dataset(n_samples=600)
    
    features = ["priority", "category", "created_hour", "is_weekend", "initial_queue", "desc_length"]
    X = df[features]
    y = df["is_breached"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), ["priority", "category"]),
            ("num", StandardScaler(), ["created_hour", "initial_queue", "desc_length"]),
            ("pass", "passthrough", ["is_weekend"])
        ]
    )
    
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("clf", LogisticRegression(class_weight="balanced", random_state=42))
    ])
    
    print("Training SLA Risk Logistic Regression baseline...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_prob)
    
    print("\n" + "="*50)
    print("SLA RISK MODEL EVALUATION (Test Data)")
    print("="*50)
    print(f"Accuracy:  {acc*100:.2f}%")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC AUC:   {auc:.4f}")
    
    os.makedirs(artifact_dir, exist_ok=True)
    model_save_path = os.path.join(artifact_dir, "sla_risk_model.joblib")
    metrics_save_path = os.path.join(artifact_dir, "sla_risk_model_metrics.json")
    
    joblib.dump(pipeline, model_save_path)
    
    metrics = {
        "model_name": "SLARiskPredictor-v1",
        "algorithm": "ColumnTransformer + LogisticRegression (balanced)",
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(auc), 4),
        "features": features
    }
    
    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"SLA Model saved to: {model_save_path}")
    print(f"SLA Metrics saved to: {metrics_save_path}")
    return pipeline, metrics


if __name__ == "__main__":
    train_sla_risk_model()
