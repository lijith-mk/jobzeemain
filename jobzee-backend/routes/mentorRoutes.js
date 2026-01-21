const express = require("express");
const router = express.Router();
const mentorController = require("../controllers/mentorController");
const recommendationController = require("../controllers/recommendationController");
const { uploadSingle } = require("../middleware/upload");
const { adminAuth } = require("../middleware/adminAuth");
const { mentorAuth } = require("../middleware/mentorAuth");
const { userAuth } = require("../middleware/userAuth");

// Public routes
router.post("/register", uploadSingle, mentorController.registerMentor);
router.post("/login", mentorController.loginMentor);

// AI Recommendation routes (Protected - requires user auth)
router.get("/recommended", userAuth, recommendationController.getRecommendedMentors);
router.get("/recommended/:mentorId/explanation", userAuth, recommendationController.getRecommendationExplanation);

// Protected mentor routes
router.get("/profile", mentorAuth, mentorController.getMentorProfile);
router.put(
  "/profile",
  mentorAuth,
  uploadSingle,
  mentorController.updateMentorProfile,
);

// Availability routes
router.get("/availability", mentorAuth, mentorController.getMentorAvailability);
router.put("/availability", mentorAuth, mentorController.updateMentorAvailability);


// Admin routes
router.get("/all", adminAuth, mentorController.getAllMentors);
router.put("/:mentorId/status", adminAuth, mentorController.updateMentorStatus);

// Public route to get mentor by ID
router.get("/:id", mentorController.getMentorPublicProfile);

module.exports = router;
