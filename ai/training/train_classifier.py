import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    f1_score,
    precision_score,
    recall_score
)


def train_category_classifier(
    data_path: str = "ai/datasets/ticket_training_data.csv",
    artifact_dir: str = "ai/artifacts"
):
    print(f"Loading ticket dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} samples across {df['category'].nunique()} categories.")
    
    # Feature engineering: combine title and description
    df["full_text"] = df["title"].fillna("") + " " + df["description"].fillna("")
    
    X = df["full_text"]
    y = df["category"]
    
    # Stratified train/test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    print(f"Training set: {len(X_train)} samples | Test set: {len(X_test)} samples")
    
    # Build Scikit-learn Pipeline
    pipeline = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=1000,
                stop_words="english",
                sublinear_tf=True
            )
        ),
        (
            "clf",
            LogisticRegression(
                C=2.0,
                max_iter=1000,
                class_weight="balanced",
                random_state=42
            )
        )
    ])
    
    print("Fitting TF-IDF + Logistic Regression model...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate on held-out test data
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    weighted_f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    macro_prec = precision_score(y_test, y_pred, average="macro", zero_division=0)
    macro_rec = recall_score(y_test, y_pred, average="macro", zero_division=0)
    
    report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    classes = sorted(list(y.unique()))
    cm = confusion_matrix(y_test, y_pred, labels=classes)
    
    print("\n" + "="*50)
    print("MODEL EVALUATION RESULTS (Held-out Test Data)")
    print("="*50)
    print(f"Overall Accuracy:   {accuracy*100:.2f}%")
    print(f"Macro Precision:    {macro_prec:.4f}")
    print(f"Macro Recall:       {macro_rec:.4f}")
    print(f"Macro F1-Score:     {macro_f1:.4f}")
    print(f"Weighted F1-Score:  {weighted_f1:.4f}")
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))
    
    # Prepare persistence directory
    os.makedirs(artifact_dir, exist_ok=True)
    model_save_path = os.path.join(artifact_dir, "category_classifier.joblib")
    metrics_save_path = os.path.join(artifact_dir, "category_classifier_metrics.json")
    
    joblib.dump(pipeline, model_save_path)
    print(f"Model saved to: {model_save_path}")
    
    metrics_payload = {
        "model_name": "SmartHelpdesk-TFIDF-Classifier",
        "algorithm": "TF-IDF (1,2 ngrams) + Logistic Regression (C=2.0, balanced)",
        "version": "1.0.0",
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classes": classes,
        "accuracy": round(float(accuracy), 4),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "macro_precision": round(float(macro_prec), 4),
        "macro_recall": round(float(macro_rec), 4),
        "confusion_matrix": cm.tolist(),
        "per_class_metrics": {k: v for k, v in report_dict.items() if k in classes}
    }
    
    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Metrics saved to: {metrics_save_path}")
    
    return pipeline, metrics_payload


if __name__ == "__main__":
    train_category_classifier()
