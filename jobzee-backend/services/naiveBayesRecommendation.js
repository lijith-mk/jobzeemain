/**
 * Naive Bayes Recommendation System
 * Uses probabilistic classification to recommend jobs/internships based on user preferences
 */

class NaiveBayesRecommendation {
  constructor() {
    this.trained = false;
    this.featureProbabilities = {};
    this.classProbabilities = {};
  }

  /**
   * Extract features from a job/internship
   */
  extractFeatures(item, type = 'job') {
    const features = [];
    
    // Skills
    if (item.skills && Array.isArray(item.skills)) {
      item.skills.forEach(skill => {
        features.push(`skill:${skill.toLowerCase()}`);
      });
    }

    // Location
    if (item.location) {
      features.push(`location:${item.location.toLowerCase()}`);
    }

    // Type
    if (type === 'job') {
      if (item.type) {
        features.push(`type:${item.type.toLowerCase()}`);
      }
      // Remote preference
      if (item.remote) {
        features.push(`remote:${item.remote.toLowerCase()}`);
      }
    } else {
      // Internship-specific features
      if (item.locationType) {
        features.push(`locationType:${item.locationType.toLowerCase()}`);
      }
      // Duration range
      if (item.duration) {
        const durationRange = this.getDurationRange(item.duration);
        features.push(`duration:${durationRange}`);
      }
    }

    // Salary/Stipend range
    if (type === 'job') {
      if (item.salary && item.salary.min) {
        const salaryRange = this.getSalaryRange(item.salary.min);
        features.push(`salary:${salaryRange}`);
      }
    } else {
      if (item.stipend && item.stipend.amount && !item.isUnpaid) {
        const stipendRange = this.getStipendRange(item.stipend.amount);
        features.push(`stipend:${stipendRange}`);
      } else if (item.isUnpaid) {
        features.push('stipend:unpaid');
      }
    }

    return features;
  }

  /**
   * Get salary range category
   */
  getSalaryRange(salary) {
    if (salary < 300000) return 'low';
    if (salary < 600000) return 'medium';
    if (salary < 1000000) return 'high';
    return 'very-high';
  }

  /**
   * Get stipend range category
   */
  getStipendRange(stipend) {
    if (stipend < 5000) return 'low';
    if (stipend < 15000) return 'medium';
    if (stipend < 30000) return 'high';
    return 'very-high';
  }

  /**
   * Get duration range category
   */
  getDurationRange(months) {
    if (months <= 2) return 'short';
    if (months <= 4) return 'medium';
    if (months <= 6) return 'long';
    return 'very-long';
  }

  /**
   * Train the Naive Bayes model
   */
  train(userApplications, allItems, type = 'job') {
    // Initialize probabilities
    this.featureProbabilities = {
      applied: {},
      notApplied: {}
    };

    // Get applied item IDs
    const appliedIds = new Set(
      userApplications.map(app => 
        type === 'job' ? app.job?._id?.toString() : app.internship?._id?.toString()
      ).filter(Boolean)
    );

    // Separate items into applied and not applied
    const appliedItems = [];
    const notAppliedItems = [];

    allItems.forEach(item => {
      if (appliedIds.has(item._id.toString())) {
        appliedItems.push(item);
      } else {
        notAppliedItems.push(item);
      }
    });

    // Calculate class probabilities
    const total = allItems.length;
    this.classProbabilities = {
      applied: appliedItems.length / total,
      notApplied: notAppliedItems.length / total
    };

    // Extract features for both classes
    const appliedFeatures = appliedItems.map(item => this.extractFeatures(item, type));
    const notAppliedFeatures = notAppliedItems.map(item => this.extractFeatures(item, type));

    // Count feature occurrences
    const appliedFeatureCounts = {};
    const notAppliedFeatureCounts = {};
    const allFeatures = new Set();

    // Count applied features
    appliedFeatures.forEach(features => {
      features.forEach(feature => {
        allFeatures.add(feature);
        appliedFeatureCounts[feature] = (appliedFeatureCounts[feature] || 0) + 1;
      });
    });

    // Count not applied features
    notAppliedFeatures.forEach(features => {
      features.forEach(feature => {
        allFeatures.add(feature);
        notAppliedFeatureCounts[feature] = (notAppliedFeatureCounts[feature] || 0) + 1;
      });
    });

    // Calculate probabilities with Laplace smoothing
    const vocabularySize = allFeatures.size;
    const appliedTotal = appliedFeatures.reduce((sum, features) => sum + features.length, 0);
    const notAppliedTotal = notAppliedFeatures.reduce((sum, features) => sum + features.length, 0);

    allFeatures.forEach(feature => {
      // P(feature|applied) with Laplace smoothing
      this.featureProbabilities.applied[feature] = 
        (appliedFeatureCounts[feature] || 0 + 1) / (appliedTotal + vocabularySize);
      
      // P(feature|notApplied) with Laplace smoothing
      this.featureProbabilities.notApplied[feature] = 
        (notAppliedFeatureCounts[feature] || 0 + 1) / (notAppliedTotal + vocabularySize);
    });

    this.trained = true;
  }

  /**
   * Calculate probability that user would apply to this item
   */
  predict(item, type = 'job') {
    if (!this.trained) {
      throw new Error('Model must be trained before making predictions');
    }

    const features = this.extractFeatures(item, type);
    
    // Calculate log probabilities to avoid underflow
    let logProbApplied = Math.log(this.classProbabilities.applied);
    let logProbNotApplied = Math.log(this.classProbabilities.notApplied);

    features.forEach(feature => {
      if (this.featureProbabilities.applied[feature]) {
        logProbApplied += Math.log(this.featureProbabilities.applied[feature]);
      }
      if (this.featureProbabilities.notApplied[feature]) {
        logProbNotApplied += Math.log(this.featureProbabilities.notApplied[feature]);
      }
    });

    // Convert back to probability
    const maxLog = Math.max(logProbApplied, logProbNotApplied);
    const probApplied = Math.exp(logProbApplied - maxLog);
    const probNotApplied = Math.exp(logProbNotApplied - maxLog);
    
    // Normalize
    const total = probApplied + probNotApplied;
    return probApplied / total;
  }

  /**
   * Get personalized recommendations using Naive Bayes
   */
  async getPersonalizedRecommendations(userApplications, allItems, type = 'job', limit = 10) {
    if (userApplications.length === 0) {
      // If no applications, return popular items
      return allItems
        .sort((a, b) => (b.applicationsCount || 0) - (a.applicationsCount || 0))
        .slice(0, limit)
        .map(item => ({
          ...item.toObject ? item.toObject() : item,
          recommendationScore: 50,
          recommendationMethod: 'popular'
        }));
    }

    // Train the model
    this.train(userApplications, allItems, type);

    // Get applied item IDs to exclude
    const appliedIds = new Set(
      userApplications.map(app => 
        type === 'job' ? app.job?._id?.toString() : app.internship?._id?.toString()
      ).filter(Boolean)
    );

    // Filter out already applied items
    const candidateItems = allItems.filter(item => 
      !appliedIds.has(item._id.toString())
    );

    // Calculate probabilities for all candidate items
    const itemsWithScores = candidateItems.map(item => {
      const probability = this.predict(item, type);
      return {
        ...item.toObject ? item.toObject() : item,
        recommendationScore: Math.round(probability * 100),
        recommendationMethod: 'naive_bayes'
      };
    });

    // Sort by probability and return top N
    return itemsWithScores
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }

  /**
   * Get similar items based on features
   */
  async getSimilarItems(targetItem, allItems, type = 'job', limit = 5) {
    const targetFeatures = new Set(this.extractFeatures(targetItem, type));
    
    const itemsWithScores = allItems
      .filter(item => item._id.toString() !== targetItem._id.toString())
      .map(item => {
        const itemFeatures = new Set(this.extractFeatures(item, type));
        
        // Calculate Jaccard similarity
        const intersection = new Set([...targetFeatures].filter(x => itemFeatures.has(x)));
        const union = new Set([...targetFeatures, ...itemFeatures]);
        const similarity = intersection.size / union.size;
        
        return {
          ...item.toObject ? item.toObject() : item,
          recommendationScore: Math.round(similarity * 100),
          recommendationMethod: 'feature_similarity'
        };
      });

    // Sort by similarity and return top N
    return itemsWithScores
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }
}

module.exports = new NaiveBayesRecommendation();
