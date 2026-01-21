const express = require("express");
const router = express.Router();
const mentorApplicationController = require("../controllers/mentorApplicationController");
const { uploadDocument } = require("../middleware/upload");
const { adminAuth } = require("../middleware/adminAuth");
const { mentorAuth } = require("../middleware/mentorAuth");

// Public routes
router.get("/public", mentorApplicationController.getPublicMentors);
router.get("/public/:mentorId", mentorApplicationController.getPublicMentorProfile);

// Mentor routes (protected)
router.post(
  "/submit",
  mentorAuth,
  uploadDocument,
  mentorApplicationController.submitApplication,
);
router.get(
  "/check/:mentorId",
  mentorApplicationController.checkApplicationStatus,
);
router.get(
  "/mentor/:mentorId",
  mentorAuth,
  mentorApplicationController.getApplicationByMentorId,
);
router.put(
  "/mentor/:mentorId",
  mentorAuth,
  uploadDocument,
  mentorApplicationController.updateApplication,
);
router.put(
  "/update",
  mentorAuth,
  uploadDocument,
  mentorApplicationController.updateCompletedApplication,
);

// Admin routes
router.get("/all", adminAuth, mentorApplicationController.getAllApplications);
router.put(
  "/review/:applicationId",
  adminAuth,
  mentorApplicationController.reviewApplication,
);

module.exports = router;
