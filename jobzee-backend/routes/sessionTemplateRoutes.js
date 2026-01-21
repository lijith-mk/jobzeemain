const express = require("express");
const router = express.Router();
const controller = require("../controllers/sessionTemplateController");
const { adminAuth } = require("../middleware/adminAuth");

// Public routes (or protected by general auth later)
router.get("/", controller.getAllTemplates);
router.get("/:id", controller.getTemplateById);

// Admin only routes
router.post("/", adminAuth, controller.createTemplate);
router.put("/:id", adminAuth, controller.updateTemplate);
router.patch("/:id/status", adminAuth, controller.toggleTemplateStatus);
router.delete("/:id", adminAuth, controller.deleteTemplate);

module.exports = router;
