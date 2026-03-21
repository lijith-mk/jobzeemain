# ML Fraud Detection Research Setup Guide

## Phase 1: Synthetic Data Generation

### Prerequisites
✅ MongoDB Atlas cluster already exists  
✅ Node.js 16+ installed  
✅ `.env` configured with `MONGODB_URI`  

### Step 1: Fix MongoDB Atlas Network Access (IF NEEDED)

If you get error: `Could not connect to any servers in your MongoDB Atlas cluster`

**Solution:**
1. Go to: https://cloud.mongodb.com
2. Login to your cluster
3. Click **Network Access** (left sidebar)
4. Click **Add IP Address**
5. Choose: **Allow Access from Anywhere** (0.0.0.0/0) ← Safest for testing
   - OR: Add your current IP address only
6. Click **Confirm**
7. Wait ~2 minutes for it to propagate

**Verify:** Your `.env` has correct MongoDB URI:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jobzeeDB?retryWrites=true&w=majority
```

---

### Step 2: Generate 100 Synthetic Certificates (No Blockchain Cost)

```bash
npm run ml:generate-synthetic -- --count=100 --onchain=false --logs-min=3 --logs-max=8
```

**What happens:**
- ✅ Creates 100 fake certificate records in MongoDB
- ✅ Creates 3-8 verification logs per certificate (simulating verifications)
- ✅ 12% of certs marked as "likely fraud" for training
- ✅ Outputs summary JSON to `data/ml/synthetic_run_*.json`
- ⏱️ Takes ~3-5 minutes

**Expected output:**
```
Certificates created: 100
On-chain success: 0
On-chain failed: 0
Verification logs created: 523
Failed records: 0
```

---

### Step 3: Export CSV Dataset (For ML Training)

```bash
npm run ml:export-dataset
```

**What happens:**
- ✅ Reads all certificates + verification logs
- ✅ Extracts 31 features (completion score, verification frequency, blockchain delay, etc.)
- ✅ Generates `likely_fraud_label` (0 = normal, 1 = fraud)
- ✅ Outputs CSV to `data/ml/fraud_dataset_*.csv`

**Expected output:**
```
Rows exported: 100
Likely fraud rows: 12
Likely normal rows: 88
CSV output: jobzee-backend/data/ml/fraud_dataset_1711022400000.csv
```

---

### Step 4: What You'll Have

**MongoDB Collections:**
- `certificates` - 100+ synthetic certificate records
- `certificateverificationlogs` - 500+ verification attempt logs

**CSV File:**
```
certificate_id,verification_status,is_revoked,has_blockchain_tx,...,likely_fraud_label
SYN-CERT-2026-00001-A1B2,verified,0,0,...,0
SYN-CERT-2026-00002-C3D4,verified,1,0,...,1
```

---

### Step 5: Next - Python EDA & Model Training

Once you have the CSV, move to Phase 2:

```bash
# Create Python environment
python -m venv venv
source venv/bin/activate  # or on Windows: venv\Scripts\activate

# Install ML dependencies
pip install pandas matplotlib seaborn scikit-learn xgboost shap jupyter

# Start Jupyter notebook
jupyter notebook
```

Then run EDA on the CSV using the notebook in Phase 2.

---

## Optional: On-Chain Certificate Registration

If you want blockchain registration too:

```bash
npm run ml:generate-synthetic -- --count=50 --onchain=true --logs-min=2 --logs-max=5
```

**Note:** This costs ~$2-3 USD in Sepolia gas (testing network).
- Wallet has 0.157 ETH (~$50 worth)
- Can afford 1000+ certificates

---

## Troubleshooting

### "ECONNREFUSED" or connection timeout
→ Check MongoDB Atlas network whitelist (Step 1)

### "Module not found"
→ Run `npm install` in jobzee-backend/

### "Cannot create directory"
→ The script auto-creates `data/ml/` folder, should work fine

### "Out of memory"
→ Reduce `--count` parameter (e.g., `--count=50`)

---

## Commands Reference

```bash
# Generate synthetic data (offline, no gas cost)
npm run ml:generate-synthetic -- --count=100 --onchain=false --logs-min=3 --logs-max=8

# Export to CSV (requires --count certificates to exist)
npm run ml:export-dataset

# Generate with blockchain registration (costs gas)
npm run ml:generate-synthetic -- --count=50 --onchain=true

# Clear and regenerate (delete old MongoDB data first)
# (Use MongoDB Atlas UI to delete collections, then run generation again)
```

---

## Next Steps

**After CSV export:**
1. ✅ Phase 2: EDA + visualization (matplotlib/seaborn)
2. ✅ Phase 3: Feature engineering (pandas)
3. ✅ Phase 4: XGBoost baseline training
4. ✅ Phase 5: SHAP explainability
5. ✅ Phase 6: OPTIONAL GNN advanced research
6. ✅ Phase 7: Backend integration (Flask API)
7. ✅ Phase 8: Documentation & research paper
