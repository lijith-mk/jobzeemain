"""
train_gnn.py — GraphSAGE vs XGBoost Comparison

Trains both models on the same dataset and prints a side-by-side
comparison table. Results are saved to:
  ai-service/reports/gnn_comparison_YYYYMMDD_HHMMSS.json

That JSON is automatically picked up by generate_report.py if present.

Usage:
    python fraud_detection/train_gnn.py --csv path/to/fraud_dataset.csv

Requirements:
    pip install torch torch-geometric   (GNN side)
    xgboost scikit-learn already installed (XGBoost side)

Note:
    If torch-geometric is not installed, only XGBoost runs and the
    comparison table shows GNN as "not available".
"""

import argparse
import json
import os
import sys
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score,
    recall_score, confusion_matrix, accuracy_score
)
from sklearn.model_selection import train_test_split
import xgboost as xgb

# ─────────────────────────────────────────────
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")
DROP_COLS   = ["certificate_id", "likely_fraud_label",
               "blockchain_network", "verification_status"]
RANDOM_SEED = 42


# ─────────────────────────────────────────────
# Data loading
# ─────────────────────────────────────────────

def load_data(csv_path: str):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    df = pd.read_csv(csv_path)
    if "likely_fraud_label" not in df.columns:
        raise ValueError("CSV missing required column: likely_fraud_label")

    drop = [c for c in DROP_COLS if c in df.columns]
    X = df.drop(columns=drop).select_dtypes(include=[np.number]).fillna(0)
    y = df["likely_fraud_label"].astype(int)

    fraud_count  = int(y.sum())
    normal_count = len(y) - fraud_count
    print(f"  Rows: {len(X)} | Features: {X.shape[1]} | "
          f"Fraud: {fraud_count} ({fraud_count/len(y):.1%}) | "
          f"Normal: {normal_count}")

    return X, y


def split_data(X, y):
    return train_test_split(X, y, test_size=0.2,
                            random_state=RANDOM_SEED, stratify=y)


# ─────────────────────────────────────────────
# Metrics helper
# ─────────────────────────────────────────────

def compute_metrics(y_true, y_prob, y_pred) -> dict:
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
    return {
        "auc":       round(float(roc_auc_score(y_true, y_prob)), 4),
        "f1":        round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall":    round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "accuracy":  round(float(accuracy_score(y_true, y_pred)), 4),
        "cm_tn": int(tn), "cm_fp": int(fp),
        "cm_fn": int(fn), "cm_tp": int(tp),
    }


# ─────────────────────────────────────────────
# XGBoost
# ─────────────────────────────────────────────

def train_xgboost(X_train, y_train, X_test, y_test) -> dict:
    print("\n[XGBoost] Training...")
    fraud_rate = y_train.mean()
    scale_pos_weight = (1 - fraud_rate) / max(fraud_rate, 1e-9)

    model = xgb.XGBClassifier(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=scale_pos_weight,
        objective="binary:logistic",
        eval_metric="auc",
        random_state=RANDOM_SEED,
        verbosity=0,
    )
    model.fit(X_train, y_train,
              eval_set=[(X_test, y_test)], verbose=False)

    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)
    metrics = compute_metrics(y_test, y_prob, y_pred)
    print(f"  AUC={metrics['auc']}  F1={metrics['f1']}  "
          f"Precision={metrics['precision']}  Recall={metrics['recall']}")
    return metrics


# ─────────────────────────────────────────────
# GNN (GraphSAGE)
# ─────────────────────────────────────────────

def build_edges(df_full: pd.DataFrame) -> np.ndarray:
    """
    Connect certificates that share suspicious behavior patterns.
    Edge strategy:
      - Same wallet_reuse_count bucket
      - Both have suspicious_attempts > 0
      - Both have more failed than successful verifications
      - Same unique_verifier_ips bucket (grouped by 3)
    """
    edges = []
    buckets: dict = {}

    for idx, row in df_full.iterrows():
        key = (
            int(row.get("wallet_reuse_count", 0)),
            int(row.get("suspicious_attempts", 0) > 0),
            int(row.get("failed_verifications", 0) >
                row.get("successful_verifications", 0)),
            int(row.get("unique_verifier_ips", 0) // 3),
        )
        buckets.setdefault(key, []).append(idx)

    for _, indices in buckets.items():
        if len(indices) < 2:
            continue
        for i in range(len(indices) - 1):
            edges.append((indices[i], indices[i + 1]))
            edges.append((indices[i + 1], indices[i]))

    # Fallback: chain all nodes if no edges formed
    if not edges:
        for i in range(len(df_full) - 1):
            edges.append((i, i + 1))
            edges.append((i + 1, i))

    return np.array(edges, dtype=np.int64)


def train_gnn(X: pd.DataFrame, y: pd.Series,
              train_idx, test_idx) -> dict:
    print("\n[GNN] Checking torch-geometric installation...")
    try:
        import torch
        import torch.nn as nn
        import torch.nn.functional as F
        from torch_geometric.data import Data
        from torch_geometric.nn import SAGEConv
    except ImportError as e:
        print(f"  torch-geometric not installed: {e}")
        print("  Install with: pip install torch torch-geometric")
        print("  Skipping GNN — XGBoost-only comparison will be shown.")
        return None

    print("  torch-geometric found. Building graph...")

    x_tensor = torch.tensor(X.values, dtype=torch.float)
    y_tensor = torch.tensor(y.values, dtype=torch.long)

    edge_index_np = build_edges(X)
    edge_index = torch.tensor(edge_index_np.T, dtype=torch.long)

    data = Data(x=x_tensor, edge_index=edge_index, y=y_tensor)

    # Masks from the same train/test split as XGBoost
    n = len(X)
    train_mask = torch.zeros(n, dtype=torch.bool)
    test_mask  = torch.zeros(n, dtype=torch.bool)
    train_mask[train_idx] = True
    test_mask[test_idx]   = True
    data.train_mask = train_mask
    data.test_mask  = test_mask

    # Handle class imbalance
    fraud_count  = int(y_tensor[train_mask].sum().item())
    normal_count = int(train_mask.sum().item()) - fraud_count
    weight = torch.tensor(
        [1.0, normal_count / max(fraud_count, 1)], dtype=torch.float
    )

    class GraphSageFraud(nn.Module):
        def __init__(self, in_ch, hidden=64, out_ch=2):
            super().__init__()
            self.conv1 = SAGEConv(in_ch, hidden)
            self.conv2 = SAGEConv(hidden, hidden // 2)
            self.fc    = nn.Linear(hidden // 2, out_ch)
            self.drop  = nn.Dropout(p=0.3)

        def forward(self, d):
            z = F.relu(self.conv1(d.x, d.edge_index))
            z = self.drop(z)
            z = F.relu(self.conv2(z, d.edge_index))
            return self.fc(z)

    model     = GraphSageFraud(in_ch=data.num_features)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005,
                                 weight_decay=1e-4)
    criterion = nn.CrossEntropyLoss(weight=weight)

    best_val_f1  = 0.0
    best_state   = None
    EPOCHS       = 300

    # Use a small val split from train for early stopping
    train_indices = train_idx.tolist()
    val_cut = int(len(train_indices) * 0.85)
    val_indices = train_indices[val_cut:]
    tr_indices  = train_indices[:val_cut]

    tr_mask  = torch.zeros(n, dtype=torch.bool)
    val_mask = torch.zeros(n, dtype=torch.bool)
    tr_mask[tr_indices]   = True
    val_mask[val_indices] = True
    data.tr_mask  = tr_mask
    data.val_mask = val_mask

    print(f"  Training GraphSAGE for {EPOCHS} epochs...")
    for epoch in range(1, EPOCHS + 1):
        model.train()
        optimizer.zero_grad()
        out  = model(data)
        loss = criterion(out[data.tr_mask], data.y[data.tr_mask])
        loss.backward()
        optimizer.step()

        if epoch % 50 == 0:
            model.eval()
            with torch.no_grad():
                pred = out.argmax(dim=1)
                vf1  = f1_score(
                    data.y[data.val_mask].numpy(),
                    pred[data.val_mask].numpy(),
                    zero_division=0
                )
                if vf1 >= best_val_f1:
                    best_val_f1 = vf1
                    best_state  = {k: v.clone() for k, v in model.state_dict().items()}
            print(f"  Epoch {epoch:03d} | Loss {loss.item():.4f} | Val F1 {vf1:.4f}")

    if best_state:
        model.load_state_dict(best_state)

    model.eval()
    with torch.no_grad():
        out    = model(data)
        probs  = torch.softmax(out, dim=1)[:, 1]
        preds  = out.argmax(dim=1)

        y_true = data.y[data.test_mask].numpy()
        y_prob = probs[data.test_mask].numpy()
        y_pred = preds[data.test_mask].numpy()

    metrics = compute_metrics(y_true, y_prob, y_pred)
    print(f"  AUC={metrics['auc']}  F1={metrics['f1']}  "
          f"Precision={metrics['precision']}  Recall={metrics['recall']}")
    return metrics


# ─────────────────────────────────────────────
# Comparison table printer
# ─────────────────────────────────────────────

def print_comparison(xgb_m: dict, gnn_m: dict | None):
    print("\n" + "="*62)
    print(" MODEL COMPARISON — XGBoost vs GraphSAGE GNN")
    print("="*62)
    print(f"  {'Metric':<18} {'XGBoost':>12} {'GNN (GraphSAGE)':>16}")
    print("-"*62)

    metrics_to_show = [
        ("AUC",       "auc"),
        ("F1 Score",  "f1"),
        ("Precision", "precision"),
        ("Recall",    "recall"),
        ("Accuracy",  "accuracy"),
    ]

    for label, key in metrics_to_show:
        xval = f"{xgb_m[key]:.4f}"
        if gnn_m:
            gval = f"{gnn_m[key]:.4f}"
            # Mark winner with *
            winner_xgb = float(xgb_m[key]) > float(gnn_m[key])
            xval = xval + (" *" if winner_xgb else "  ")
            gval = gval + (" *" if not winner_xgb else "  ")
        else:
            gval = "not available"
        print(f"  {label:<18} {xval:>12} {gval:>16}")

    print("-"*62)
    print("  * = better score")

    if gnn_m:
        xgb_wins = sum(
            1 for _, k in metrics_to_show
            if xgb_m[k] >= gnn_m[k]
        )
        gnn_wins = len(metrics_to_show) - xgb_wins
        print(f"\n  XGBoost wins: {xgb_wins}/5 metrics")
        print(f"  GNN wins    : {gnn_wins}/5 metrics")

        if xgb_wins > gnn_wins:
            print("\n  Conclusion: XGBoost outperforms GNN on this dataset.")
            print("  This is common with small tabular datasets (<1000 rows).")
            print("  GNN advantage grows with larger, more connected graphs.")
        elif gnn_wins > xgb_wins:
            print("\n  Conclusion: GNN outperforms XGBoost.")
            print("  Graph structure is providing useful relational signals.")
        else:
            print("\n  Conclusion: Both models perform similarly.")

    print("="*62)


# ─────────────────────────────────────────────
# Save results
# ─────────────────────────────────────────────

def save_results(xgb_m: dict, gnn_m: dict | None,
                 csv_path: str, n_samples: int, fraud_rate: float):
    os.makedirs(REPORTS_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path  = os.path.join(REPORTS_DIR,
                             f"gnn_comparison_{timestamp}.json")

    result = {
        "generated_at": datetime.now().isoformat(),
        "csv_source":   csv_path,
        "n_samples":    n_samples,
        "fraud_rate":   round(float(fraud_rate), 4),
        "xgboost":      xgb_m,
        "gnn":          gnn_m,
        "gnn_available": gnn_m is not None,
    }

    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\n  Results saved: {out_path}")
    print("  generate_report.py will include this in the HTML report.")
    return out_path


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Compare GraphSAGE GNN vs XGBoost for fraud detection."
    )
    parser.add_argument("--csv", required=True,
                        help="Path to fraud dataset CSV")
    args = parser.parse_args()

    print("\n" + "="*62)
    print(" GNN vs XGBOOST COMPARISON")
    print("="*62)
    print(f" CSV: {args.csv}")
    print("="*62)

    # Load
    print("\n[1/4] Loading data...")
    X, y = load_data(args.csv)

    # Split — same split used for both models (fair comparison)
    print("\n[2/4] Splitting data (80/20, stratified)...")
    X_train, X_test, y_train, y_test = split_data(X, y)
    train_idx = np.array(X_train.index.tolist())
    test_idx  = np.array(X_test.index.tolist())
    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")

    # XGBoost
    print("\n[3/4] Training XGBoost...")
    xgb_metrics = train_xgboost(X_train, y_train, X_test, y_test)

    # GNN
    print("\n[4/4] Training GNN (GraphSAGE)...")
    gnn_metrics = train_gnn(X, y, train_idx, test_idx)

    # Print comparison
    print_comparison(xgb_metrics, gnn_metrics)

    # Save
    save_results(xgb_metrics, gnn_metrics,
                 args.csv, len(X), float(y.mean()))


if __name__ == "__main__":
    main()
