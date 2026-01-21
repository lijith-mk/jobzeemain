const express = require("express");
const router = express.Router();
const calendarNoteController = require("../controllers/calendarNoteController");
const { mentorAuth } = require("../middleware/mentorAuth");

// Apply mentor authentication to all routes
router.use(mentorAuth);

// Get all notes or filter by query params
router.get("/", calendarNoteController.getNotes);

// Get a specific note by id
router.get("/:id", calendarNoteController.getNoteById);

// Create a new note
router.post("/", calendarNoteController.createNote);

// Update a note
router.patch("/:id", calendarNoteController.updateNote);

// Delete a note
router.delete("/:id", calendarNoteController.deleteNote);

// Toggle importance status
router.patch("/:id/toggle-importance", calendarNoteController.toggleImportance);

module.exports = router;
