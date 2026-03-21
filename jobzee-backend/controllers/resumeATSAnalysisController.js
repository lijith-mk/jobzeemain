const ResumeATSAnalysis = require('../models/ResumeATSAnalysis');
const { analyzeResumeWithATS } = require('../services/aiResumeAnalysisService');

function buildStoredAnalysisDocument({ userId, file, jobDescription, aiResult }) {
  return {
    userId,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    jobDescription,
    atsScore: aiResult.ats_score,
    componentScores: aiResult.component_scores,
    matchedSkills: aiResult.matched_skills || [],
    missingSkills: aiResult.missing_skills || [],
    matchedKeywords: aiResult.matched_keywords || [],
    experienceYears: aiResult.experience_years || 0,
    requiredYears: aiResult.required_years || 0,
    feedback: aiResult.feedback || [],
    improvementSuggestions: aiResult.improvement_suggestions || [],
    suggestionCategories: aiResult.suggestion_categories || {},
    structuredResume: {
      name: aiResult.name || '',
      email: aiResult.email || '',
      phone: aiResult.phone || '',
      skills: aiResult.skills || [],
      skills_by_category: aiResult.skills_by_category || {},
      education: aiResult.education || [],
      experience: aiResult.experience || [],
      projects: aiResult.projects || [],
      summary: aiResult.summary || '',
    },
    analysisSnapshot: aiResult,
  };
}

exports.analyzeResumeAndStoreATS = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required',
      });
    }

    const jobDescription = req.body.jobDescription?.trim();
    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'jobDescription is required',
      });
    }

    const aiResult = await analyzeResumeWithATS({
      fileBuffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      jobDescription,
    });

    const analysis = await ResumeATSAnalysis.create(
      buildStoredAnalysisDocument({
        userId: req.user.id,
        file: req.file,
        jobDescription,
        aiResult,
      })
    );

    return res.status(201).json({
      success: true,
      message: 'Resume analyzed successfully',
      analysisId: analysis._id,
      atsScore: analysis.atsScore,
      analysis: aiResult,
    });
  } catch (error) {
    console.error('[Resume ATS Analysis] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze resume',
    });
  }
};

exports.getMyResumeATSAnalyses = async (req, res) => {
  try {
    const analyses = await ResumeATSAnalysis.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        'originalFilename atsScore componentScores matchedSkills missingSkills improvementSuggestions createdAt updatedAt'
      )
      .lean();

    return res.status(200).json({
      success: true,
      count: analyses.length,
      analyses,
    });
  } catch (error) {
    console.error('[Resume ATS Analysis] Fetch history error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ATS analysis history',
    });
  }
};

exports.getResumeATSAnalysisById = async (req, res) => {
  try {
    const analysis = await ResumeATSAnalysis.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'ATS analysis not found',
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('[Resume ATS Analysis] Fetch detail error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ATS analysis',
    });
  }
};