const Mentor = require("../models/Mentor");
const MentorApplication = require("../models/MentorApplication");
const MentorSession = require("../models/MentorSession");
const User = require("../models/User");

/**
 * AI-Assisted Mentor Recommendation System
 * GET /api/mentors/recommended
 * 
 * This intelligent recommendation engine uses multiple factors to match employees with mentors:
 * 1. Skill Matching: Common skills between employee and mentor
 * 2. Rating Weight: Mentor's performance rating
 * 3. Previous Session History: Familiarity bonus
 * 4. Industry Alignment: Same industry preference
 * 5. Experience Level Matching: Appropriate mentor experience for employee level
 * 6. Session Success Rate: Completed vs cancelled sessions
 */
exports.getRecommendedMentors = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });
        }

        // Fetch employee profile with skills and preferences
        const employee = await User.findById(userId).select(
            "skills preferredFields experienceLevel yearsOfExperience currentRole"
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "User profile not found"
            });
        }

        // Fetch all approved mentors with their applications
        const approvedApplications = await MentorApplication.find({
            verificationStatus: "approved",
            isCompleted: true
        }).populate({
            path: "mentorId",
            match: { status: "approved", isActive: true },
            select: "name email photo country city"
        });

        // Filter out null mentorIds (in case mentor was deleted/deactivated)
        const validApplications = approvedApplications.filter(app => app.mentorId);

        if (validApplications.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: "No approved mentors available at the moment"
            });
        }

        // Fetch employee's session history for familiarity bonus
        const employeeSessions = await MentorSession.find({
            userId,
            sessionStatus: { $in: ["completed", "scheduled"] }
        }).select("mentorId sessionStatus");

        // Create a map of mentor interaction history
        const mentorInteractionMap = new Map();
        const mentorSessionStats = new Map();

        employeeSessions.forEach(session => {
            const mentorIdStr = session.mentorId.toString();

            // Count interactions
            mentorInteractionMap.set(
                mentorIdStr,
                (mentorInteractionMap.get(mentorIdStr) || 0) + 1
            );

            // Track session stats
            if (!mentorSessionStats.has(mentorIdStr)) {
                mentorSessionStats.set(mentorIdStr, { completed: 0, total: 0 });
            }
            const stats = mentorSessionStats.get(mentorIdStr);
            stats.total++;
            if (session.sessionStatus === "completed") {
                stats.completed++;
            }
        });

        // Employee's skills and preferences
        const employeeSkills = employee.skills || [];
        const employeeFields = employee.preferredFields || [];
        const employeeExperience = employee.yearsOfExperience || 0;
        const employeeLevel = employee.experienceLevel || "not-specified";

        // Calculate match score for each mentor
        const mentorScores = await Promise.all(
            validApplications.map(async (application) => {
                const mentor = application.mentorId;
                const mentorIdStr = mentor._id.toString();

                let matchScore = 0;
                let scoreBreakdown = {
                    skillMatch: 0,
                    ratingScore: 0,
                    familiarityBonus: 0,
                    industryMatch: 0,
                    experienceMatch: 0,
                    successRate: 0
                };

                // 1. SKILL MATCHING (Weight: 5 points per common skill)
                const mentorSkills = application.skills || [];
                const commonSkills = employeeSkills.filter(skill =>
                    mentorSkills.some(ms => ms.toLowerCase() === skill.toLowerCase())
                );
                scoreBreakdown.skillMatch = commonSkills.length * 5;
                matchScore += scoreBreakdown.skillMatch;

                // 2. RATING SCORE (Weight: 2 points per rating point)
                // Calculate mentor rating from completed sessions
                const mentorSessions = await MentorSession.find({
                    mentorId: mentor._id,
                    sessionStatus: "completed"
                });

                let avgRating = 5.0; // Default rating
                if (mentorSessions.length > 0) {
                    // In a real system, you'd have a rating field in sessions
                    // For now, we'll use session completion rate as a proxy
                    const completedCount = mentorSessions.length;
                    const totalSessions = await MentorSession.countDocuments({
                        mentorId: mentor._id
                    });
                    avgRating = totalSessions > 0
                        ? (completedCount / totalSessions) * 5
                        : 5.0;
                }
                scoreBreakdown.ratingScore = avgRating * 2;
                matchScore += scoreBreakdown.ratingScore;

                // 3. FAMILIARITY BONUS (Weight: 3 points if previous sessions exist)
                const previousSessions = mentorInteractionMap.get(mentorIdStr) || 0;
                if (previousSessions > 0) {
                    scoreBreakdown.familiarityBonus = 3 + Math.min(previousSessions, 3); // Cap at 6 total
                    matchScore += scoreBreakdown.familiarityBonus;
                }

                // 4. INDUSTRY/FIELD MATCHING (Weight: 4 points)
                const mentorIndustry = application.industry || "";
                const industryMatch = employeeFields.some(field =>
                    mentorIndustry.toLowerCase().includes(field.toLowerCase()) ||
                    field.toLowerCase().includes(mentorIndustry.toLowerCase())
                );
                if (industryMatch) {
                    scoreBreakdown.industryMatch = 4;
                    matchScore += scoreBreakdown.industryMatch;
                }

                // 5. EXPERIENCE LEVEL MATCHING (Weight: 3 points)
                // Match mentor experience with employee needs
                const mentorExperience = application.yearsOfExperience || 0;
                let experienceMatchScore = 0;

                if (employeeLevel === "fresher" && mentorExperience >= 3) {
                    experienceMatchScore = 3; // Experienced mentors for freshers
                } else if (employeeLevel === "experienced") {
                    if (mentorExperience > employeeExperience + 2) {
                        experienceMatchScore = 3; // Senior mentors for experienced
                    } else if (mentorExperience > employeeExperience) {
                        experienceMatchScore = 2; // Slightly more experienced
                    }
                } else if (mentorExperience >= 5) {
                    experienceMatchScore = 2; // General preference for experienced mentors
                }
                scoreBreakdown.experienceMatch = experienceMatchScore;
                matchScore += experienceMatchScore;

                // 6. SUCCESS RATE BONUS (Weight: up to 4 points)
                const stats = mentorSessionStats.get(mentorIdStr);
                if (stats && stats.total > 0) {
                    const successRate = stats.completed / stats.total;
                    scoreBreakdown.successRate = successRate * 4;
                    matchScore += scoreBreakdown.successRate;
                }

                // 7. RECENCY BONUS (Weight: 2 points for active mentors)
                // Mentors with recent sessions get a small boost
                const recentSessions = await MentorSession.countDocuments({
                    mentorId: mentor._id,
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
                });
                if (recentSessions > 0) {
                    matchScore += 2;
                }

                return {
                    _id: application._id,
                    mentorId: mentor._id,
                    name: mentor.name,
                    email: mentor.email,
                    photo: mentor.photo,
                    country: mentor.country,
                    city: mentor.city,
                    role: application.currentRole,
                    company: application.company,
                    industry: application.industry,
                    skills: application.skills,
                    yearsOfExperience: application.yearsOfExperience,
                    hourlyRate: application.hourlyRate,
                    price: application.hourlyRate === 0 ? "Free" : `₹${application.hourlyRate}/hr`,
                    rating: parseFloat(avgRating.toFixed(1)),
                    reviewCount: mentorSessions.length,
                    matchScore: parseFloat(matchScore.toFixed(2)),
                    scoreBreakdown,
                    commonSkills,
                    previousSessions
                };
            })
        );

        // Sort by match score (descending)
        mentorScores.sort((a, b) => b.matchScore - a.matchScore);

        // Get top 5 recommendations
        const topRecommendations = mentorScores.slice(0, 5);

        // FALLBACK: If employee has no skills or very low scores
        if (employeeSkills.length === 0 || topRecommendations.every(m => m.matchScore < 5)) {
            // Return top-rated mentors instead
            const fallbackMentors = mentorScores
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 5);

            return res.json({
                success: true,
                data: fallbackMentors,
                isFallback: true,
                message: "Showing top-rated mentors. Complete your profile for personalized recommendations!",
                totalMentors: mentorScores.length
            });
        }

        res.json({
            success: true,
            data: topRecommendations,
            isFallback: false,
            message: "Personalized mentor recommendations based on your profile",
            totalMentors: mentorScores.length,
            employeeProfile: {
                skillsCount: employeeSkills.length,
                experienceLevel: employeeLevel,
                yearsOfExperience: employeeExperience
            }
        });

    } catch (error) {
        console.error("Error generating mentor recommendations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate recommendations",
            error: error.message
        });
    }
};

/**
 * Get explanation for why a mentor was recommended
 * GET /api/mentors/recommended/:mentorId/explanation
 */
exports.getRecommendationExplanation = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });
        }

        const employee = await User.findById(userId).select("skills preferredFields");
        const application = await MentorApplication.findOne({
            mentorId,
            verificationStatus: "approved"
        }).populate("mentorId", "name");

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Mentor not found"
            });
        }

        const employeeSkills = employee.skills || [];
        const mentorSkills = application.skills || [];
        const commonSkills = employeeSkills.filter(skill =>
            mentorSkills.some(ms => ms.toLowerCase() === skill.toLowerCase())
        );

        const previousSessions = await MentorSession.countDocuments({
            userId,
            mentorId,
            sessionStatus: { $in: ["completed", "scheduled"] }
        });

        const explanation = {
            mentorName: application.mentorId.name,
            reasons: [],
            matchPercentage: 0
        };

        let totalPoints = 0;
        let maxPoints = 30; // Approximate max score

        if (commonSkills.length > 0) {
            explanation.reasons.push({
                icon: "🎯",
                title: "Skill Match",
                description: `You both share ${commonSkills.length} common skill(s): ${commonSkills.slice(0, 3).join(", ")}${commonSkills.length > 3 ? "..." : ""}`
            });
            totalPoints += commonSkills.length * 5;
        }

        if (previousSessions > 0) {
            explanation.reasons.push({
                icon: "🤝",
                title: "Previous Experience",
                description: `You've had ${previousSessions} successful session(s) with this mentor`
            });
            totalPoints += 6;
        }

        if (application.yearsOfExperience >= 5) {
            explanation.reasons.push({
                icon: "⭐",
                title: "Experienced Professional",
                description: `${application.yearsOfExperience}+ years of industry experience`
            });
            totalPoints += 3;
        }

        explanation.matchPercentage = Math.min(Math.round((totalPoints / maxPoints) * 100), 100);

        res.json({
            success: true,
            data: explanation
        });

    } catch (error) {
        console.error("Error getting recommendation explanation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get explanation",
            error: error.message
        });
    }
};
