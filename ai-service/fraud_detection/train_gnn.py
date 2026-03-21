"""
Optional advanced research extension: GraphSAGE fraud classification.

This script is intentionally standalone and optional.
It builds a graph from certificate-level features and trains a simple GraphSAGE model
if torch-geometric is available.

Usage:
  python fraud_detection/train_gnn.py --csv <path_to_csv>
"""

import argparse
import os
import pandas as pd
import numpy as np


def load_csv(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"CSV not found: {path}")
    return pd.read_csv(path)


def build_edges(df):
    """
    Simple edge strategy for research baseline:
    connect nodes that share similar verification behavior buckets.
    """
    edges = []
    buckets = {}

    for idx, row in df.iterrows():
        key = (
            int(row.get("wallet_reuse_count", 0)),
            int(row.get("suspicious_attempts", 0) > 0),
            int(row.get("failed_verifications", 0) > row.get("successful_verifications", 0)),
            int(row.get("unique_verifier_ips", 0) // 3),
        )
        buckets.setdefault(key, []).append(idx)

    for _, indices in buckets.items():
        if len(indices) < 2:
            continue
        for i in range(len(indices) - 1):
            edges.append((indices[i], indices[i + 1]))
            edges.append((indices[i + 1], indices[i]))

    if not edges:
        for i in range(len(df) - 1):
            edges.append((i, i + 1))
            edges.append((i + 1, i))

    return np.array(edges, dtype=np.int64)


def run_training(df):
    try:
        import torch
        import torch.nn as nn
        import torch.nn.functional as F
        from torch_geometric.data import Data
        from torch_geometric.nn import SAGEConv
    except Exception as exc:
        print("torch-geometric not installed. GNN training skipped.")
        print("Install (optional): pip install torch torch-geometric")
        print(f"Reason: {exc}")
        return

    target = "likely_fraud_label"
    ignore = {"certificate_id", "verification_status", "blockchain_network", target}
    feature_cols = [c for c in df.columns if c not in ignore and pd.api.types.is_numeric_dtype(df[c])]

    x = torch.tensor(df[feature_cols].fillna(0).values, dtype=torch.float)
    y = torch.tensor(df[target].astype(int).values, dtype=torch.long)

    edge_index_np = build_edges(df)
    edge_index = torch.tensor(edge_index_np.T, dtype=torch.long)

    data = Data(x=x, edge_index=edge_index, y=y)

    num_nodes = data.num_nodes
    idx = torch.randperm(num_nodes)
    train_cut = int(num_nodes * 0.7)
    val_cut = int(num_nodes * 0.85)

    train_mask = torch.zeros(num_nodes, dtype=torch.bool)
    val_mask = torch.zeros(num_nodes, dtype=torch.bool)
    test_mask = torch.zeros(num_nodes, dtype=torch.bool)

    train_mask[idx[:train_cut]] = True
    val_mask[idx[train_cut:val_cut]] = True
    test_mask[idx[val_cut:]] = True

    data.train_mask = train_mask
    data.val_mask = val_mask
    data.test_mask = test_mask

    class GraphSageFraud(nn.Module):
        def __init__(self, in_channels, hidden=32, out_channels=2):
            super().__init__()
            self.conv1 = SAGEConv(in_channels, hidden)
            self.conv2 = SAGEConv(hidden, hidden)
            self.fc = nn.Linear(hidden, out_channels)

        def forward(self, d):
            z = self.conv1(d.x, d.edge_index)
            z = F.relu(z)
            z = F.dropout(z, p=0.2, training=self.training)
            z = self.conv2(z, d.edge_index)
            z = F.relu(z)
            return self.fc(z)

    model = GraphSageFraud(in_channels=data.num_features)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=5e-4)
    criterion = nn.CrossEntropyLoss()

    best_val = 0
    best_state = None

    for epoch in range(1, 201):
        model.train()
        optimizer.zero_grad()
        out = model(data)
        loss = criterion(out[data.train_mask], data.y[data.train_mask])
        loss.backward()
        optimizer.step()

        model.eval()
        with torch.no_grad():
            pred = out.argmax(dim=1)
            val_acc = (pred[data.val_mask] == data.y[data.val_mask]).float().mean().item()
            if val_acc > best_val:
                best_val = val_acc
                best_state = model.state_dict()

        if epoch % 25 == 0:
            print(f"Epoch {epoch:03d} | Loss {loss.item():.4f} | ValAcc {val_acc:.4f}")

    if best_state is not None:
        model.load_state_dict(best_state)

    model.eval()
    with torch.no_grad():
        out = model(data)
        pred = out.argmax(dim=1)
        test_acc = (pred[data.test_mask] == data.y[data.test_mask]).float().mean().item()
        print(f"GNN Test Accuracy: {test_acc:.4f}")
        print("GNN training complete (research extension).")


def main():
    parser = argparse.ArgumentParser(description="Optional GraphSAGE fraud model training")
    parser.add_argument("--csv", required=True, help="Path to exported fraud dataset CSV")
    args = parser.parse_args()

    df = load_csv(args.csv)
    if "likely_fraud_label" not in df.columns:
        raise ValueError("CSV missing likely_fraud_label")

    print(f"Loaded rows: {len(df)}")
    run_training(df)


if __name__ == "__main__":
    main()
