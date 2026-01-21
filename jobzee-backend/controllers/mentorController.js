const Mentor = require("../models/Mentor");
const MentorApplication = require("../models/MentorApplication");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

exports.registerMentor = async (req, res) => {
  try {
    const { name, email, phone, password, country, city } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const existingMentor = await Mentor.findOne({ email: email.toLowerCase() });
    if (existingMentor) {
      return res
        .status(400)
        .json({ message: "Mentor already exists with this email" });
    }

    let photoUrl = "";
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file, "jobzee/mentors");
        photoUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Photo upload failed:", uploadError);
        // Continue without photo or return error?
        // Requirement says Photo is a field, but maybe optional?
        // Let's assume it's okay to fail upload but warn, or fail registration.
        // For now, let's fail registration if upload fails as it seems to be a required field in the form.
        return res.status(500).json({
          message: "Failed to upload photo",
          error: uploadError.message,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const mentor = await Mentor.create({
      name,
      email,
      phone,
      password: hashedPassword,
      photo: photoUrl,
      country,
      city,
    });

    res.status(201).json({
      message:
        "Mentor registered successfully. Please wait for admin approval.",
      mentorId: mentor._id,
    });
  } catch (error) {
    console.error("Mentor registration error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

exports.loginMentor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const mentor = await Mentor.findOne({ email: email.toLowerCase() });
    if (!mentor) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (mentor.status !== "approved") {
      return res.status(403).json({
        message: "Your account is not approved yet. Please contact admin.",
        errorType: "account_not_approved",
      });
    }

    // Check if mentor application is approved (if application exists)
    const application = await MentorApplication.findOne({
      mentorId: mentor._id,
    });
    if (application && application.verificationStatus !== "approved") {
      // If application exists but not approved, allow login but indicate pending status
      // This allows them to see the pending page
    }

    const isMatch = await bcrypt.compare(password, mentor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: mentor._id, role: "mentor", email: mentor.email },
      process.env.JWT_SECRET || "fallback_jwt_secret_key",
      { expiresIn: "7d" },
    );

    // Check if mentor has completed application and its status
    const existingApplication = await MentorApplication.findOne({
      mentorId: mentor._id,
    });
    const hasCompletedApplication =
      existingApplication && existingApplication.isCompleted;
    const verificationStatus = existingApplication?.verificationStatus || null;

    res.json({
      message: "Login successful",
      token,
      mentor: {
        _id: mentor._id,
        mentorId: mentor.mentorId,
        name: mentor.name,
        email: mentor.email,
        role: mentor.role,
        photo: mentor.photo,
        phone: mentor.phone,
        country: mentor.country,
        city: mentor.city,
        createdAt: mentor.createdAt,
        updatedAt: mentor.updatedAt,
        isActive: mentor.isActive,
      },
      hasCompletedApplication: hasCompletedApplication || false,
      verificationStatus: verificationStatus,
    });
  } catch (error) {
    console.error("Mentor login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.getAllMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(mentors);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch mentors", error: error.message });
  }
};

exports.updateMentorStatus = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const mentor = await Mentor.findByIdAndUpdate(
      mentorId,
      { status },
      { new: true },
    );

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json({ message: `Mentor status updated to ${status}`, mentor });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update mentor status",
      error: error.message,
    });
  }
};

// Update mentor profile response
exports.getMentorProfile = async (req, res) => {
  try {
    const mentorId = req.mentor.id; // From auth middleware

    const mentor = await Mentor.findById(mentorId).select("-password");
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json(mentor);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch mentor profile",
      error: error.message,
    });
  }
};

// Update mentor profile
exports.updateMentorProfile = async (req, res) => {
  try {
    const mentorId = req.mentor.id; // From auth middleware
    const { name, phone, country, city } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (country) updateData.country = country;
    if (city) updateData.city = city;

    // Handle photo upload if present
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file, "jobzee/mentors");
        updateData.photo = result.secure_url;
      } catch (uploadError) {
        console.error("Photo upload failed:", uploadError);
        return res.status(500).json({
          message: "Failed to upload photo",
          error: uploadError.message,
        });
      }
    }

    const mentor = await Mentor.findByIdAndUpdate(mentorId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json({ message: "Profile updated successfully", mentor });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};

// Get mentor availability
exports.getMentorAvailability = async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const mentor = await Mentor.findById(mentorId).select("availability timezone");

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json({
      success: true,
      availability: mentor.availability || [],
      timezone: mentor.timezone || "Asia/Kolkata"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch availability",
      error: error.message
    });
  }
};

// Update mentor availability
exports.updateMentorAvailability = async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const { availability, timezone } = req.body;

    // Validate availability format
    if (!Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: "Availability must be an array"
      });
    }

    // Validate each availability entry
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const entry of availability) {
      if (!entry.day || !validDays.includes(entry.day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day: ${entry.day}. Must be one of: ${validDays.join(", ")}`
        });
      }
      if (!Array.isArray(entry.slots)) {
        return res.status(400).json({
          success: false,
          message: "Slots must be an array"
        });
      }
    }

    // Check if mentor application is approved
    const application = await MentorApplication.findOne({ mentorId });
    if (!application || application.verificationStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Only approved mentors can update availability"
      });
    }

    // Update availability
    const mentor = await Mentor.findByIdAndUpdate(
      mentorId,
      {
        availability,
        timezone: timezone || "Asia/Kolkata"
      },
      { new: true, runValidators: true }
    ).select("availability timezone");

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found"
      });
    }

    res.json({
      success: true,
      message: "Availability updated successfully",
      availability: mentor.availability,
      timezone: mentor.timezone
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update availability",
      error: error.message
    });
  }
};

// Get public mentor profile by ID
exports.getMentorPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if valid ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid mentor ID" });
    }

    const mentor = await Mentor.findById(id).select(
      "-password -__v -createdAt -updatedAt"
    );

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json({
      success: true,
      data: mentor
    });
  } catch (error) {
    console.error("Error fetching public mentor profile:", error);
    res.status(500).json({
      message: "Failed to fetch mentor profile",
      error: error.message,
    });
  }
};

