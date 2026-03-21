import argparse
import os
import pickle

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, f1_score, classification_report
import xgboost as xgb


def load_dataset(csv_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found: {csv_path}")
    return pd.read_csv(csv_path)


def prepare_xy(df: pd.DataFrame):
    if "likely_fraud_label" not in df.columns:
        raise ValueError("CSV missing required target column: likely_fraud_label")

    x = df.drop(columns=[c for c in ["certificate_id", "likely_fraud_label", "blockchain_network", "verification_status"] if c in df.columns])
    x = x.select_dtypes(include=[np.number]).fillna(0)
    y = df["likely_fraud_label"].astype(int)
    return x, y


def train_model(x_train, y_train, x_val, y_val):
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        use_label_encoder=False,
        verbosity=0,
    )

    model.fit(
        x_train,
        y_train,
        eval_set=[(x_val, y_val)],
        verbose=False,
    )
    return model


def main():
    parser = argparse.ArgumentParser(description="Train fraud XGBoost model for AI service")
    parser.add_argument("--csv", required=True, help="Path to fraud dataset CSV")
    parser.add_argument("--out", default="../models/xgboost_fraud_model.pkl", help="Output model path")
    args = parser.parse_args()

    print("Loading dataset...")
    df = load_dataset(args.csv)
    x, y = prepare_xy(df)

    x_temp, x_test, y_temp, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)
    x_train, x_val, y_train, y_val = train_test_split(x_temp, y_temp, test_size=0.2, random_state=42, stratify=y_temp)

    print(f"Rows: {len(df)} | Features: {x.shape[1]} | Fraud rate: {y.mean():.2%}")
    print("Training model...")
    model = train_model(x_train, y_train, x_val, y_val)

    y_prob = model.predict_proba(x_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    auc = roc_auc_score(y_test, y_prob)
    f1 = f1_score(y_test, y_pred)

    print(f"AUC: {auc:.4f}")
    print(f"F1 : {f1:.4f}")
    print(classification_report(y_test, y_pred, target_names=["normal", "fraud"]))

    out_path = os.path.abspath(os.path.join(os.path.dirname(__file__), args.out))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        pickle.dump(model, f)

    print(f"Saved model: {out_path}")


if __name__ == "__main__":
    main()
