"""
generate_report.py — SHAP Research Report Generator

Generates a self-contained HTML report with:
  - Model performance summary (AUC, F1, Precision, Recall, Confusion Matrix)
  - Feature importance bar chart (mean |SHAP|)
  - SHAP beeswarm summary plot
  - Per-feature SHAP distribution details

Usage:
    python generate_report.py --csv path/to/fraud_dataset.csv

Output:
    ai-service/reports/fraud_shap_report_YYYYMMDD_HHMMSS.html

Open the HTML file in any browser. It is fully self-contained (charts are
embedded as base64 images) — no internet connection needed.
"""

import argparse
import base64
import glob
import io
import os
import pickle
from datetime import datetime

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend — no display needed
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import pandas as pd
import shap
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, recall_score, confusion_matrix
)
from sklearn.model_selection import train_test_split


# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────

MODELS_DIR  = os.path.join(os.path.dirname(__file__), "models")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
ACTIVE_MODEL = os.path.join(MODELS_DIR, "xgboost_fraud_model.pkl")
DROP_COLS = ["certificate_id", "likely_fraud_label", "blockchain_network", "verification_status"]

RISK_COLORS = {
    "increases_fraud": "#ef4444",   # red
    "decreases_fraud": "#22c55e",   # green
}


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return encoded


def _load_model():
    target = ACTIVE_MODEL
    if not os.path.exists(target):
        versioned = sorted(
            [f for f in os.listdir(MODELS_DIR)
             if f.startswith("xgboost_fraud_model_v_") and f.endswith(".pkl")],
            reverse=True
        )
        if not versioned:
            raise FileNotFoundError("No trained model found. Run retrain.py first.")
        target = os.path.join(MODELS_DIR, versioned[0])
        print(f"  Using versioned model: {versioned[0]}")

    with open(target, "rb") as f:
        model = pickle.load(f)
    print(f"  Model loaded: {target}")
    return model


def _load_meta() -> dict:
    """Load the latest _meta.txt written by retrain.py."""
    files = sorted(
        glob.glob(os.path.join(MODELS_DIR, "xgboost_fraud_model_v_*_meta.txt")),
        reverse=True
    )
    if not files:
        return {}
    meta = {}
    with open(files[0]) as f:
        for line in f:
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip().lower().replace(" ", "_")] = v.strip()
    return meta


# ─────────────────────────────────────────────
# Chart generators
# ─────────────────────────────────────────────

def _chart_confusion_matrix(cm_values: dict) -> str:
    tn = cm_values.get("tn", 0)
    fp = cm_values.get("fp", 0)
    fn = cm_values.get("fn", 0)
    tp = cm_values.get("tp", 0)

    matrix = np.array([[tn, fp], [fn, tp]])
    labels = [["TN", "FP"], ["FN", "TP"]]
    colors = [["#bbf7d0", "#fecaca"], ["#fed7aa", "#bbf7d0"]]

    fig, ax = plt.subplots(figsize=(4, 3.5))
    ax.set_facecolor("#f9fafb")
    fig.patch.set_facecolor("#f9fafb")

    for i in range(2):
        for j in range(2):
            ax.add_patch(mpatches.FancyBboxPatch(
                (j + 0.05, 1 - i + 0.05), 0.9, 0.9,
                boxstyle="round,pad=0.05",
                facecolor=colors[i][j], edgecolor="white", linewidth=2
            ))
            ax.text(j + 0.5, 1 - i + 0.55, str(matrix[i][j]),
                    ha="center", va="center", fontsize=22, fontweight="bold", color="#1e293b")
            ax.text(j + 0.5, 1 - i + 0.2, labels[i][j],
                    ha="center", va="center", fontsize=10, color="#64748b")

    ax.set_xlim(0, 2)
    ax.set_ylim(0, 2)
    ax.set_xticks([0.5, 1.5])
    ax.set_xticklabels(["Predicted Normal", "Predicted Fraud"], fontsize=9)
    ax.set_yticks([0.5, 1.5])
    ax.set_yticklabels(["Actual Fraud", "Actual Normal"], fontsize=9)
    ax.tick_params(length=0)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.set_title("Confusion Matrix", fontsize=11, fontweight="bold", pad=10, color="#1e293b")
    fig.tight_layout()
    return _fig_to_base64(fig)


def _chart_feature_importance(shap_values: np.ndarray, feature_names: list) -> str:
    mean_abs = np.abs(shap_values).mean(axis=0)
    sorted_idx = np.argsort(mean_abs)
    top_n = min(15, len(feature_names))
    idx = sorted_idx[-top_n:]

    fig, ax = plt.subplots(figsize=(8, 5))
    fig.patch.set_facecolor("#f9fafb")
    ax.set_facecolor("#f9fafb")

    bars = ax.barh(
        [feature_names[i].replace("_", " ") for i in idx],
        mean_abs[idx],
        color="#6366f1",
        edgecolor="white",
        height=0.65
    )
    # Add value labels
    for bar, val in zip(bars, mean_abs[idx]):
        ax.text(val + 0.001, bar.get_y() + bar.get_height() / 2,
                f"{val:.4f}", va="center", fontsize=8, color="#475569")

    ax.set_xlabel("Mean |SHAP value|", fontsize=10, color="#475569")
    ax.set_title("Feature Importance (Mean Absolute SHAP)", fontsize=12,
                 fontweight="bold", color="#1e293b", pad=12)
    ax.tick_params(axis="y", labelsize=9, colors="#475569")
    ax.tick_params(axis="x", labelsize=8, colors="#94a3b8")
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)
    ax.spines["left"].set_color("#e2e8f0")
    ax.spines["bottom"].set_color("#e2e8f0")
    fig.tight_layout()
    return _fig_to_base64(fig)


def _chart_beeswarm(shap_values: np.ndarray, X: pd.DataFrame) -> str:
    """
    Custom beeswarm-style dot plot — each dot is one certificate,
    colored red (increases fraud) or green (decreases fraud).
    """
    top_n = min(12, X.shape[1])
    mean_abs = np.abs(shap_values).mean(axis=0)
    top_idx = np.argsort(mean_abs)[-top_n:][::-1]

    fig, ax = plt.subplots(figsize=(9, 6))
    fig.patch.set_facecolor("#f9fafb")
    ax.set_facecolor("#f9fafb")

    for plot_i, feat_i in enumerate(top_idx):
        sv = shap_values[:, feat_i]
        fv = X.iloc[:, feat_i].values

        # Normalize feature values to [0,1] for color intensity
        fv_norm = (fv - fv.min()) / (fv.max() - fv.min() + 1e-9)
        colors = plt.cm.RdYlGn_r(fv_norm)  # red = high value, green = low value

        # Jitter y position
        jitter = np.random.uniform(-0.3, 0.3, size=len(sv))
        y = np.full(len(sv), plot_i) + jitter

        ax.scatter(sv, y, c=colors, alpha=0.6, s=18, linewidths=0)

    ax.set_yticks(range(top_n))
    ax.set_yticklabels(
        [X.columns[i].replace("_", " ") for i in top_idx],
        fontsize=9, color="#475569"
    )
    ax.axvline(0, color="#94a3b8", linewidth=1, linestyle="--")
    ax.set_xlabel("SHAP value  (← decreases fraud  |  increases fraud →)",
                  fontsize=9, color="#475569")
    ax.set_title("SHAP Beeswarm — Feature Impact per Certificate",
                 fontsize=12, fontweight="bold", color="#1e293b", pad=12)
    ax.tick_params(axis="x", labelsize=8, colors="#94a3b8")
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)
    ax.spines["left"].set_color("#e2e8f0")
    ax.spines["bottom"].set_color("#e2e8f0")

    # Colorbar legend
    sm = plt.cm.ScalarMappable(cmap="RdYlGn_r", norm=plt.Normalize(0, 1))
    sm.set_array([])
    cbar = fig.colorbar(sm, ax=ax, orientation="vertical", fraction=0.02, pad=0.02)
    cbar.set_label("Feature value\n(low → high)", fontsize=8, color="#475569")
    cbar.ax.tick_params(labelsize=7)

    fig.tight_layout()
    return _fig_to_base64(fig)


def _chart_shap_distribution(shap_values: np.ndarray, feature_names: list) -> list:
    """Per-feature SHAP violin/box mini charts — returns list of (feature_name, base64)."""
    mean_abs = np.abs(shap_values).mean(axis=0)
    top_idx = np.argsort(mean_abs)[-6:][::-1]  # top 6 features

    charts = []
    for feat_i in top_idx:
        sv = shap_values[:, feat_i]
        fname = feature_names[feat_i].replace("_", " ")

        fig, ax = plt.subplots(figsize=(4, 2))
        fig.patch.set_facecolor("#f9fafb")
        ax.set_facecolor("#f9fafb")

        color = "#ef4444" if sv.mean() > 0 else "#22c55e"
        ax.hist(sv, bins=20, color=color, alpha=0.75, edgecolor="white")
        ax.axvline(0, color="#94a3b8", linewidth=1, linestyle="--")
        ax.axvline(sv.mean(), color=color, linewidth=1.5, linestyle="-",
                   label=f"mean={sv.mean():.4f}")
        ax.set_title(fname, fontsize=9, fontweight="bold", color="#1e293b")
        ax.tick_params(labelsize=7, colors="#94a3b8")
        ax.legend(fontsize=7, framealpha=0)
        for spine in ["top", "right"]:
            ax.spines[spine].set_visible(False)
        ax.spines["left"].set_color("#e2e8f0")
        ax.spines["bottom"].set_color("#e2e8f0")
        fig.tight_layout()

        charts.append((fname, _fig_to_base64(fig)))

    return charts


# ─────────────────────────────────────────────
# HTML builder
# ─────────────────────────────────────────────

def _build_html(
    meta: dict,
    perf: dict,
    img_cm: str,
    img_importance: str,
    img_beeswarm: str,
    dist_charts: list,
    n_samples: int,
    fraud_rate: float,
    csv_path: str,
) -> str:
    now = datetime.now().strftime("%B %d, %Y %H:%M")

    def metric_card(label, value, note, color):
        return f"""
        <div class="metric-card">
          <div class="metric-label">{label}</div>
          <div class="metric-value" style="color:{color}">{value}</div>
          <div class="metric-note">{note}</div>
        </div>"""

    auc_color  = "#16a34a" if perf["auc"]  >= 0.75 else ("#f59e0b" if perf["auc"]  >= 0.60 else "#dc2626")
    f1_color   = "#16a34a" if perf["f1"]   >= 0.65 else ("#f59e0b" if perf["f1"]   >= 0.50 else "#dc2626")
    prec_color = "#16a34a" if perf["prec"] >= 0.65 else ("#f59e0b" if perf["prec"] >= 0.50 else "#dc2626")
    rec_color  = "#16a34a" if perf["rec"]  >= 0.65 else ("#f59e0b" if perf["rec"]  >= 0.50 else "#dc2626")

    dist_html = "".join(
        f'<div class="dist-item"><img src="data:image/png;base64,{b64}" alt="{name}"/></div>'
        for name, b64 in dist_charts
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Fraud Detection — SHAP Research Report</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #1e293b; }}
  .page {{ max-width: 960px; margin: 0 auto; padding: 32px 24px; }}
  h1 {{ font-size: 28px; font-weight: 800; color: #1e293b; }}
  h2 {{ font-size: 18px; font-weight: 700; color: #334155; margin: 32px 0 12px; border-left: 4px solid #6366f1; padding-left: 12px; }}
  h3 {{ font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 8px; }}
  .subtitle {{ color: #64748b; font-size: 14px; margin-top: 6px; }}
  .badge {{ display:inline-block; background:#ede9fe; color:#6d28d9; font-size:11px; font-weight:600; padding:3px 10px; border-radius:99px; margin-right:6px; }}
  .section {{ background:#fff; border-radius:12px; padding:24px; margin-bottom:24px; box-shadow:0 1px 4px rgba(0,0,0,0.07); }}
  .metrics-row {{ display:flex; gap:16px; flex-wrap:wrap; }}
  .metric-card {{ flex:1; min-width:140px; background:#f8fafc; border-radius:10px; padding:16px; text-align:center; border:1px solid #e2e8f0; }}
  .metric-label {{ font-size:12px; color:#64748b; margin-bottom:4px; }}
  .metric-value {{ font-size:28px; font-weight:800; }}
  .metric-note {{ font-size:11px; color:#94a3b8; margin-top:4px; }}
  .chart-full img {{ width:100%; border-radius:8px; }}
  .dist-grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }}
  .dist-item img {{ width:100%; border-radius:8px; }}
  .info-table {{ width:100%; border-collapse:collapse; font-size:13px; }}
  .info-table td {{ padding:8px 12px; border-bottom:1px solid #f1f5f9; }}
  .info-table td:first-child {{ color:#64748b; width:160px; }}
  .info-table td:last-child {{ font-weight:600; color:#1e293b; }}
  .legend {{ display:flex; gap:16px; font-size:12px; color:#64748b; margin-top:8px; }}
  .legend-dot {{ width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:4px; }}
  footer {{ text-align:center; font-size:12px; color:#94a3b8; margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; }}
</style>
</head>
<body>
<div class="page">

  <div class="section">
    <h1>Fraud Detection — SHAP Research Report</h1>
    <p class="subtitle">Generated: {now} &nbsp;|&nbsp; JobZee Certificate Fraud Detection System</p>
    <div style="margin-top:12px">
      <span class="badge">XGBoost</span>
      <span class="badge">SHAP TreeExplainer</span>
      <span class="badge">Binary Classification</span>
    </div>
  </div>

  <div class="section">
    <h2>Dataset Summary</h2>
    <table class="info-table">
      <tr><td>CSV Source</td><td>{csv_path}</td></tr>
      <tr><td>Total Samples</td><td>{n_samples}</td></tr>
      <tr><td>Fraud Rate</td><td>{fraud_rate:.1%}</td></tr>
      <tr><td>Model Trained</td><td>{meta.get("trained", "unknown")}</td></tr>
      <tr><td>Model Version</td><td>{meta.get("csv_source", "—")}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Model Performance</h2>
    <div class="metrics-row">
      {metric_card("AUC", f"{perf['auc']:.4f}", "1.0 = perfect, 0.5 = random", auc_color)}
      {metric_card("F1 Score", f"{perf['f1']:.4f}", "Precision-Recall balance", f1_color)}
      {metric_card("Precision", f"{perf['prec']:.4f}", "Flagged fraud that is real", prec_color)}
      {metric_card("Recall", f"{perf['rec']:.4f}", "Real fraud that was caught", rec_color)}
    </div>
  </div>

  <div class="section">
    <h2>Confusion Matrix</h2>
    <div style="max-width:360px">
      <div class="chart-full"><img src="data:image/png;base64,{img_cm}" alt="Confusion Matrix"/></div>
    </div>
    <div class="legend" style="margin-top:12px">
      <span><span class="legend-dot" style="background:#bbf7d0"></span>TN — Normal correctly cleared</span>
      <span><span class="legend-dot" style="background:#bbf7d0"></span>TP — Fraud correctly flagged</span>
      <span><span class="legend-dot" style="background:#fecaca"></span>FP — Normal wrongly flagged</span>
      <span><span class="legend-dot" style="background:#fed7aa"></span>FN — Fraud missed</span>
    </div>
  </div>

  <div class="section">
    <h2>Feature Importance (Mean |SHAP|)</h2>
    <p style="font-size:13px;color:#64748b;margin-bottom:16px">
      Each bar shows the average absolute SHAP contribution of that feature across all certificates.
      Longer bar = stronger influence on the fraud prediction.
    </p>
    <div class="chart-full"><img src="data:image/png;base64,{img_importance}" alt="Feature Importance"/></div>
  </div>

  <div class="section">
    <h2>SHAP Beeswarm Plot</h2>
    <p style="font-size:13px;color:#64748b;margin-bottom:16px">
      Each dot is one certificate. Position on the X-axis shows how much that feature pushed the
      fraud score up (right, red) or down (left, green). Dot color shows the raw feature value
      (red = high, green = low).
    </p>
    <div class="chart-full"><img src="data:image/png;base64,{img_beeswarm}" alt="SHAP Beeswarm"/></div>
  </div>

  <div class="section">
    <h2>Top Feature SHAP Distributions</h2>
    <p style="font-size:13px;color:#64748b;margin-bottom:16px">
      Histogram of SHAP values for the 6 most influential features.
      Dashed line = zero, solid line = mean SHAP value.
    </p>
    <div class="dist-grid">{dist_html}</div>
  </div>

  <footer>
    JobZee Fraud Detection System &nbsp;|&nbsp; XGBoost + SHAP &nbsp;|&nbsp; {now}
  </footer>

</div>
</body>
</html>"""


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate a SHAP research report for the fraud detection model."
    )
    parser.add_argument(
        "--csv", required=True,
        help="Path to fraud dataset CSV (same one used for retraining)"
    )
    args = parser.parse_args()

    print("\n" + "="*60)
    print(" JOBZEE FRAUD DETECTION — SHAP REPORT GENERATOR")
    print("="*60)

    # ── Load model ──────────────────────────────────────────────
    print("\n[1/5] Loading model...")
    model = _load_model()
    meta  = _load_meta()

    # ── Load data ───────────────────────────────────────────────
    print("[2/5] Loading dataset...")
    df = pd.read_csv(args.csv)
    drop = [c for c in DROP_COLS if c in df.columns]
    X = df.drop(columns=drop).select_dtypes(include=[np.number]).fillna(0)
    y = df["likely_fraud_label"].astype(int)

    fraud_rate = y.mean()
    print(f"  Samples: {len(X)} | Fraud rate: {fraud_rate:.1%}")

    # Use test split for metrics (same seed as retrain.py)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Compute metrics ─────────────────────────────────────────
    print("[3/5] Computing metrics...")
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    perf = {
        "auc":  roc_auc_score(y_test, y_prob),
        "f1":   f1_score(y_test, y_pred, zero_division=0),
        "prec": precision_score(y_test, y_pred, zero_division=0),
        "rec":  recall_score(y_test, y_pred, zero_division=0),
    }
    cm = confusion_matrix(y_test, y_pred)
    cm_values = {"tn": int(cm[0][0]), "fp": int(cm[0][1]),
                 "fn": int(cm[1][0]), "tp": int(cm[1][1])}

    print(f"  AUC={perf['auc']:.4f}  F1={perf['f1']:.4f}  "
          f"Precision={perf['prec']:.4f}  Recall={perf['rec']:.4f}")

    # ── Compute SHAP values ──────────────────────────────────────
    print("[4/5] Computing SHAP values (may take 30-60 seconds)...")
    explainer   = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)

    # For XGBoost binary, shap_values may be list [neg, pos] or 2D array
    if isinstance(shap_values, list):
        sv = shap_values[1]
    else:
        sv = shap_values

    feature_names = list(X.columns)
    print(f"  SHAP computed for {sv.shape[0]} samples × {sv.shape[1]} features")

    # ── Generate charts ──────────────────────────────────────────
    print("[5/5] Generating charts and building report...")
    np.random.seed(42)

    img_cm         = _chart_confusion_matrix(cm_values)
    img_importance = _chart_feature_importance(sv, feature_names)
    img_beeswarm   = _chart_beeswarm(sv, X)
    dist_charts    = _chart_shap_distribution(sv, feature_names)

    # ── Build HTML ───────────────────────────────────────────────
    html = _build_html(
        meta=meta,
        perf=perf,
        img_cm=img_cm,
        img_importance=img_importance,
        img_beeswarm=img_beeswarm,
        dist_charts=dist_charts,
        n_samples=len(X),
        fraud_rate=fraud_rate,
        csv_path=args.csv,
    )

    # ── Save ─────────────────────────────────────────────────────
    os.makedirs(REPORTS_DIR, exist_ok=True)
    timestamp   = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(REPORTS_DIR, f"fraud_shap_report_{timestamp}.html")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\n{'='*60}")
    print(f" REPORT SAVED")
    print(f"{'='*60}")
    print(f" {output_path}")
    print(f"\n Open it in any browser — no internet needed.")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
