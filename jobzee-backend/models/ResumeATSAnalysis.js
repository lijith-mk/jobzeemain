const mongoose = require('mongoose');

const resumeATSAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    jobDescription: {
      type: String,
      required: true,
      trim: true,
    },
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    componentScores: {
      skill_match_score: { type: Number, default: 0 },
      experience_score: { type: Number, default: 0 },
      project_score: { type: Number, default: 0 },
      resume_structure_score: { type: Number, default: 0 },
      keyword_score: { type: Number, default: 0 },
    },
    matchedSkills: [{ type: String, trim: true }],
    missingSkills: [{ type: String, trim: true }],
    matchedKeywords: [{ type: String, trim: true }],
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    requiredYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    feedback: [{ type: String, trim: true }],
    improvementSuggestions: [{ type: String, trim: true }],
    suggestionCategories: {
      missing_skills: [{ type: String, trim: true }],
      weak_project_descriptions: [{ type: String, trim: true }],
      lack_of_measurable_achievements: [{ type: String, trim: true }],
      missing_sections: [{ type: String, trim: true }],
      score_based: [{ type: String, trim: true }],
    },
    structuredResume: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      skills: [{ type: String, trim: true }],
      skills_by_category: { type: mongoose.Schema.Types.Mixed, default: {} },
      education: [{ type: String, trim: true }],
      experience: [{ type: String, trim: true }],
      projects: [{ type: String, trim: true }],
      summary: { type: String, default: '' },
    },
    analysisSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

resumeATSAnalysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ResumeATSAnalysis', resumeATSAnalysisSchema);