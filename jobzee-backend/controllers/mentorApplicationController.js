const MentorApplication = require("../models/MentorApplication");
const Mentor = require("../models/Mentor");
const MentorCounter = require("../models/MentorCounter");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

// Submit mentor application
exports.submitApplication = async (req, res) => {
  try {
    // Get mentorId from authenticated mentor (required)
    const mentorId = req.mentor?.id;
    if (!mentorId) {
      return res.status(401).json({
        message: "Authentication required",
        errorType: "authentication_required",
      });
    }

    const {
      industry,
      currentRole,
      company,
      yearsOfExperience,
      skills,
      linkedinUrl,
      whyMentor,
    } = req.body;

    // Validation
    if (
      !industry ||
      !currentRole ||
      !company ||
      !yearsOfExperience ||
      !whyMentor
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
        errorType: "validation_error",
      });
    }

    // Check if mentor exists
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found",
        errorType: "mentor_not_found",
      });
    }

    // Check if application already exists
    const existingApplication = await MentorApplication.findOne({ mentorId });
    if (existingApplication && existingApplication.isCompleted) {
      return res.status(400).json({
        message: "Application already submitted",
        errorType: "duplicate_application",
      });
    }

    // Parse skills (can be comma-separated string or array)
    let skillsArray = [];
    if (typeof skills === "string") {
      skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else if (Array.isArray(skills)) {
      skillsArray = skills.filter((s) => s && s.trim().length > 0);
    }

    if (skillsArray.length === 0) {
      return res.status(400).json({
        message: "At least one skill is required",
        errorType: "validation_error",
      });
    }

    // Validate LinkedIn URL if provided
    if (linkedinUrl && linkedinUrl.trim()) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(linkedinUrl)) {
        return res.status(400).json({
          message: "Please provide a valid URL (starting with http:// or https://)",
          errorType: "validation_error",
        });
      }
    }

    // Validate whyMentor length
    if (whyMentor.trim().length < 50 || whyMentor.trim().length > 1000) {
      return res.status(400).json({
        message:
          "Why do you want to mentor? must be between 50 and 1000 characters",
        errorType: "validation_error",
      });
    }

    // Handle file upload if provided
    let proofDocumentUrl = "";
    if (req.file) {
      try {
        const result = await uploadToCloudinary(
          req.file,
          "jobzee/mentor-applications",
        );
        proofDocumentUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Proof document upload failed:", uploadError);
        return res.status(500).json({
          message: "Failed to upload proof document",
          error: uploadError.message,
        });
      }
    }

    // Create or update application
    const applicationData = {
      mentorId,
      industry: industry.trim(),
      currentRole: currentRole.trim(),
      company: company.trim(),
      yearsOfExperience: parseInt(yearsOfExperience),
      skills: skillsArray,
      linkedinUrl: linkedinUrl ? linkedinUrl.trim() : "",
      whyMentor: whyMentor.trim(),
      proofDocument: proofDocumentUrl,
      isCompleted: true,
      verificationStatus: "pending",
      submittedAt: new Date(),
    };

    let application;
    if (existingApplication) {
      // Update existing application
      application = await MentorApplication.findByIdAndUpdate(
        existingApplication._id,
        applicationData,
        { new: true },
      );
    } else {
      // Create new application
      application = await MentorApplication.create(applicationData);
    }

    res.status(201).json({
      message: "Application submitted successfully",
      application: {
        _id: application._id,
        mentorId: application.mentorId,
        isCompleted: application.isCompleted,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error) {
    console.error("Mentor application submission error:", error);
    res.status(500).json({
      message: "Failed to submit application",
      error: error.message,
    });
  }
};

// Check if mentor has completed application
exports.checkApplicationStatus = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const application = await MentorApplication.findOne({ mentorId });

    if (!application) {
      return res.json({
        exists: false,
        isCompleted: false,
        status: null,
        verificationStatus: null,
      });
    }

    return res.json({
      exists: true,
      isCompleted: application.isCompleted,
      status: application.isCompleted ? "completed" : "draft",
      verificationStatus: application.verificationStatus || "pending",
    });
  } catch (error) {
    console.error("Check application status error:", error);
    res.status(500).json({
      message: "Failed to check application status",
      error: error.message,
    });
  }
};

// Get application by mentor ID
exports.getApplicationByMentorId = async (req, res) => {
  try {
    // Get mentorId from authenticated mentor or params
    const mentorId = req.mentor?.id || req.params.mentorId;

    const application = await MentorApplication.findOne({ mentorId })
      .populate("mentorId", "name email")
      .select("+rejectionReason"); // Include rejectionReason for mentor to see

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.json(application);
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({
      message: "Failed to fetch application",
      error: error.message,
    });
  }
};

// Update application (for draft saving)
exports.updateApplication = async (req, res) => {
  try {
    // Get mentorId from authenticated mentor or params
    const mentorId = req.mentor?.id || req.params.mentorId;
    const updateData = req.body;

    const application = await MentorApplication.findOne({ mentorId });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (application.isCompleted) {
      return res.status(400).json({
        message: "Cannot update completed application",
      });
    }

    // Handle skills parsing if provided
    if (updateData.skills) {
      if (typeof updateData.skills === "string") {
        updateData.skills = updateData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
    }

    // Handle file upload if provided
    if (req.file) {
      try {
        const result = await uploadToCloudinary(
          req.file,
          "jobzee/mentor-applications",
        );
        updateData.proofDocument = result.secure_url;
      } catch (uploadError) {
        console.error("Proof document upload failed:", uploadError);
        return res.status(500).json({
          message: "Failed to upload proof document",
          error: uploadError.message,
        });
      }
    }

    // Validate LinkedIn URL if provided
    if (updateData.linkedinUrl && updateData.linkedinUrl.length > 0) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(updateData.linkedinUrl)) {
        return res.status(400).json({
          message: "Please provide a valid URL (starting with http:// or https://)",
          errorType: "validation_error",
        });
      }
    }

    const updatedApplication = await MentorApplication.findByIdAndUpdate(
      application._id,
      updateData,
      { new: true },
    );

    res.json({
      message: "Application updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update application error:", error);
    res.status(500).json({
      message: "Failed to update application",
      error: error.message,
    });
  }
};

// Get all applications (Admin only)
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await MentorApplication.find()
      .populate("mentorId", "name email photo mentorId status")
      .select("+rejectionReason") // Include rejectionReason in response
      .sort({ submittedAt: -1, createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error("Get all applications error:", error);
    res.status(500).json({
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

// Update completed application (for approved mentors to edit their profile)
exports.updateCompletedApplication = async (req, res) => {
  try {
    const mentorId = req.mentor?.id;
    if (!mentorId) {
      return res.status(401).json({
        message: "Authentication required",
        errorType: "authentication_required",
      });
    }

    const {
      industry,
      currentRole,
      company,
      yearsOfExperience,
      skills,
      linkedinUrl,
      whyMentor,
    } = req.body;

    const application = await MentorApplication.findOne({ mentorId });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
        errorType: "application_not_found",
      });
    }

    // Allow editing only if application is completed
    if (!application.isCompleted) {
      return res.status(400).json({
        message: "Application is not completed yet",
        errorType: "application_not_completed",
      });
    }

    // Build update data
    const updateData = {};

    if (industry) updateData.industry = industry.trim();
    if (currentRole) updateData.currentRole = currentRole.trim();
    if (company) updateData.company = company.trim();
    if (yearsOfExperience)
      updateData.yearsOfExperience = parseInt(yearsOfExperience);
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl.trim();
    if (whyMentor) updateData.whyMentor = whyMentor.trim();

    // Handle skills
    if (skills) {
      let skillsArray = [];
      if (typeof skills === "string") {
        skillsArray = skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      } else if (Array.isArray(skills)) {
        skillsArray = skills.filter((s) => s && s.trim().length > 0);
      }

      if (skillsArray.length > 0) {
        updateData.skills = skillsArray;
      }
    }

    // Validate LinkedIn URL if provided
    if (updateData.linkedinUrl && updateData.linkedinUrl.length > 0) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(updateData.linkedinUrl)) {
        return res.status(400).json({
          message: "Please provide a valid URL (starting with http:// or https://)",
          errorType: "validation_error",
        });
      }
    }

    // Validate whyMentor length if provided
    if (updateData.whyMentor) {
      if (
        updateData.whyMentor.length < 50 ||
        updateData.whyMentor.length > 1000
      ) {
        return res.status(400).json({
          message:
            "Why do you want to mentor? must be between 50 and 1000 characters",
          errorType: "validation_error",
        });
      }
    }

    // Handle file upload if provided
    if (req.file) {
      try {
        const result = await uploadToCloudinary(
          req.file,
          "jobzee/mentor-applications",
        );
        updateData.proofDocument = result.secure_url;
      } catch (uploadError) {
        console.error("Proof document upload failed:", uploadError);
        return res.status(500).json({
          message: "Failed to upload proof document",
          error: uploadError.message,
        });
      }
    }

    const updatedApplication = await MentorApplication.findByIdAndUpdate(
      application._id,
      updateData,
      { new: true, runValidators: true },
    );

    res.json({
      message: "Application updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update completed application error:", error);
    res.status(500).json({
      message: "Failed to update application",
      error: error.message,
    });
  }
};

// Review application (Approve/Reject) - Admin only
exports.reviewApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        message: 'Invalid action. Must be "approve" or "reject"',
        errorType: "invalid_action",
      });
    }

    const application =
      await MentorApplication.findById(applicationId).populate("mentorId");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
        errorType: "application_not_found",
      });
    }

    const { sendMentorApplicationStatusEmail } = require("../utils/emailService");

    if (action === "approve") {
      // Approve application
      application.verificationStatus = "approved";
      await application.save();

      // Update mentor account
      const mentor = await Mentor.findById(application.mentorId._id);
      if (mentor) {
        // Generate unique mentor ID if not already assigned
        if (!mentor.mentorId) {
          mentor.mentorId = await MentorCounter.nextMentorId();
        }
        mentor.status = "approved";
        mentor.isActive = true;
        await mentor.save();

        // Send approval email
        await sendMentorApplicationStatusEmail(mentor.email, mentor.name, 'approved');
      }

      res.json({
        message: "Application approved successfully",
        application: {
          _id: application._id,
          verificationStatus: application.verificationStatus,
          mentorId: mentor?.mentorId,
        },
      });
    } else {
      // Reject application
      application.verificationStatus = "rejected";
      application.rejectionReason = rejectionReason || "";
      await application.save();

      // Update mentor account
      const mentor = await Mentor.findById(application.mentorId._id);
      if (mentor) {
        mentor.status = "rejected";
        mentor.isActive = false;
        await mentor.save();

        // Send rejection email
        await sendMentorApplicationStatusEmail(mentor.email, mentor.name, 'rejected', rejectionReason);
      }

      res.json({
        message: "Application rejected",
        application: {
          _id: application._id,
          verificationStatus: application.verificationStatus,
          rejectionReason: application.rejectionReason,
        },
      });
    }
  } catch (error) {
    console.error("Review application error:", error);
    res.status(500).json({
      message: "Failed to review application",
      error: error.message,
    });
  }
};

// Get public listed mentors (Approved only)
exports.getPublicMentors = async (req, res) => {
  try {
    const applications = await MentorApplication.find({
      verificationStatus: "approved",
    })
      .populate("mentorId", "name email photo mentorId country city")
      .sort({ createdAt: -1 });

    const mentors = applications
      .filter((app) => app.mentorId) // Filter out any with missing mentor references
      .map((app) => ({
        _id: app.mentorId._id,
        applicationId: app._id,
        name: app.mentorId.name,
        photo: app.mentorId.photo,
        country: app.mentorId.country,
        city: app.mentorId.city,
        role: app.currentRole,
        company: app.company,
        industry: app.industry,
        skills: app.skills,
        yearsOfExperience: app.yearsOfExperience,
        linkedinUrl: app.linkedinUrl,
        // Enforce paid sessions display. If hourlyRate is 0 or missing, show a mock paid price.
        price: `$${(app.hourlyRate && app.hourlyRate > 0) ? app.hourlyRate : (25 + Math.floor(Math.random() * 75))}/session`,
      }));

    res.json(mentors);
  } catch (error) {
    console.error("Get public mentors error:", error);
    res.status(500).json({
      message: "Failed to fetch mentors",
      error: error.message,
    });
  }
};
// Get public mentor profile by ID
exports.getPublicMentorProfile = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const application = await MentorApplication.findOne({
      mentorId: mentorId,
      verificationStatus: "approved",
    }).populate("mentorId", "name email photo country city availability timezone");

    if (!application) {
      return res.status(404).json({ message: "Mentor not found or not active" });
    }

    const mentorProfile = {
      _id: application.mentorId._id,
      name: application.mentorId.name,
      photo: application.mentorId.photo,
      country: application.mentorId.country,
      city: application.mentorId.city,
      role: application.currentRole,
      company: application.company,
      industry: application.industry,
      skills: application.skills,
      yearsOfExperience: application.yearsOfExperience,
      linkedinUrl: application.linkedinUrl,
      expertise: application.expertise,
      bio: application.bio, // Provided this field exists, otherwise handled in frontend
      motivation: application.motivation,
      availability: application.mentorId.availability || [],
      timezone: application.mentorId.timezone || "Asia/Kolkata",
      rating: 5.0, // Mock
      reviewCount: 12, // Mock
      // Enforce paid session display
      price: `$${(application.hourlyRate && application.hourlyRate > 0) ? application.hourlyRate : 40}/session`,
      sessions: 24, // Mock
    };

    res.json(mentorProfile);
  } catch (error) {
    console.error("Get mentor profile error:", error);
    res.status(500).json({
      message: "Failed to fetch mentor profile",
      error: error.message,
    });
  }
};
