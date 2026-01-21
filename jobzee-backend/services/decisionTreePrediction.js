/**
 * Decision Tree for Application Success Prediction
 * Predicts likelihood of getting hired based on user profile vs job requirements
 */

class DecisionTreePrediction {
  /**
   * Calculate skill match score
   */
  calculateSkillMatch(userSkills, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) return 100;
    if (!userSkills || userSkills.length === 0) return 0;

    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase());

    const matchedSkills = requiredSkillsLower.filter(skill => 
      userSkillsLower.includes(skill)
    );

    return Math.round((matchedSkills.length / requiredSkillsLower.length) * 100);
  }

  /**
   * Calculate experience match
   */
  calculateExperienceMatch(userExperience, requiredExperience) {
    if (!requiredExperience) return 100;
    if (!userExperience) return 0;

    // Parse experience levels
    const expLevels = {
      'fresher': 0,
      'entry': 0,
      '0-1': 0.5,
      '1-2': 1.5,
      '2-3': 2.5,
      '3-5': 4,
      '5-7': 6,
      '7-10': 8.5,
      '10+': 12,
      'senior': 8,
      'expert': 12
    };

    const userYears = expLevels[userExperience.toLowerCase()] || 0;
    const requiredYears = expLevels[requiredExperience.toLowerCase()] || 0;

    if (userYears >= requiredYears) return 100;
    if (userYears === 0) return 0;
    
    // Partial credit if close
    const ratio = userYears / requiredYears;
    return Math.round(ratio * 100);
  }

  /**
   * Calculate education match
   */
  calculateEducationMatch(userEducation, requiredEducation) {
    if (!requiredEducation || requiredEducation.length === 0) return 100;
    if (!userEducation || userEducation.length === 0) return 50; // Neutral if not specified

    const educationLevels = {
      'high school': 1,
      '12th': 1,
      'diploma': 2,
      'bachelor': 3,
      "bachelor's": 3,
      'bachelors': 3,
      'btech': 3,
      'be': 3,
      'bsc': 3,
      'bca': 3,
      'master': 4,
      "master's": 4,
      'masters': 4,
      'mtech': 4,
      'msc': 4,
      'mca': 4,
      'mba': 4,
      'phd': 5,
      'doctorate': 5
    };

    // Get highest user education level
    let userLevel = 0;
    userEducation.forEach(edu => {
      const eduStr = edu.degree ? edu.degree.toLowerCase() : '';
      Object.keys(educationLevels).forEach(key => {
        if (eduStr.includes(key)) {
          userLevel = Math.max(userLevel, educationLevels[key]);
        }
      });
    });

    // Get required education level
    let requiredLevel = 0;
    requiredEducation.forEach(edu => {
      const eduStr = typeof edu === 'string' ? edu.toLowerCase() : '';
      Object.keys(educationLevels).forEach(key => {
        if (eduStr.includes(key)) {
          requiredLevel = Math.max(requiredLevel, educationLevels[key]);
        }
      });
    });

    if (userLevel >= requiredLevel) return 100;
    if (userLevel === 0) return 30;
    
    const ratio = userLevel / requiredLevel;
    return Math.round(ratio * 80); // Max 80% if below required
  }

  /**
   * Calculate location match
   */
  calculateLocationMatch(userLocation, jobLocation, jobRemote) {
    // Remote jobs match everyone
    if (jobRemote === 'remote' || jobRemote === 'hybrid') return 100;
    
    if (!userLocation || !jobLocation) return 50; // Neutral if not specified

    const userLoc = userLocation.toLowerCase();
    const jobLoc = jobLocation.toLowerCase();

    // Exact match
    if (userLoc === jobLoc) return 100;

    // Same city check
    if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc)) return 90;

    // Different locations
    return 30;
  }

  /**
   * Calculate salary expectation match
   */
  calculateSalaryMatch(userExpectedSalary, jobSalary, type = 'job') {
    if (type === 'internship') {
      // For internships, check stipend
      if (!userExpectedSalary || !jobSalary) return 100;
      
      const userMin = userExpectedSalary.min || 0;
      const jobAmount = jobSalary.amount || 0;

      if (jobAmount >= userMin * 0.8) return 100; // Within 80% is good
      if (jobAmount >= userMin * 0.6) return 70;
      return 40;
    }

    // For jobs
    if (!userExpectedSalary || !jobSalary) return 100;

    const userMin = userExpectedSalary.min || 0;
    const jobMin = jobSalary.min || 0;
    const jobMax = jobSalary.max || jobMin;

    // Job salary meets or exceeds expectation
    if (jobMax >= userMin) return 100;
    
    // Job salary is close (within 20%)
    if (jobMin >= userMin * 0.8) return 80;
    
    // Partial match
    return 50;
  }

  /**
   * Decision Tree Classification
   * Returns success probability based on multiple factors
   */
  predictApplicationSuccess(userProfile, job, type = 'job') {
    const factors = {};

    // 1. Skills Match (40% weight) - Most important
    factors.skillsMatch = this.calculateSkillMatch(
      userProfile.skills,
      job.skills || job.requiredSkills
    );

    // 2. Experience Match (25% weight)
    factors.experienceMatch = this.calculateExperienceMatch(
      userProfile.experience,
      job.experience || job.experienceRequired
    );

    // 3. Education Match (15% weight)
    factors.educationMatch = this.calculateEducationMatch(
      userProfile.education,
      job.education || job.educationRequired
    );

    // 4. Location Match (10% weight)
    factors.locationMatch = this.calculateLocationMatch(
      userProfile.location,
      job.location,
      job.remote || job.locationType
    );

    // 5. Salary Match (10% weight)
    factors.salaryMatch = this.calculateSalaryMatch(
      userProfile.expectedSalary,
      type === 'job' ? job.salary : job.stipend,
      type
    );

    // Calculate weighted success probability
    const successProbability = Math.round(
      (factors.skillsMatch * 0.40) +
      (factors.experienceMatch * 0.25) +
      (factors.educationMatch * 0.15) +
      (factors.locationMatch * 0.10) +
      (factors.salaryMatch * 0.10)
    );

    // Decision Tree Classification
    let category;
    let recommendation;
    let confidence;

    if (successProbability >= 85) {
      category = 'excellent';
      recommendation = 'Highly recommended - You\'re an excellent match!';
      confidence = 'high';
    } else if (successProbability >= 70) {
      category = 'good';
      recommendation = 'Good match - Strong chance of success!';
      confidence = 'high';
    } else if (successProbability >= 55) {
      category = 'moderate';
      recommendation = 'Moderate match - Worth applying!';
      confidence = 'medium';
    } else if (successProbability >= 40) {
      category = 'low';
      recommendation = 'Below average match - Consider improving skills';
      confidence = 'medium';
    } else {
      category = 'poor';
      recommendation = 'Low match - Focus on better-suited opportunities';
      confidence = 'low';
    }

    // Identify strengths and weaknesses
    const strengths = [];
    const improvements = [];

    Object.entries(factors).forEach(([key, value]) => {
      const label = key.replace('Match', '');
      if (value >= 80) {
        strengths.push(label);
      } else if (value < 60) {
        improvements.push(label);
      }
    });

    return {
      successProbability,
      category,
      recommendation,
      confidence,
      factors,
      strengths,
      improvements,
      shouldApply: successProbability >= 40
    };
  }

  /**
   * Get detailed analysis with explanations
   */
  getDetailedAnalysis(userProfile, job, type = 'job') {
    const prediction = this.predictApplicationSuccess(userProfile, job, type);

    // Generate detailed feedback
    const feedback = [];

    // Skills feedback
    if (prediction.factors.skillsMatch < 60) {
      const userSkills = userProfile.skills || [];
      const requiredSkills = job.skills || job.requiredSkills || [];
      const missing = requiredSkills.filter(skill => 
        !userSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
      );
      feedback.push({
        area: 'Skills',
        status: 'needs_improvement',
        message: `Consider learning: ${missing.slice(0, 3).join(', ')}`,
        score: prediction.factors.skillsMatch
      });
    } else if (prediction.factors.skillsMatch >= 80) {
      feedback.push({
        area: 'Skills',
        status: 'strong',
        message: 'Your skills are a great match!',
        score: prediction.factors.skillsMatch
      });
    }

    // Experience feedback
    if (prediction.factors.experienceMatch < 60) {
      feedback.push({
        area: 'Experience',
        status: 'needs_improvement',
        message: 'Consider gaining more experience in this field',
        score: prediction.factors.experienceMatch
      });
    } else if (prediction.factors.experienceMatch >= 80) {
      feedback.push({
        area: 'Experience',
        status: 'strong',
        message: 'Your experience level is perfect!',
        score: prediction.factors.experienceMatch
      });
    }

    // Education feedback
    if (prediction.factors.educationMatch < 60) {
      feedback.push({
        area: 'Education',
        status: 'warning',
        message: 'Educational requirements may not be fully met',
        score: prediction.factors.educationMatch
      });
    }

    return {
      ...prediction,
      feedback,
      appliedAt: new Date().toISOString()
    };
  }
}

module.exports = new DecisionTreePrediction();
