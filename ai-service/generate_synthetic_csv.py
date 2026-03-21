"""
generate_synthetic_csv.py — Pure Python synthetic fraud dataset generator.

No MongoDB needed. Generates a realistic CSV directly for research/training.

Usage:
    python generate_synthetic_csv.py --count 1000 --fraud-rate 0.15

Output:
    ai-service/../jobzee-backend/data/ml/synthetic_<timestamp>.csv
"""

import argparse
import os
import random
import string
from datetime import datetime, timedelta

import numpy as np
import pandas as pd


OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "jobzee-backend", "data", "ml")
SEED = 42


def rand_ip(suspicious=False):
    if suspicious:
        # Suspicious IPs cluster in narrow ranges
        return f"10.10.{random.randint(1,5)}.{random.randint(2,254)}"
    return f"172.16.{random.randint(1,30)}.{random.randint(2,254)}"


def build_normal_cert(idx, rng):
    """A legitimate certificate — completed course, normal verification pattern."""
    total_lessons   = rng.integers(8, 40)
    total_quizzes   = rng.integers(2, 12)
    passed_quizzes  = rng.integers(max(1, total_quizzes - 2), total_quizzes + 1)
    avg_quiz_score  = rng.uniform(60, 99)
    age_hours       = rng.uniform(24, 4000)
    total_verif     = rng.integers(1, 15)
    failed_verif    = rng.integers(0, max(1, int(total_verif * 0.1)))
    succ_verif      = total_verif - failed_verif
    suspicious      = 0
    unique_ips      = rng.integers(1, min(total_verif + 1, 8))
    unique_uas      = rng.integers(1, min(unique_ips + 1, 5))
    has_blockchain  = 1 if rng.random() > 0.25 else 0
    wallet_reuse    = rng.integers(1, 3) if has_blockchain else 0
    blockchain_delay = rng.uniform(1, 60) if has_blockchain else -1

    return {
        "certificate_id":          f"CERT-NORM-{idx:06d}",
        "is_revoked":              0,
        "has_blockchain_tx":       has_blockchain,
        "has_wallet_address":      has_blockchain,
        "wallet_reuse_count":      int(wallet_reuse),
        "honors":                  1 if avg_quiz_score >= 92 else 0,
        "grade_numeric":           min(7, max(1, int((avg_quiz_score - 55) / 7))),
        "completion_percentage":   100,
        "total_lessons":           int(total_lessons),
        "completed_lessons":       int(total_lessons),
        "total_quizzes":           int(total_quizzes),
        "passed_quizzes":          int(min(passed_quizzes, total_quizzes)),
        "average_quiz_score":      round(float(avg_quiz_score), 2),
        "total_time_spent_min":    int(rng.integers(120, 3600)),
        "certificate_age_hours":   round(float(age_hours), 2),
        "blockchain_delay_minutes":round(float(blockchain_delay), 2),
        "total_verifications":     int(total_verif),
        "successful_verifications":int(succ_verif),
        "failed_verifications":    int(failed_verif),
        "suspicious_attempts":     int(suspicious),
        "unique_verifier_ips":     int(unique_ips),
        "unique_user_agents":      int(unique_uas),
        "avg_response_time_ms":    round(float(rng.uniform(50, 400)), 2),
        "max_suspicious_score":    round(float(rng.uniform(0, 15)), 2),
        "verification_window_hours":round(float(rng.uniform(0, age_hours * 0.3)), 2),
        "likely_fraud_label":      0,
    }


def build_fraud_cert(idx, rng):
    """A fraudulent certificate — multiple red flags present."""
    fraud_type = rng.integers(0, 4)  # 4 distinct fraud patterns

    if fraud_type == 0:
        # Pattern: mass verification from bots — credential stuffing
        total_verif    = rng.integers(20, 80)
        failed_verif   = rng.integers(int(total_verif * 0.4), total_verif)
        succ_verif     = total_verif - failed_verif
        suspicious     = rng.integers(int(total_verif * 0.3), total_verif)
        unique_ips     = rng.integers(1, 4)   # few IPs, many attempts
        unique_uas     = rng.integers(1, 3)
        max_susp_score = rng.uniform(60, 100)
        avg_quiz       = rng.uniform(55, 75)
        has_blockchain = 0
        wallet_reuse   = 0
        age_hours      = rng.uniform(1, 48)   # very new cert, already being hammered

    elif fraud_type == 1:
        # Pattern: revoked certificate still being verified
        total_verif    = rng.integers(5, 30)
        failed_verif   = rng.integers(int(total_verif * 0.5), total_verif)
        succ_verif     = total_verif - failed_verif
        suspicious     = rng.integers(2, 10)
        unique_ips     = rng.integers(2, 8)
        unique_uas     = rng.integers(1, 4)
        max_susp_score = rng.uniform(40, 80)
        avg_quiz       = rng.uniform(55, 85)
        has_blockchain = rng.integers(0, 2)
        wallet_reuse   = rng.integers(3, 8) if has_blockchain else 0
        age_hours      = rng.uniform(100, 2000)

    elif fraud_type == 2:
        # Pattern: wallet reuse — same wallet registered many certs
        total_verif    = rng.integers(3, 20)
        failed_verif   = rng.integers(0, max(1, int(total_verif * 0.3)))
        succ_verif     = total_verif - failed_verif
        suspicious     = rng.integers(1, 5)
        unique_ips     = rng.integers(1, 6)
        unique_uas     = rng.integers(1, 4)
        max_susp_score = rng.uniform(20, 60)
        avg_quiz       = rng.uniform(60, 90)
        has_blockchain = 1
        wallet_reuse   = rng.integers(8, 25)  # same wallet on many certs
        age_hours      = rng.uniform(24, 500)

    else:
        # Pattern: impossible completion — too fast, no time spent
        total_verif    = rng.integers(1, 10)
        failed_verif   = rng.integers(0, 3)
        succ_verif     = total_verif - failed_verif
        suspicious     = rng.integers(0, 3)
        unique_ips     = rng.integers(1, 5)
        unique_uas     = rng.integers(1, 3)
        max_susp_score = rng.uniform(10, 40)
        avg_quiz       = rng.uniform(95, 100)  # suspiciously perfect
        has_blockchain = rng.integers(0, 2)
        wallet_reuse   = rng.integers(0, 3)
        age_hours      = rng.uniform(0.1, 5)   # cert issued and verified within hours

    total_lessons  = rng.integers(8, 40)
    total_quizzes  = rng.integers(2, 12)
    passed_quizzes = rng.integers(max(1, total_quizzes - 2), total_quizzes + 1)
    blockchain_delay = rng.uniform(-5, 10) if has_blockchain else -1

    return {
        "certificate_id":          f"CERT-FRAUD-{idx:06d}",
        "is_revoked":              1 if fraud_type == 1 else 0,
        "has_blockchain_tx":       int(has_blockchain),
        "has_wallet_address":      int(has_blockchain),
        "wallet_reuse_count":      int(wallet_reuse),
        "honors":                  1 if avg_quiz >= 92 else 0,
        "grade_numeric":           min(7, max(1, int((avg_quiz - 55) / 7))),
        "completion_percentage":   100,
        "total_lessons":           int(total_lessons),
        "completed_lessons":       int(total_lessons),
        "total_quizzes":           int(total_quizzes),
        "passed_quizzes":          int(min(passed_quizzes, total_quizzes)),
        "average_quiz_score":      round(float(avg_quiz), 2),
        "total_time_spent_min":    int(rng.integers(1, 30)) if fraud_type == 3 else int(rng.integers(120, 3600)),
        "certificate_age_hours":   round(float(age_hours), 2),
        "blockchain_delay_minutes":round(float(blockchain_delay), 2),
        "total_verifications":     int(total_verif),
        "successful_verifications":int(succ_verif),
        "failed_verifications":    int(failed_verif),
        "suspicious_attempts":     int(suspicious),
        "unique_verifier_ips":     int(unique_ips),
        "unique_user_agents":      int(unique_uas),
        "avg_response_time_ms":    round(float(rng.uniform(50, 800)), 2),
        "max_suspicious_score":    round(float(max_susp_score), 2),
        "verification_window_hours":round(float(rng.uniform(0, age_hours * 0.8 + 0.1)), 2),
        "likely_fraud_label":      1,
    }


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic fraud dataset CSV")
    parser.add_argument("--count",      type=int,   default=1000, help="Total rows (default 1000)")
    parser.add_argument("--fraud-rate", type=float, default=0.15, help="Fraction that are fraud (default 0.15)")
    args = parser.parse_args()

    rng = np.random.default_rng(SEED)
    random.seed(SEED)

    n_fraud  = int(args.count * args.fraud_rate)
    n_normal = args.count - n_fraud

    print(f"\n{'='*60}")
    print(f" SYNTHETIC FRAUD DATASET GENERATOR")
    print(f"{'='*60}")
    print(f"  Total rows  : {args.count}")
    print(f"  Normal      : {n_normal}")
    print(f"  Fraud       : {n_fraud} ({args.fraud_rate:.0%})")

    rows = []
    for i in range(n_normal):
        rows.append(build_normal_cert(i, rng))
    for i in range(n_fraud):
        rows.append(build_fraud_cert(i, rng))

    # Shuffle
    rng.shuffle(rows)

    df = pd.DataFrame(rows)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp   = int(datetime.now().timestamp() * 1000)
    output_path = os.path.join(OUTPUT_DIR, f"fraud_dataset_{timestamp}.csv")
    df.to_csv(output_path, index=False)

    print(f"\n  Saved to    : {output_path}")
    print(f"\n  Next steps:")
    print(f"    Retrain XGBoost : python retrain.py --csv {output_path}")
    print(f"    Run comparison  : python fraud_detection/train_gnn.py --csv {output_path}")
    print(f"    Generate report : python generate_report.py --csv {output_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
