"""
retrain.py — One-command fraud model retraining script.

Usage:
    python retrain.py --csv path/to/fraud_dataset.csv

What it does:
    1. Loads the CSV exported by exportFraudDataset.js
    2. Validates data quality (minimum rows, fraud rate)
    3. Handles class imbalance with scale_pos_weight
    4. Trains XGBoost with cross-validation
    5. Saves versioned model (keeps last 3 versions)
    6. Updates the active model symlink/copy
    7. Prints a full performance report

No ML knowledge needed — just run it.
"""

import argparse
import os
import pickle
import shutil
import glob
from datetime import datetime

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    roc_auc_score, f1_score, classification_report,
    confusion_matrix, precision_score, recall_score
)
import xgboost as xgb


# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
ACTIVE_MODEL = os.path.join(MODELS_DIR, "xgboost_fraud_model.pkl")
MIN_ROWS = 100          # Minimum rows to train
MIN_FRAUD_RATE = 0.03   # At least 3% fraud
MAX_FRAUD_RATE = 0.60   # At most 60% fraud
KEEP_VERSIONS = 3       # How many old model versions to keep

# Columns to drop before training (non-numeric or metadata)
DROP_COLS = ["certificate_id", "likely_fraud_label", "blockchain_network", "verification_status"]


# ─────────────────────────────────────────────
# Step 1: Load & validate data
# ─────────────────────────────────────────────

def load_and_validate(csv_path: str):
    print(f"\n{'='*60}")
    print("STEP 1: Loading dataset")
    print(f"{'='*60}")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    df = pd.read_csv(csv_path)
    print(f"  Rows loaded     : {len(df)}")

    if "likely_fraud_label" not in df.columns:
        raise ValueError("CSV missing required column: likely_fraud_label")

    fraud_count = int(df["likely_fraud_label"].sum())
    normal_count = len(df) - fraud_count
    fraud_rate = fraud_count / len(df)

    print(f"  Normal rows     : {normal_count}")
    print(f"  Fraud rows      : {fraud_count}")
    print(f"  Fraud rate      : {fraud_rate:.1%}")

    # Validation checks
    errors = []
    warnings = []

    if len(df) < MIN_ROWS:
        errors.append(
            f"Only {len(df)} rows — need at least {MIN_ROWS}. "
            "Collect more real data or generate more synthetic data first."
        )
    if fraud_rate < MIN_FRAUD_RATE:
        warnings.append(
            f"Fraud rate {fraud_rate:.1%} is very low. "
            "Model may not learn fraud patterns well. "
            "Consider running: node scripts/generateSyntheticCertificateData.js --count=200"
        )
    if fraud_rate > MAX_FRAUD_RATE:
        warnings.append(
            f"Fraud rate {fraud_rate:.1%} seems too high for real data. "
            "Check your exportFraudDataset.js labeling logic."
        )

    for w in warnings:
        print(f"\n  ⚠️  WARNING: {w}")

    if errors:
        for e in errors:
            print(f"\n  ❌ ERROR: {e}")
        raise ValueError("Dataset validation failed. Fix the issues above and retry.")

    print("\n  ✅ Dataset validation passed")
    return df, fraud_rate


# ─────────────────────────────────────────────
# Step 2: Prepare features
# ─────────────────────────────────────────────

def prepare_features(df: pd.DataFrame):
    print(f"\n{'='*60}")
    print("STEP 2: Preparing features")
    print(f"{'='*60}")

    drop = [c for c in DROP_COLS if c in df.columns]
    X = df.drop(columns=drop)
    X = X.select_dtypes(include=[np.number]).fillna(0)
    y = df["likely_fraud_label"].astype(int)

    print(f"  Features used   : {X.shape[1]}")
    print(f"  Feature names   : {list(X.columns)}")

    return X, y


# ─────────────────────────────────────────────
# Step 3: Train model
# ─────────────────────────────────────────────

def train(X_train, y_train, X_val, y_val, fraud_rate: float):
    print(f"\n{'='*60}")
    print("STEP 3: Training XGBoost model")
    print(f"{'='*60}")

    # Handle class imbalance automatically
    # scale_pos_weight = normal_count / fraud_count
    normal_count = int((1 - fraud_rate) * len(y_train))
    fraud_count = int(fraud_rate * len(y_train))
    scale_pos_weight = normal_count / max(fraud_count, 1)
    print(f"  scale_pos_weight: {scale_pos_weight:.2f} (auto-balancing classes)")

    model = xgb.XGBClassifier(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        scale_pos_weight=scale_pos_weight,   # handles imbalance
        objective="binary:logistic",
        eval_metric="auc",
        random_state=42,
        verbosity=0,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    print("  Training complete")
    return model


# ─────────────────────────────────────────────
# Step 4: Evaluate
# ─────────────────────────────────────────────

def evaluate(model, X_test, y_test, X, y):
    print(f"\n{'='*60}")
    print("STEP 4: Evaluating model")
    print(f"{'='*60}")

    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    auc   = roc_auc_score(y_test, y_prob)
    f1    = f1_score(y_test, y_pred, zero_division=0)
    prec  = precision_score(y_test, y_pred, zero_division=0)
    rec   = recall_score(y_test, y_pred, zero_division=0)

    print(f"\n  Test set results:")
    print(f"  AUC       : {auc:.4f}  (1.0 = perfect, 0.5 = random)")
    print(f"  F1 Score  : {f1:.4f}  (higher = better)")
    print(f"  Precision : {prec:.4f} (of flagged fraud, how many are real)")
    print(f"  Recall    : {rec:.4f} (of real fraud, how many we caught)")

    cm = confusion_matrix(y_test, y_pred)
    print(f"\n  Confusion Matrix:")
    print(f"  {'':20s} Predicted Normal  Predicted Fraud")
    print(f"  {'Actual Normal':20s} {cm[0][0]:^16d}  {cm[0][1]:^14d}")
    print(f"  {'Actual Fraud':20s} {cm[1][0]:^16d}  {cm[1][1]:^14d}")

    print(f"\n  Full Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["normal", "fraud"], zero_division=0))

    # Cross-validation on full dataset for robustness check
    print("  Running 5-fold cross-validation (this takes ~30 seconds)...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring="roc_auc")
    print(f"  CV AUC scores : {[round(s, 4) for s in cv_scores]}")
    print(f"  CV AUC mean   : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Quality gate
    if auc < 0.65:
        print(f"\n  ⚠️  AUC {auc:.4f} is low. Model may not be reliable.")
        print("     Consider collecting more data before deploying.")
    else:
        print(f"\n  ✅ Model quality looks good (AUC {auc:.4f})")

    return {"auc": auc, "f1": f1, "precision": prec, "recall": rec,
            "cm_tn": int(cm[0][0]), "cm_fp": int(cm[0][1]),
            "cm_fn": int(cm[1][0]), "cm_tp": int(cm[1][1])}


# ─────────────────────────────────────────────
# Step 5: Save versioned model
# ─────────────────────────────────────────────

def save_model(model, metrics: dict, csv_path: str):
    print(f"\n{'='*60}")
    print("STEP 5: Saving model")
    print(f"{'='*60}")

    os.makedirs(MODELS_DIR, exist_ok=True)

    # Versioned filename: xgboost_fraud_model_v_20260321_143022.pkl
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    versioned_name = f"xgboost_fraud_model_v_{timestamp}.pkl"
    versioned_path = os.path.join(MODELS_DIR, versioned_name)

    with open(versioned_path, "wb") as f:
        pickle.dump(model, f)
    print(f"  Versioned model : {versioned_path}")

    # Copy as active model (overwrites previous)
    shutil.copy2(versioned_path, ACTIVE_MODEL)
    print(f"  Active model    : {ACTIVE_MODEL}")

    # Save metadata alongside versioned model
    meta_path = versioned_path.replace(".pkl", "_meta.txt")
    with open(meta_path, "w") as f:
        f.write(f"Trained     : {datetime.now().isoformat()}\n")
        f.write(f"CSV source  : {csv_path}\n")
        f.write(f"AUC         : {metrics['auc']:.4f}\n")
        f.write(f"F1          : {metrics['f1']:.4f}\n")
        f.write(f"Precision   : {metrics['precision']:.4f}\n")
        f.write(f"Recall      : {metrics['recall']:.4f}\n")
        f.write(f"CM_TN       : {metrics.get('cm_tn', '')}\n")
        f.write(f"CM_FP       : {metrics.get('cm_fp', '')}\n")
        f.write(f"CM_FN       : {metrics.get('cm_fn', '')}\n")
        f.write(f"CM_TP       : {metrics.get('cm_tp', '')}\n")
        f.write(f"Features    : {list(model.feature_names_in_)}\n")
    print(f"  Metadata        : {meta_path}")

    # Cleanup old versions — keep only KEEP_VERSIONS most recent
    old_models = sorted(
        glob.glob(os.path.join(MODELS_DIR, "xgboost_fraud_model_v_*.pkl")),
        reverse=True
    )
    for old in old_models[KEEP_VERSIONS:]:
        os.remove(old)
        meta = old.replace(".pkl", "_meta.txt")
        if os.path.exists(meta):
            os.remove(meta)
        print(f"  Removed old     : {os.path.basename(old)}")

    print(f"\n  ✅ Model saved and active")
    return versioned_path


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Retrain the fraud detection XGBoost model. Just point it at a CSV."
    )
    parser.add_argument(
        "--csv", required=True,
        help="Path to fraud dataset CSV (exported by exportFraudDataset.js)"
    )
    args = parser.parse_args()

    print("\n" + "="*60)
    print(" JOBZEE FRAUD MODEL RETRAINING")
    print("="*60)
    print(f" CSV: {args.csv}")
    print("="*60)

    # Step 1: Load & validate
    df, fraud_rate = load_and_validate(args.csv)

    # Step 2: Prepare features
    X, y = prepare_features(df)

    # Step 3: Split data
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.2, random_state=42, stratify=y_temp
    )

    print(f"\n  Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")

    # Step 4: Train
    model = train(X_train, y_train, X_val, y_val, fraud_rate)

    # Step 5: Evaluate
    metrics = evaluate(model, X_test, y_test, X, y)

    # Step 6: Save
    saved_path = save_model(model, metrics, args.csv)

    print(f"\n{'='*60}")
    print(" RETRAINING COMPLETE")
    print(f"{'='*60}")
    print(f" The AI service will use the new model on next restart.")
    print(f" Deploy to Render: git add ai-service/models/ && git commit && git push")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
