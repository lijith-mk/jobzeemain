const express = require("express");
const router = express.Router();
const controller = require("../controllers/mentorSessionController");
const { mentorAuth } = require("../middleware/mentorAuth");

// Protected Mentor Routes
router.post("/", mentorAuth, controller.createSessionType);
router.get("/my-sessions", mentorAuth, controller.getMySessionTypes);
router.put("/:id", mentorAuth, controller.updateSessionType);
router.patch("/:id/status", mentorAuth, controller.toggleSessionStatus);
router.delete("/:id", mentorAuth, controller.deleteSessionType);

// Public Routes
router.get("/public/:mentorId", controller.getMentorSessionsPublic);

module.exports = router;
