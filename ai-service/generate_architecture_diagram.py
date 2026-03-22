"""
generate_architecture_diagram.py
Generates architecture.png for the BlockShield research paper.

Usage:
    python generate_architecture_diagram.py

Output:
    ai-service/reports/architecture.png
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

OUTPUT = os.path.join(os.path.dirname(__file__), "reports", "architecture.png")
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

fig, ax = plt.subplots(figsize=(12, 8))
ax.set_xlim(0, 12)
ax.set_ylim(0, 8)
ax.axis('off')
fig.patch.set_facecolor('white')

# ── colour palette ──────────────────────────────────────────────
C_USER   = '#D6EAF8'
C_APP    = '#D5F5E3'
C_BLOCK  = '#FDEBD0'
C_AI     = '#F9EBEA'
C_BORDER = '#2C3E50'
C_ARROW  = '#2C3E50'

def box(ax, x, y, w, h, color, title, lines=(), fontsize=9):
    rect = FancyBboxPatch((x, y), w, h,
                          boxstyle="round,pad=0.1",
                          linewidth=1.5,
                          edgecolor=C_BORDER,
                          facecolor=color)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h - 0.28, title,
            ha='center', va='top',
            fontsize=fontsize+1, fontweight='bold', color=C_BORDER)
    for i, line in enumerate(lines):
        ax.text(x + w/2, y + h - 0.62 - i*0.38, line,
                ha='center', va='top',
                fontsize=fontsize, color='#2C3E50')

def arrow(ax, x1, y1, x2, y2):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=C_ARROW,
                                lw=1.8, connectionstyle='arc3,rad=0.0'))

# ── Layer 1: User ───────────────────────────────────────────────
box(ax, 3.5, 6.4, 5, 1.2, C_USER, 'USER / BROWSER',
    ('React Web Application', 'Certificate Verification Portal'))

# ── Layer 2: Application ────────────────────────────────────────
box(ax, 1.0, 4.2, 10, 1.8, C_APP, 'APPLICATION LAYER',
    ('Node.js / Express REST API',
     'Certificate Issuance  |  Eligibility Check  |  Admin Dashboard',
     'Course Progress  |  Quiz Scoring  |  PDF Generation'))

# ── Layer 3a: Blockchain ────────────────────────────────────────
box(ax, 0.5, 1.2, 4.5, 2.6, C_BLOCK, 'BLOCKCHAIN LAYER',
    ('Ethereum Sepolia Testnet',
     'CertificateRegistry.sol',
     'registerCertificate(id, hash)',
     'verifyCertificate(id, hash)',
     'SHA-256 Tamper Detection'))

# ── Layer 3b: AI Scoring ────────────────────────────────────────
box(ax, 7.0, 1.2, 4.5, 2.6, C_AI, 'AI SCORING LAYER',
    ('FastAPI Microservice',
     'XGBoost Fraud Classifier',
     '24 Behavioural Features',
     'SHAP TreeExplainer',
     'Circuit Breaker + Cache'))

# ── Arrows ──────────────────────────────────────────────────────
# User ↔ App
arrow(ax, 6.0, 6.4,  6.0, 6.0)
arrow(ax, 6.0, 6.0,  6.0, 6.4)

# App → Blockchain
arrow(ax, 3.5, 4.2,  2.75, 3.8)

# App → AI
arrow(ax, 8.5, 4.2,  9.25, 3.8)

# ── Legend ──────────────────────────────────────────────────────
legend_items = [
    mpatches.Patch(facecolor=C_USER,  edgecolor=C_BORDER, label='Presentation Layer'),
    mpatches.Patch(facecolor=C_APP,   edgecolor=C_BORDER, label='Application Layer'),
    mpatches.Patch(facecolor=C_BLOCK, edgecolor=C_BORDER, label='Blockchain Layer'),
    mpatches.Patch(facecolor=C_AI,    edgecolor=C_BORDER, label='AI Scoring Layer'),
]
ax.legend(handles=legend_items, loc='lower center',
          ncol=4, fontsize=8.5, frameon=True,
          bbox_to_anchor=(0.5, 0.01))

ax.set_title('BlockShield — System Architecture',
             fontsize=13, fontweight='bold', pad=10, color=C_BORDER)

plt.tight_layout()
plt.savefig(OUTPUT, dpi=180, bbox_inches='tight', facecolor='white')
print(f"Saved: {OUTPUT}")
