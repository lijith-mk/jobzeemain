# AI Algorithms Implementation Guide

## Overview
This document provides a comprehensive guide to all machine learning algorithms implemented in the JobZee platform. These algorithms power intelligent features like candidate screening, salary prediction, job recommendations, and application success prediction.

---

## Table of Contents
1. [SVM - Candidate Screening](#1-svm---support-vector-machine-candidate-screening)
2. [Neural Network - Salary Prediction](#2-neural-network---salary-prediction)
3. [KNN - Job Recommendations](#3-knn---k-nearest-neighbors-recommendations)
4. [Naive Bayes - Personalized Recommendations](#4-naive-bayes---personalized-recommendations)
5. [Decision Tree - Success Prediction](#5-decision-tree---application-success-prediction)

---

## 1. SVM - Support Vector Machine (Candidate Screening)

### File Location
`jobzee-backend/services/svmCandidateScreening.js`

### Purpose
Ranks and scores job applicants based on how well their profile matches job requirements using Support Vector Machine classification.

### Algorithm Details

#### Feature Extraction
The algorithm extracts **5 key features** from candidate profiles:

1. **Skills Match (40% weight)** - Most important
   - Uses TF-IDF style scoring
   - Calculates intersection of user skills vs required skills
   - Bonus for having more skills than required
   - Formula: `matchedSkills / requiredSkills + extraSkillsBonus`

2. **Experience Match (25% weight)**
   - Maps experience levels to numerical years
   - Handles overqualification (slight penalty)
   - Close matches get partial credit
   - Example mapping:
     ```javascript
     'fresher': 0, '1-2 years': 1.5, 'senior': 8, '10+': 12
     ```

3. **Education Match (15% weight)**
   - Hierarchical education levels (High School → PhD)
   - Checks if candidate meets minimum requirements
   - Partial credit for close matches
   ```javascript
   Bachelor's: 3, Master's: 4, PhD: 5
   ```

4. **Location Match (10% weight)**
   - Remote jobs always match 100%
   - Same city = 100%, Similar region = 90%
   - Different location = 40% (relocation needed)

5. **Application History (10% weight)**
   - Profile completeness bonus
   - Past application patterns (placeholder for future)

#### SVM Decision Function

```javascript
score = (skills × 0.40) + (experience × 0.25) + (education × 0.15) + 
        (location × 0.10) + (history × 0.10)

// Apply sigmoid transformation for probability-like output
finalScore = 1 / (1 + e^(-5(score - 0.5)))
```

#### Classification Categories

| Score Range | Category | Badge | Confidence | Recommendation |
|-------------|----------|-------|------------|----------------|
| 85-100% | Excellent | 🎯 Excellent Fit | High | Schedule interview immediately |
| 70-84% | Good | 👍 Good Fit | High | Good candidate worth interviewing |
| 55-69% | Average | ⚡ Average Fit | Medium | Review profile carefully |
| 40-54% | Below Average | ⚠️ Below Average | Medium | Consider only if few applicants |
| 0-39% | Poor | ❌ Poor Fit | Low | Not recommended |

#### Output Format
```json
{
  "score": 78,
  "classification": "good",
  "confidence": "high",
  "badge": "👍 Good Fit",
  "features": {
    "skills": 85,
    "experience": 90,
    "education": 75,
    "location": 100,
    "history": 80
  },
  "strengths": ["Strong skill match", "Relevant experience"],
  "gaps": ["Education requirements not fully met"],
  "recommendation": "Recommended - Good candidate worth interviewing",
  "rank": 2
}
```

### API Endpoints
- `GET /api/screening/job/:jobId/candidates` - Screen all job applicants
- `GET /api/screening/internship/:internshipId/candidates` - Screen internship applicants
- `POST /api/screening/single-candidate` - Test single candidate screening

### Use Cases
1. **Employer Dashboard**: Automatically rank applicants by fit
2. **Interview Scheduling**: Prioritize top candidates
3. **ATS Integration**: Filter out poor matches early

---

## 2. Neural Network - Salary Prediction

### File Location
`jobzee-backend/services/neuralNetSalaryPredictor.js`

### Purpose
Predicts salary ranges using a multi-layer neural network with backpropagation based on skills, experience, location, education, and job category.

### Algorithm Details

#### Network Architecture
```
Input Layer (50 neurons)
    ↓
Hidden Layer 1 (32 neurons) - ReLU activation
    ↓
Hidden Layer 2 (16 neurons) - ReLU activation
    ↓
Output Layer (1 neuron) - Linear/Sigmoid activation
```

#### Feature Vector Composition (50 features total)

1. **Skills (30 features)** - One-hot encoding
   - Top 30 in-demand skills indexed
   - Examples: JavaScript, Python, React, AWS, ML, etc.
   ```javascript
   skillsIndex = { 'javascript': 0, 'python': 1, 'react': 3, ... }
   ```

2. **Location (10 features)** - One-hot encoding
   - Major cities: Bangalore, Mumbai, Delhi, Hyderabad, Pune, Remote
   ```javascript
   locationIndex = { 'bangalore': 0, 'mumbai': 1, 'remote': 8 }
   ```

3. **Experience Level (5 features)** - One-hot encoding
   - Levels: Entry, Mid, Senior, Executive, Fresher

4. **Education Level (3 features)** - One-hot encoding
   - Levels: Bachelor's, Master's, PhD

5. **Category (2 features)** - Numerical encoding
   - Normalized category index

#### Weight Initialization
- **Xavier Initialization**: Weights scaled by `√(2/fan_in)`
- Prevents vanishing/exploding gradients
- Separate weights for each layer transition

#### Activation Functions

**ReLU (Hidden Layers)**
```javascript
relu(x) = max(0, x)
```
- Prevents vanishing gradient
- Faster training than sigmoid

**Sigmoid (Output Layer)**
```javascript
sigmoid(x) = 1 / (1 + e^(-x))
```
- Constrains output between 0-1
- Scaled to salary range: ₹2,00,000 - ₹50,00,000

#### Learning Algorithm
- **Momentum SGD (Stochastic Gradient Descent)**
- Learning rate: 0.01
- Momentum: 0.9
- Backpropagation with momentum for faster convergence

#### Salary Calculation
```javascript
normalizedOutput = sigmoid(networkOutput)
predictedSalary = minSalary + (normalizedOutput × (maxSalary - minSalary))

// Generate range (±15%)
lowerBound = predictedSalary × 0.85
upperBound = predictedSalary × 1.15
```

#### Output Format
```json
{
  "predicted": {
    "min": 680000,
    "max": 920000,
    "average": 800000,
    "currency": "INR"
  },
  "confidence": 87,
  "marketInsights": [
    {
      "factor": "Location",
      "impact": "+15%",
      "message": "Bangalore offers 15% higher salaries"
    },
    {
      "factor": "Skills",
      "impact": "+10%",
      "message": "High-demand skills increase your market value"
    }
  ],
  "breakdown": {
    "base": 560000,
    "variable": 120000,
    "bonus": 80000,
    "benefits": 40000,
    "total": 800000
  },
  "algorithm": "Neural Network (Backpropagation)"
}
```

### API Endpoints
- `GET /api/predictions/salary/my-profile` - User salary prediction
- `POST /api/predictions/salary/for-job` - Job posting salary recommendation
- `GET /api/predictions/salary/for-job/:jobId` - Existing job salary analysis

### Use Cases
1. **User Profile**: Show expected salary based on skills
2. **Job Posting**: Suggest competitive salary range
3. **Employer Dashboard**: Compare posted salary vs market rate

---

## 3. KNN - K-Nearest Neighbors (Recommendations)

### File Location
`jobzee-backend/services/knnRecommendation.js`

### Purpose
Recommends similar jobs/internships using distance-based similarity with K=5 nearest neighbors.

### Algorithm Details

#### Feature Extraction
1. **Salary/Stipend** (normalized)
2. **Location** (binary match)
3. **Skills array** (Jaccard similarity)
4. **Category** (binary match)
5. **Location Type** (remote/hybrid/on-site)
6. **Duration** (for internships)

#### Distance Calculation (Weighted Euclidean)

```javascript
weights = {
  salary: 0.3,
  skills: 0.4,   // Most important
  location: 0.15,
  category: 0.1,
  locationType: 0.05
}

distance = (salaryDiff × 0.3) + ((1 - skillsSimilarity) × 0.4) + 
           (locationMatch × 0.15) + (categoryMatch × 0.1) + 
           (locationTypeMatch × 0.05)
```

#### Jaccard Similarity for Skills
```javascript
intersection = skills1 ∩ skills2
union = skills1 ∪ skills2
similarity = |intersection| / |union|
```

#### Personalized Recommendations
1. **User Profile Creation**: Analyzes user's application history
   - Most applied skills
   - Preferred locations
   - Average salary range
   - Favorite categories

2. **Similarity Calculation**: Compares user profile to all available jobs

3. **Ranking**: Returns top K most similar jobs (excluding already applied)

#### Output Format
```json
[
  {
    "_id": "...",
    "title": "Senior React Developer",
    "skills": ["React", "Node.js", "TypeScript"],
    "location": "Bangalore",
    "salary": { "min": 800000, "max": 1200000 },
    "similarityScore": 92,
    "recommendationScore": 92
  }
]
```

### API Usage
```javascript
const recommendations = await knnRecommendation.getRecommendations(
  targetJob,    // Job to find similar items for
  allJobs,      // Array of all available jobs
  'job',        // Type: 'job' or 'internship'
  5             // Number of recommendations (K)
);
```

### Use Cases
1. **"Similar Jobs" section** on job details page
2. **Personalized feed** based on browsing history
3. **"You might also like"** recommendations

---

## 4. Naive Bayes - Personalized Recommendations

### File Location
`jobzee-backend/services/naiveBayesRecommendation.js`

### Purpose
Uses probabilistic classification to recommend jobs based on user's past application patterns.

### Algorithm Details

#### Naive Bayes Theorem
```
P(applied|features) = P(features|applied) × P(applied) / P(features)

where:
- P(applied) = prior probability of applying
- P(features|applied) = likelihood of features given application
- P(features) = evidence (normalizing constant)
```

#### Feature Extraction
Features are extracted as string identifiers:
- `skill:javascript`, `skill:python`
- `location:bangalore`, `location:remote`
- `type:full-time`, `type:contract`
- `salary:high`, `salary:medium`, `salary:low`
- `duration:short`, `duration:long` (internships)

Example:
```javascript
['skill:react', 'skill:node', 'location:bangalore', 
 'salary:high', 'type:full-time', 'remote:yes']
```

#### Training Process

1. **Separate Data**:
   - Class 0: Jobs user has applied to
   - Class 1: Jobs user hasn't applied to

2. **Calculate Class Probabilities**:
   ```javascript
   P(applied) = appliedJobs / totalJobs
   P(notApplied) = notAppliedJobs / totalJobs
   ```

3. **Calculate Feature Probabilities** (with Laplace Smoothing):
   ```javascript
   P(feature|applied) = (count(feature in applied) + 1) / 
                        (total features in applied + vocabulary size)
   ```

4. **Laplace Smoothing**: Prevents zero probabilities for unseen features

#### Prediction Process
```javascript
// Calculate log probabilities to avoid underflow
logP(applied|features) = log(P(applied)) + 
                         Σ log(P(feature_i|applied))

logP(notApplied|features) = log(P(notApplied)) + 
                            Σ log(P(feature_i|notApplied))

// Normalize to get probability
probability = exp(logP(applied)) / 
             (exp(logP(applied)) + exp(logP(notApplied)))
```

#### Output Format
```json
[
  {
    "title": "Full Stack Developer",
    "skills": ["React", "Node.js"],
    "recommendationScore": 87,
    "recommendationMethod": "naive_bayes"
  },
  {
    "title": "Frontend Engineer",
    "skills": ["React", "TypeScript"],
    "recommendationScore": 82,
    "recommendationMethod": "naive_bayes"
  }
]
```

### API Usage
```javascript
const recommendations = await naiveBayes.getPersonalizedRecommendations(
  userApplications,  // User's past applications
  allJobs,          // All available jobs
  'job',            // Type
  10                // Limit
);
```

### Use Cases
1. **Homepage personalized feed**
2. **Email recommendations**: "Jobs you might like"
3. **Re-engagement**: Bring back inactive users

---

## 5. Decision Tree - Application Success Prediction

### File Location
`jobzee-backend/services/decisionTreePrediction.js`

### Purpose
Predicts the likelihood of getting hired by analyzing how well a candidate's profile matches job requirements.

### Algorithm Details

#### Decision Tree Structure
```
                    Root: Skills Match?
                   /                    \
            >= 70%                    < 70%
              /                          \
    Experience Match?              Experience Match?
       /          \                   /          \
   >= 60%      < 60%             >= 80%       < 80%
    /            \                 /              \
Excellent      Good            Moderate         Poor
```

#### Feature Scoring (All scores 0-100%)

1. **Skills Match (40% weight)**
   ```javascript
   matchedSkills / requiredSkills × 100
   ```

2. **Experience Match (25% weight)**
   - Maps experience levels to years
   - Full credit if user experience ≥ required
   - Partial credit if close

3. **Education Match (15% weight)**
   - Hierarchical levels: High School < Bachelor's < Master's < PhD
   - Max 80% if below required level

4. **Location Match (10% weight)**
   - Remote jobs: 100%
   - Same city: 100%
   - Different city: 30%

5. **Salary Expectation Match (10% weight)**
   - 100% if job salary ≥ user expectation
   - 80% if within 20% of expectation

#### Success Probability Calculation
```javascript
successProbability = (skillsMatch × 0.40) + 
                    (experienceMatch × 0.25) +
                    (educationMatch × 0.15) +
                    (locationMatch × 0.10) +
                    (salaryMatch × 0.10)
```

#### Classification
| Probability | Category | Recommendation | Should Apply? |
|-------------|----------|----------------|---------------|
| 85-100% | Excellent | Highly recommended | ✅ Yes |
| 70-84% | Good | Strong chance of success | ✅ Yes |
| 55-69% | Moderate | Worth applying | ✅ Yes |
| 40-54% | Low | Consider improving skills | ⚠️ Maybe |
| 0-39% | Poor | Focus on better opportunities | ❌ No |

#### Output Format
```json
{
  "successProbability": 78,
  "category": "good",
  "recommendation": "Good match - Strong chance of success!",
  "confidence": "high",
  "factors": {
    "skillsMatch": 85,
    "experienceMatch": 90,
    "educationMatch": 70,
    "locationMatch": 100,
    "salaryMatch": 80
  },
  "strengths": ["skills", "experience", "location"],
  "improvements": ["education"],
  "shouldApply": true,
  "feedback": [
    {
      "area": "Skills",
      "status": "strong",
      "message": "Your skills are a great match!",
      "score": 85
    },
    {
      "area": "Education",
      "status": "warning",
      "message": "Educational requirements may not be fully met",
      "score": 70
    }
  ]
}
```

### API Usage
```javascript
const prediction = decisionTree.predictApplicationSuccess(
  userProfile,  // User's profile data
  job,          // Job/internship details
  'job'         // Type: 'job' or 'internship'
);
```

### Use Cases
1. **Before Applying**: Show success probability
2. **Application Modal**: "You have 78% chance of success!"
3. **Profile Improvement Tips**: Highlight areas to improve

---

## Algorithm Comparison Matrix

| Algorithm | Purpose | Complexity | Accuracy | Use Case |
|-----------|---------|------------|----------|----------|
| **SVM** | Candidate Screening | O(n²) | High | Rank applicants |
| **Neural Network** | Salary Prediction | O(n×m²) | Very High | Predict salaries |
| **KNN** | Similar Jobs | O(n) | Medium-High | Recommendations |
| **Naive Bayes** | Personalized Feed | O(n) | Medium | User preferences |
| **Decision Tree** | Success Prediction | O(log n) | High | Apply guidance |

---

## Performance Considerations

### Optimization Strategies

1. **Caching**
   - Cache feature vectors for repeat calculations
   - Store pre-computed similarity matrices

2. **Batch Processing**
   - Process multiple candidates simultaneously
   - Vectorize operations where possible

3. **Async Operations**
   - Run algorithms asynchronously
   - Use worker threads for heavy computations

4. **Database Indexing**
   - Index skills, location, category fields
   - Use compound indexes for common queries

### Scalability

| Jobs/Candidates | SVM | Neural Net | KNN | Naive Bayes | Decision Tree |
|----------------|-----|------------|-----|-------------|---------------|
| < 1,000 | ⚡ Fast | ⚡ Fast | ⚡ Fast | ⚡ Fast | ⚡ Fast |
| 1K - 10K | ✅ Good | ✅ Good | ✅ Good | ✅ Good | ⚡ Fast |
| 10K - 100K | ⚠️ Moderate | ✅ Good | ⚠️ Moderate | ✅ Good | ⚡ Fast |
| > 100K | ❌ Slow | ✅ Good | ❌ Slow | ⚠️ Moderate | ⚡ Fast |

---

## Integration Examples

### Example 1: Complete Candidate Screening Flow
```javascript
// 1. Get all applications for a job
const applications = await Application.find({ job: jobId })
  .populate('userId', 'name skills experience education location');

// 2. Screen candidates with SVM
const { candidates, stats } = await svmScreening.screenCandidates(
  applications.map(app => app.userId),
  job,
  'job'
);

// 3. Display ranked candidates
candidates.forEach(candidate => {
  console.log(`${candidate.aiScreening.rank}. ${candidate.name}`);
  console.log(`   Score: ${candidate.aiScreening.score}%`);
  console.log(`   Badge: ${candidate.aiScreening.badge}`);
  console.log(`   Recommendation: ${candidate.aiScreening.recommendation}`);
});
```

### Example 2: Personalized Job Recommendations
```javascript
// Get user's application history
const userApps = await Application.find({ userId })
  .populate('job');

// Get all available jobs
const allJobs = await Job.find({ status: 'active' });

// Method 1: KNN (similar to what user applied to)
const knnRecs = await knnRecommendation.getPersonalizedRecommendations(
  userApps,
  allJobs,
  'job',
  5
);

// Method 2: Naive Bayes (probabilistic)
const bayesRecs = await naiveBayes.getPersonalizedRecommendations(
  userApps,
  allJobs,
  'job',
  5
);

// Combine and deduplicate
const recommendations = [...knnRecs, ...bayesRecs]
  .sort((a, b) => b.recommendationScore - a.recommendationScore)
  .slice(0, 10);
```

### Example 3: Pre-Application Success Check
```javascript
// Before user applies, show success prediction
const userProfile = await User.findById(userId);
const job = await Job.findById(jobId);

const prediction = decisionTree.predictApplicationSuccess(
  userProfile,
  job,
  'job'
);

// Show modal with prediction
res.json({
  canApply: true,
  prediction: {
    probability: prediction.successProbability,
    message: prediction.recommendation,
    factors: prediction.factors,
    tips: prediction.feedback
  }
});
```

---

## Future Enhancements

### Planned Improvements

1. **Ensemble Methods**
   - Combine multiple algorithms for better accuracy
   - Weighted voting between SVM, Decision Tree, and Naive Bayes

2. **Deep Learning**
   - Replace simple neural network with LSTM for sequence data
   - Use transformers for skill matching (BERT-based)

3. **Online Learning**
   - Update models based on real hiring outcomes
   - Incremental learning without full retraining

4. **A/B Testing**
   - Test different algorithms against each other
   - Measure conversion rates and user satisfaction

5. **Explainable AI**
   - Provide detailed explanations for predictions
   - Show feature importance visually

---

## Testing & Validation

### Unit Testing
```javascript
// Test SVM scoring
test('SVM should score exact skill match as 100%', () => {
  const result = svm.calculateSkillsFeature(
    ['React', 'Node.js'],
    ['React', 'Node.js']
  );
  expect(result).toBeCloseTo(1.0);
});

// Test Neural Network prediction range
test('Neural Network should predict salary in valid range', () => {
  const result = neuralNet.predict(sampleProfile);
  expect(result.predicted.average).toBeGreaterThan(200000);
  expect(result.predicted.average).toBeLessThan(5000000);
});
```

### Integration Testing
- Test end-to-end flows with real data
- Validate API responses match expected format
- Check performance with large datasets

### Accuracy Metrics
- **Precision**: Of recommended candidates, how many were hired?
- **Recall**: Of all hired candidates, how many were recommended?
- **F1 Score**: Harmonic mean of precision and recall
- **RMSE**: Root Mean Square Error for salary predictions

---

## Troubleshooting

### Common Issues

1. **Low Prediction Accuracy**
   - Check if training data is sufficient
   - Verify feature extraction is correct
   - Consider feature engineering improvements

2. **Slow Performance**
   - Use caching for repeat calculations
   - Optimize database queries
   - Consider batch processing

3. **Inconsistent Results**
   - Ensure deterministic initialization
   - Check for floating-point precision issues
   - Validate input data quality

---

## Resources & References

### Academic Papers
- Support Vector Machines: [Cortes & Vapnik, 1995]
- Neural Networks: [Rumelhart et al., 1986]
- K-Nearest Neighbors: [Cover & Hart, 1967]
- Naive Bayes: [McCallum & Nigam, 1998]

### Libraries Used
- Custom implementation (no external ML libraries)
- Pure JavaScript/Node.js
- Optimized for production use

---

## License & Credits

**Developed by**: JobZee Development Team  
**Last Updated**: October 2025  
**Version**: 1.0.0

For questions or contributions, contact the development team.

---

**End of Documentation** 🚀
