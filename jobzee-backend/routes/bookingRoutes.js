const express = require("express");
const router = express.Router();
const controller = require("../controllers/bookingController");
const protect = require("../middleware/auth");
const { mentorAuth } = require("../middleware/mentorAuth");

// Public Routes
router.get("/availability", controller.getMentorDateAvailability);

// User Routes (Protected)
router.post("/book", protect, controller.bookSession);
router.get("/my-bookings", protect, controller.getMyBookings);
router.get("/:sessionId", protect, controller.getSessionById);
router.patch("/:sessionId/cancel", protect, controller.cancelSession);

// Mentor Routes (Protected)
router.get("/mentor/sessions", mentorAuth, controller.getMentorSessions);
router.get("/mentor/calendar", mentorAuth, controller.getMentorCalendar);
router.get("/mentor/sessions/:sessionId", mentorAuth, controller.getMentorSessionById);
router.patch("/mentor/sessions/:sessionId", mentorAuth, controller.updateSessionDetails);

// Shared Route (Join Tracking) - Needs to handle both authentication types
// We will rely on the controller to check `req.user` or `req.mentor`
// But we need a middleware that allows either. For simplicity, we can just make two routes pointing to the same controller
// or make the controller handle the logic and we rely on the specific route path.
// Let's separate them for clarity/security if middlewares differ.

// User Join
router.patch("/:sessionId/join", protect, controller.trackJoinSession);
// Mentor Join
router.patch("/mentor/sessions/:sessionId/join", mentorAuth, controller.trackJoinSession);

module.exports = router;
