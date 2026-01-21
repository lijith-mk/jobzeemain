const CalendarNote = require("../models/CalendarNote");
const crypto = require("crypto");

// Create a new calendar note
exports.createNote = async (req, res) => {
    try {
        const { title, content, date, color, isImportant, reminder } = req.body;
        const mentorId = req.mentor.id;

        // Validate required fields
        if (!title || !content || !date) {
            return res.status(400).json({
                success: false,
                message: "Title, content, and date are required fields",
            });
        }

        // Generate a unique ID for the note
        const noteId = crypto.randomBytes(6).toString("hex");

        // Create the new note
        const newNote = new CalendarNote({
            noteId,
            mentorId,
            title,
            content,
            date: new Date(date),
            color: color || "#3498db", // Default blue
            isImportant: isImportant || false,
            reminder: reminder ? new Date(reminder) : null,
        });

        await newNote.save();

        res.status(201).json({
            success: true,
            data: newNote,
            message: "Calendar note created successfully",
        });
    } catch (error) {
        console.error("Error creating calendar note:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create calendar note",
            error: error.message,
        });
    }
};

// Get all notes for the logged-in mentor
exports.getNotes = async (req, res) => {
    try {
        const mentorId = req.mentor.id;
        const { month, year, isImportant } = req.query;

        // Build query
        const query = { mentorId };

        // Filter by month and year if provided
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // Filter by importance if requested
        if (isImportant === 'true') {
            query.isImportant = true;
        }

        const notes = await CalendarNote.find(query).sort({ date: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notes.length,
            data: notes,
        });
    } catch (error) {
        console.error("Error fetching calendar notes:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch calendar notes",
            error: error.message,
        });
    }
};

// Get a single note by ID
exports.getNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.mentor.id;

        const note = await CalendarNote.findOne({
            $or: [
                { noteId: id },
                { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
            ],
            mentorId,
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found or unauthorized",
            });
        }

        res.status(200).json({
            success: true,
            data: note,
        });
    } catch (error) {
        console.error("Error fetching calendar note:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch calendar note",
            error: error.message,
        });
    }
};

// Update a note
exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.mentor.id;
        const updateData = req.body;

        // Prevent updating critical fields like mentorId or noteId
        delete updateData.mentorId;
        delete updateData.noteId;

        // Convert date and reminder to Date objects if provided
        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }

        if (updateData.reminder) {
            updateData.reminder = new Date(updateData.reminder);
        }

        const note = await CalendarNote.findOneAndUpdate(
            {
                $or: [
                    { noteId: id },
                    { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
                ],
                mentorId,
            },
            updateData,
            { new: true, runValidators: true }
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found or unauthorized",
            });
        }

        res.status(200).json({
            success: true,
            data: note,
            message: "Calendar note updated successfully",
        });
    } catch (error) {
        console.error("Error updating calendar note:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update calendar note",
            error: error.message,
        });
    }
};

// Delete a note
exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.mentor.id;

        const note = await CalendarNote.findOneAndDelete({
            $or: [
                { noteId: id },
                { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
            ],
            mentorId,
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found or unauthorized",
            });
        }

        res.status(200).json({
            success: true,
            message: "Calendar note deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting calendar note:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete calendar note",
            error: error.message,
        });
    }
};

// Toggle importance status
exports.toggleImportance = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.mentor.id;

        const note = await CalendarNote.findOne({
            $or: [
                { noteId: id },
                { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
            ],
            mentorId,
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found or unauthorized",
            });
        }

        // Toggle importance
        note.isImportant = !note.isImportant;
        await note.save();

        res.status(200).json({
            success: true,
            data: note,
            message: `Note marked as ${note.isImportant ? 'important' : 'not important'} successfully`,
        });
    } catch (error) {
        console.error("Error toggling note importance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update note importance",
            error: error.message,
        });
    }
};
