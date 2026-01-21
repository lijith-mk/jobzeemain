/**
 * KNN (K-Nearest Neighbors) Recommendation Service
 * Recommends similar jobs/internships based on various features
 */

class KNNRecommendation {
  constructor() {
    this.k = 5; // Number of nearest neighbors to return
    this.MIN_SIMILARITY = 0.35; // 35% minimum to consider relevant
  }

  // Basic city tiering for looser location matching
  cityTier(location = '') {
    const loc = (location || '').toLowerCase();
    const tier1 = ['bangalore','bengaluru','mumbai','delhi','new delhi','hyderabad','pune','chennai','gurgaon','noida'];
    const tier2 = ['ahmedabad','kolkata','kochi','cochin','trivandrum','thiruvananthapuram','coimbatore','indore','jaipur','lucknow','bhubaneshwar','bhubaneswar','surat','vadodara','visakhapatnam'];
    if (tier1.some(c => loc.includes(c))) return 'tier1';
    if (tier2.some(c => loc.includes(c))) return 'tier2';
    if (loc.includes('remote')) return 'remote';
    return 'tier3';
  }

  /**
   * Extract numerical features from a job/internship
   */
  extractFeatures(item, type = 'job') {
    const features = {};

    // Salary/Stipend features (normalized)
    if (type === 'job') {
      features.minSalary = item.salary?.min || 0;
      features.maxSalary = item.salary?.max || 0;
      features.avgSalary = (features.minSalary + features.maxSalary) / 2;
    } else {
      features.stipend = item.stipend?.amount || 0;
      features.duration = item.duration || 3;
    }

    // Location encoding
    features.location = item.location || '';
    features.cityTier = this.cityTier(features.location);

    // Category encoding
    features.category = item.category || '';

    // Skills array
    features.skills = item.skills || [];

    // Remote/Location type
    features.locationType = item.locationType || item.remote || 'on-site';

    // Experience level
    features.experienceLevel = (item.experienceLevel || 'entry').toLowerCase();

    // Job type
    features.jobType = (item.jobType || item.type || '').toLowerCase();

    return features;
  }

  /**
   * Calculate Euclidean distance between two items
   */
  calculateDistance(features1, features2, type = 'job') {
    let distance = 0;
    // Weights sum ~= 1.0
    const weights = {
      salary: 0.15,
      skills: 0.45,
      location: 0.12,
      cityTier: 0.06,
      category: 0.08,
      locationType: 0.05,
      experience: 0.07,
      jobType: 0.02
    };

    // Salary/Stipend distance
    if (type === 'job') {
      const salaryDiff = Math.abs(features1.avgSalary - features2.avgSalary);
      const maxSalary = Math.max(features1.avgSalary, features2.avgSalary, 1);
      distance += (salaryDiff / maxSalary) * weights.salary;
    } else {
      const stipendDiff = Math.abs(features1.stipend - features2.stipend);
      const maxStipend = Math.max(features1.stipend, features2.stipend, 1);
      distance += (stipendDiff / maxStipend) * weights.salary;

      // Duration distance for internships
      const durationDiff = Math.abs(features1.duration - features2.duration);
      distance += (durationDiff / 12) * 0.1; // Normalize by max 12 months
    }

    // Skills similarity (Jaccard distance)
    const skillsSimilarity = this.calculateJaccardSimilarity(features1.skills, features2.skills);
    distance += (1 - skillsSimilarity) * weights.skills;

    // Location similarity (exact match) and city tier similarity (looser)
    const locationMatch = features1.location.toLowerCase() === features2.location.toLowerCase() ? 0 : 1;
    distance += locationMatch * weights.location;
    const tierMatch = features1.cityTier === features2.cityTier ? 0 : 1;
    distance += tierMatch * weights.cityTier;

    // Category similarity
    const categoryMatch = (features1.category || '').toLowerCase() === (features2.category || '').toLowerCase() ? 0 : 1;
    distance += categoryMatch * weights.category;

    // Location type similarity
    const locationTypeMatch = (features1.locationType || '').toLowerCase() === (features2.locationType || '').toLowerCase() ? 0 : 1;
    distance += locationTypeMatch * weights.locationType;

    // Experience similarity (map to buckets)
    const expMap = lvl => (lvl.includes('entry')||lvl.includes('fresher'))?'entry':(lvl.includes('mid')?'mid':(lvl.includes('senior')?'senior':(lvl.includes('executive')?'executive':lvl)));
    const expMatch = expMap(features1.experienceLevel) === expMap(features2.experienceLevel) ? 0 : 1;
    distance += expMatch * weights.experience;

    // Job type similarity
    const jobMatch = (features1.jobType||'') === (features2.jobType||'') ? 0 : 1;
    distance += jobMatch * weights.jobType;

    return distance;
  }

  /**
   * Calculate Jaccard similarity for skills
   */
  calculateJaccardSimilarity(skills1, skills2) {
    if (!skills1 || !skills2 || skills1.length === 0 || skills2.length === 0) {
      return 0;
    }

    const set1 = new Set(skills1.map(s => s.toLowerCase()));
    const set2 = new Set(skills2.map(s => s.toLowerCase()));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Get K nearest neighbors for a given item
   */
  async getRecommendations(targetItem, allItems, type = 'job', k = null) {
    const numNeighbors = k || this.k;
    
    // Extract features for target item
    const targetFeatures = this.extractFeatures(targetItem, type);

    // Calculate distances to all other items
    const distances = allItems
      .filter(item => item._id.toString() !== targetItem._id.toString())
      .map(item => {
        const itemFeatures = this.extractFeatures(item, type);
        const distance = this.calculateDistance(targetFeatures, itemFeatures, type);
        return {
          item,
          distance,
          similarity: 1 / (1 + distance) // Convert distance to similarity score
        };
      });

    // Sort by distance (ascending) and take top K
    distances.sort((a, b) => a.distance - b.distance);
    
    return distances.slice(0, numNeighbors).map(d => ({
      ...d.item.toObject ? d.item.toObject() : d.item,
      similarityScore: Math.round(d.similarity * 100) // Percentage similarity
    }));
  }

  /**
   * Get personalized recommendations based on user's application history
   */
  async getPersonalizedRecommendations(userApplications, allItems, type = 'job', k = null) {
    const numNeighbors = k || this.k;

    if (!userApplications || userApplications.length === 0) {
      // Return popular items, but prefer ones matching user saved or profile (not available here), so keep generic
      return allItems
        .filter(item => item.status === 'active')
        .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
        .slice(0, numNeighbors);
    }

    // Create a composite profile from user's application history
    const userProfile = this.createUserProfile(userApplications, type);

    // Calculate distances to all items
    const distances = allItems
      .filter(item => {
        // Exclude items user has already applied to
        const hasApplied = userApplications.some(app => {
          const ref = type === 'job' ? (app.job || app.jobId) : app.internship;
          return (ref?._id?.toString?.() || ref?.toString?.() || '') === item._id.toString();
        });
        // allItems are pre-filtered (active/approved + not expired), so only exclude applied
        return !hasApplied;
      })
      .map(item => {
        const itemFeatures = this.extractFeatures(item, type);
        const distance = this.calculateDistance(userProfile, itemFeatures, type);
        const similarity = 1 / (1 + distance);
        const skillsOverlap = this.calculateJaccardSimilarity(userProfile.skills, itemFeatures.skills);
        return {
          item,
          distance,
          similarity,
          skillsOverlap
        };
      });

    // Filter by minimum similarity threshold
    let filtered = distances.filter(d => d.similarity >= this.MIN_SIMILARITY);

    // If too few, backfill by highest skill overlap
    if (filtered.length < Math.min(3, numNeighbors)) {
      const backfill = distances
        .filter(d => d.skillsOverlap > 0)
        .sort((a, b) => b.skillsOverlap - a.skillsOverlap)
        .slice(0, numNeighbors);
      const set = new Map();
      [...filtered, ...backfill].forEach(d => set.set(d.item._id.toString(), d));
      filtered = Array.from(set.values());
    }

    // If still empty, fall back to popular items that share skills or city tier
    if (filtered.length === 0) {
      // Determine user’s dominant city tier from profile
      const userTier = this.cityTier(userProfile.location || '');
      const fallback = allItems
        .filter(item => item.status === 'active')
        .map(item => {
          const f = this.extractFeatures(item, type);
          const overlap = this.calculateJaccardSimilarity(userProfile.skills, f.skills);
          const tierBonus = (f.cityTier === userTier) ? 0.1 : 0; // small boost for same tier
          return { item, score: overlap + tierBonus + ((item.viewsCount || 0) / 100000) };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, numNeighbors)
        .map(x => ({
          ...x.item.toObject ? x.item.toObject() : x.item,
          recommendationScore: Math.round(Math.min(1, x.score) * 100)
        }));
      return fallback;
    }

    // Sort by (similarity, skillsOverlap) and take top K
    filtered.sort((a, b) => (b.similarity - a.similarity) || (b.skillsOverlap - a.skillsOverlap));
    return filtered.slice(0, numNeighbors).map(d => ({
      ...d.item.toObject ? d.item.toObject() : d.item,
      recommendationScore: Math.round(d.similarity * 100)
    }));
  }

  /**
   * Create user profile from application history
   */
  createUserProfile(applications, type) {
    const profile = {
      skills: [],
      locations: {},
      categories: {},
      locationTypes: {},
      avgSalary: 0,
      avgStipend: 0,
      avgDuration: 0
    };

    let salarySum = 0;
    let salaryCount = 0;
    let stipendSum = 0;
    let stipendCount = 0;
    let durationSum = 0;
    let durationCount = 0;

    applications.forEach(app => {
      const item = type === 'job' ? (app.job || app.jobId) : app.internship;
      if (!item) return;

      // Aggregate skills
      if (item.skills) {
        profile.skills.push(...item.skills);
      }

      // Count locations
      if (item.location) {
        profile.locations[item.location] = (profile.locations[item.location] || 0) + 1;
      }

      // Count categories
      if (item.category) {
        profile.categories[item.category] = (profile.categories[item.category] || 0) + 1;
      }

      // Count location types
      const locType = item.locationType || item.remote || 'on-site';
      profile.locationTypes[locType] = (profile.locationTypes[locType] || 0) + 1;

      // Aggregate salary/stipend
      if (type === 'job' && item.salary) {
        const avg = (item.salary.min + item.salary.max) / 2;
        if (avg > 0) {
          salarySum += avg;
          salaryCount++;
        }
      } else if (type === 'internship') {
        if (item.stipend?.amount > 0) {
          stipendSum += item.stipend.amount;
          stipendCount++;
        }
        if (item.duration) {
          durationSum += item.duration;
          durationCount++;
        }
      }
    });

    // Calculate averages and most common values
    profile.avgSalary = salaryCount > 0 ? salarySum / salaryCount : 0;
    profile.avgStipend = stipendCount > 0 ? stipendSum / stipendCount : 0;
    profile.avgDuration = durationCount > 0 ? durationSum / durationCount : 3;

    // Get most common location
    const mostCommonLocation = Object.keys(profile.locations).reduce((a, b) => 
      profile.locations[a] > profile.locations[b] ? a : b, ''
    );
    profile.location = mostCommonLocation;

    // Get most common category
    const mostCommonCategory = Object.keys(profile.categories).reduce((a, b) => 
      profile.categories[a] > profile.categories[b] ? a : b, ''
    );
    profile.category = mostCommonCategory;

    // Get most common location type
    const mostCommonLocationType = Object.keys(profile.locationTypes).reduce((a, b) => 
      profile.locationTypes[a] > profile.locationTypes[b] ? a : b, 'on-site'
    );
    profile.locationType = mostCommonLocationType;

    // Remove duplicate skills
    profile.skills = [...new Set(profile.skills)];

    return profile;
  }

  /**
   * Set custom K value
   */
  setK(k) {
    this.k = k;
  }
}

module.exports = new KNNRecommendation();
