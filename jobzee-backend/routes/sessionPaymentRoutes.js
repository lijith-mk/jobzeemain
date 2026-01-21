const express = require("express");
const router = express.Router();
const controller = require("../controllers/sessionPaymentController");
const protect = require("../middleware/auth");

// All routes require user authentication
router.post("/create", protect, controller.createPaymentOrder);
router.post("/verify", protect, controller.verifyPayment);
router.get("/session/:sessionId", protect, controller.getPaymentDetails);
router.get("/invoice/:sessionId", protect, controller.generateInvoice);

module.exports = router;
