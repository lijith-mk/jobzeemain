#!/usr/bin/env python3
"""
XGBoost Training Pipeline for Fraud Detection
Trains a gradient boosting model on certificate verification data
with SHAP explainability analysis and comprehensive evaluation
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, roc_curve,
    precision_recall_curve, f1_score, matthews_corrcoef
)
import xgboost as xgb
import shap
import pickle
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for headless plotting


# Configure plotting
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (12, 6)

def load_data(csv_path):
    """Load and prepare dataset"""
    print("📂 Loading dataset...")
    df = pd.read_csv(csv_path)
    print(f"   ✅ Loaded {df.shape[0]} samples, {df.shape[1]} features")
    return df

def prepare_features(df):
    """Prepare features for modeling"""
    print("\n🔧 Preparing features...")
    
    # Separate features and labels
    X = df.drop(['certificate_id', 'likely_fraud_label'], axis=1, errors='ignore')
    y = df['likely_fraud_label']
    
    # Remove non-numeric columns
    X = X.select_dtypes(include=[np.number])
    
    # Handle missing values
    X = X.fillna(X.mean())
    
    print(f"   ✅ Features shape: {X.shape}")
    print(f"   ✅ Target distribution: {y.value_counts().to_dict()}")
    
    return X, y

def train_test_split_data(X, y, test_size=0.2, random_state=42):
    """Split data into train, validation, and test sets"""
    print("\n📊 Splitting data...")
    
    # First split: train + val vs test
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    # Second split: train vs val
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.2, random_state=random_state, stratify=y_temp
    )
    
    print(f"   ✅ Train: {X_train.shape[0]} | Val: {X_val.shape[0]} | Test: {X_test.shape[0]}")
    print(f"   ✅ Train fraud rate: {y_train.mean():.1%}")
    print(f"   ✅ Val fraud rate: {y_val.mean():.1%}")
    print(f"   ✅ Test fraud rate: {y_test.mean():.1%}")
    
    return X_train, X_val, X_test, y_train, y_val, y_test

def train_xgboost(X_train, X_val, y_train, y_val):
    """Train XGBoost model with hyperparameters tuned for fraud detection"""
    print("\n🤖 Training XGBoost model...")
    
    model = xgb.XGBClassifier(
        n_estimators=200,           # Number of trees
        max_depth=5,                # Max tree depth
        learning_rate=0.1,          # Learning rate
        subsample=0.8,              # Sample rows per tree
        colsample_bytree=0.8,       # Sample features per tree
        min_child_weight=3,         # Min sum of weights for child
        objective='binary:logistic', # Binary classification
        random_state=42,
        eval_metric='logloss',
        use_label_encoder=False,
        verbosity=0
    )
    
    # Train with XGBoost
    model.fit(X_train, y_train, verbose=False)
    
    print(f"   ✅ Model trained successfully")
    return model

def evaluate_model(model, X_test, y_test, X_train, y_train):
    """Comprehensive model evaluation"""
    print("\n📈 Evaluating model...")
    
    # Predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Train performance (to detect overfitting)
    y_train_pred_proba = model.predict_proba(X_train)[:, 1]
    train_auc = roc_auc_score(y_train, y_train_pred_proba)
    
    # Test performance
    test_auc = roc_auc_score(y_test, y_pred_proba)
    test_f1 = f1_score(y_test, y_pred)
    test_mcc = matthews_corrcoef(y_test, y_pred)
    
    print(f"\n   📊 Performance Metrics:")
    print(f"      Training AUC:   {train_auc:.4f}")
    print(f"      Test AUC:       {test_auc:.4f}")
    print(f"      Test F1 Score:  {test_f1:.4f}")
    print(f"      Test MCC:       {test_mcc:.4f}")
    
    if abs(train_auc - test_auc) > 0.1:
        print(f"      ⚠️  Potential overfitting detected (gap: {abs(train_auc - test_auc):.3f})")
    else:
        print(f"      ✅ No significant overfitting (gap: {abs(train_auc - test_auc):.3f})")
    
    # Classification report
    print(f"\n   📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Normal', 'Fraud']))
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"\n   🔍 Confusion Matrix:")
    print(f"      TN: {cm[0,0]:3d} | FP: {cm[0,1]:3d}")
    print(f"      FN: {cm[1,0]:3d} | TP: {cm[1,1]:3d}")
    
    # Fraud detection rate
    fraud_detection_rate = cm[1,1] / (cm[1,0] + cm[1,1]) if (cm[1,0] + cm[1,1]) > 0 else 0
    print(f"\n   🎯 Fraud Detection Rate (Recall): {fraud_detection_rate:.1%}")
    
    return {
        'train_auc': train_auc,
        'test_auc': test_auc,
        'test_f1': test_f1,
        'test_mcc': test_mcc,
        'confusion_matrix': cm.tolist(),
        'y_test': y_test.values,
        'y_pred': y_pred,
        'y_pred_proba': y_pred_proba
    }

def plot_roc_curve(y_test, y_pred_proba):
    """Plot ROC-AUC curve"""
    fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
    auc = roc_auc_score(y_test, y_pred_proba)
    
    plt.figure(figsize=(10, 6))
    plt.plot(fpr, tpr, lw=2.5, label=f'ROC Curve (AUC = {auc:.3f})')
    plt.plot([0, 1], [0, 1], 'k--', lw=1, label='Random Classifier')
    plt.xlabel('False Positive Rate', fontsize=11)
    plt.ylabel('True Positive Rate', fontsize=11)
    plt.title('ROC-AUC Curve: Fraud Detection Model', fontsize=13, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig('../data/ml/roc_curve.png', dpi=300, bbox_inches='tight')
    print("   ✅ ROC curve saved: ../data/ml/roc_curve.png")
    plt.close()

def plot_feature_importance(model, X_train, top_n=15):
    """Plot feature importance"""
    feature_importance = model.feature_importances_
    feature_names = X_train.columns
    indices = np.argsort(feature_importance)[-top_n:]
    
    plt.figure(figsize=(10, 6))
    plt.barh(range(len(indices)), feature_importance[indices], color='#3498db')
    plt.yticks(range(len(indices)), feature_names[indices])
    plt.xlabel('Importance', fontsize=11)
    plt.title(f'Top {top_n} Feature Importance (XGBoost)', fontsize=13, fontweight='bold')
    plt.tight_layout()
    plt.savefig('../data/ml/feature_importance.png', dpi=300, bbox_inches='tight')
    print(f"   ✅ Feature importance saved: ../data/ml/feature_importance.png")
    plt.close()

def generate_shap_analysis(model, X_test, output_path='../data/ml/'):
    """Generate SHAP explainability analysis"""
    print("\n💡 Generating SHAP explanations...")
    
    # SHAP explainer
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)
    
    # Summary plot
    fig = plt.figure(figsize=(12, 6))
    shap.summary_plot(shap_values, X_test, plot_type="bar", show=False, max_display=15)
    plt.title('SHAP Summary: Feature Impact on Fraud Prediction', fontsize=13, fontweight='bold')
    plt.tight_layout()
    plt.savefig(f'{output_path}shap_summary.png', dpi=300, bbox_inches='tight')
    print("   ✅ SHAP summary saved")
    plt.close()
    
    # Force plot (first fraud case)
    fraud_indices = np.where(pd.Series(explainer.expected_value) < X_test.values)[0]
    if len(fraud_indices) > 0:
        fig = plt.figure(figsize=(14, 4))
        idx = fraud_indices[0]
        shap.force_plot(explainer.expected_value, shap_values[idx], X_test.iloc[idx], 
                       matplotlib=True, show=False)
        plt.tight_layout()
        plt.savefig(f'{output_path}shap_force_plot.png', dpi=300, bbox_inches='tight')
        print("   ✅ SHAP force plot saved")
        plt.close()
    
    return explainer, shap_values

def save_model(model, model_path='../data/ml/xgboost_fraud_model.pkl'):
    """Save trained model"""
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\n💾 Model saved: {model_path}")

def main():
    """Main training pipeline"""
    print("=" * 70)
    print("🚀 XGBoost Fraud Detection Training Pipeline")
    print("=" * 70)
    
    # Load data
    csv_path = 'data/ml/fraud_dataset_1773908139609.csv'  # Correct path for training
    df = load_data(csv_path)
    
    # Prepare features
    X, y = prepare_features(df)
    
    # Split data
    X_train, X_val, X_test, y_train, y_val, y_test = train_test_split_data(X, y)
    
    # Train model
    model = train_xgboost(X_train, X_val, y_train, y_val)
    
    # Evaluate
    eval_results = evaluate_model(model, X_test, y_test, X_train, y_train)
    
    # Visualizations
    print("\n📊 Generating visualizations...")
    plot_roc_curve(y_test, eval_results['y_pred_proba'])
    plot_feature_importance(model, X_train)
    
    # SHAP analysis
    explainer, shap_values = generate_shap_analysis(model, X_test)
    
    # Save model
    save_model(model)
    
    # Summary report
    report = {
        'timestamp': datetime.now().isoformat(),
        'metrics': {
            'train_auc': float(eval_results['train_auc']),
            'test_auc': float(eval_results['test_auc']),
            'test_f1': float(eval_results['test_f1']),
            'test_mcc': float(eval_results['test_mcc'])
        },
        'dataset': {
            'total_samples': len(df),
            'fraud_count': int(y.sum()),
            'fraud_rate': float(y.mean())
        },
        'model_params': model.get_params()
    }
    
    with open('../data/ml/training_report.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print("\n" + "=" * 70)
    print("✅ Training Complete!")
    print("=" * 70)
    print("\n📁 Output Files:")
    print("   • ../data/ml/xgboost_fraud_model.pkl")
    print("   • ../data/ml/roc_curve.png")
    print("   • ../data/ml/feature_importance.png")
    print("   • ../data/ml/shap_summary.png")
    print("   • ../data/ml/training_report.json")
    print("\n🔄 Next Steps:")
    print("   1. Review ROC curve and feature importance plots")
    print("   2. Check SHAP analysis for model interpretability")
    print("   3. Use trained model for production fraud scoring")
    print("   4. Proceed to Phase 6: Backend Integration")

if __name__ == '__main__':
    main()
