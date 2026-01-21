const MentorSessionType = require("../models/MentorSessionType");
const SessionTemplate = require("../models/SessionTemplate");
const crypto = require("crypto");

// Create a new session type for a mentor
exports.createSessionType = async (req, res) => {
    try {
        const { templateId, title, duration, price, description, currency } = req.body;
        const mentorId = req.mentor.id;

        // Validate template exists and is active
        const template = await SessionTemplate.findOne({
            $or: [{ templateId: templateId }, { _id: templateId.match(/^[0-9a-fA-F]{24}$/) ? templateId : null }],
            isActive: true,
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Session template not found or inactive",
            });
        }

        const sessionTypeId = crypto.randomBytes(6).toString("hex");

        if (!price || price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be greater than 0. Free sessions are not allowed.",
            });
        }

        const newSessionType = new MentorSessionType({
            sessionTypeId,
            mentorId,
            templateId: template._id,
            title: title || template.title, // Use template title if not provided
            duration: duration || template.defaultDuration, // Use template duration if not provided
            price: price,
            currency: currency || "INR",
            description: description || template.description,
            isActive: true,
        });

        await newSessionType.save();

        res.status(201).json({
            success: true,
            data: newSessionType,
            message: "Session type created successfully",
        });
    } catch (error) {
        console.error("Error creating mentor session type:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create session type",
            error: error.message,
        });
    }
};

// Get all session types for the logged-in mentor
exports.getMySessionTypes = async (req, res) => {
    try {
        const mentorId = req.mentor.id;
        const sessions = await MentorSessionType.find({ mentorId })
            .populate("templateId", "title category")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions,
        });
    } catch (error) {
        console.error("Error fetching mentor sessions:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch sessions",
            error: error.message,
        });
    }
};

// Update a session type
exports.updateSessionType = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.mentor.id;
        const updateData = req.body;

        // Prevent updating critical fields like mentorId or templateId directly if not key
        delete updateData.mentorId;
        delete updateData.templateId;
        delete updateData.sessionTypeId;

        if (updateData.price !== undefined && updateData.price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be greater than 0. Free sessions are not allowed.",
            });
        }

        const session = await MentorSessionType.findOneAndUpdate(
            {
                $or: [{ sessionTypeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
                mentorId,
            },
            updateData,
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session type not found or unauthorized",
            });
        }

        res.status(200).json({
            success: true,
            data: session,
            message: "Session updated successfully",
        });
    } catch (error) {
        console.error("Error updating session:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update session",
            error: error.message,
        });
    }
};

// Toggle status
exports.toggleSessionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.mentor.id;

        const session = await MentorSessionType.findOne({
            $or: [{ sessionTypeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
            mentorId,
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session type not found or unauthorized",
            });
        }

        session.isActive = !session.isActive;
        await session.save();

        res.status(200).json({
            success: true,
            data: session,
            message: `Session ${session.isActive ? "activated" : "deactivated"} successfully`,
        });
    } catch (error) {
        console.error("Error toggling session status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update session status",
            error: error.message,
        });
    }
};

// Delete session type
exports.deleteSessionType = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.mentor.id;

        const session = await MentorSessionType.findOneAndDelete({
            $or: [{ sessionTypeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
            mentorId,
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session type not found or unauthorized",
            });
        }

        res.status(200).json({
            success: true,
            message: "Session deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting session:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete session",
            error: error.message,
        });
    }
};

// Public: Get sessions for a specific mentor (by mentorId in params)
exports.getMentorSessionsPublic = async (req, res) => {
    try {
        const { mentorId } = req.params;
        // logic to resolve mentorId might be needed if it's the custom string ID vs mongo ID
        // For now assume mongo ID if using direct routes or search by custom ID

        const sessions = await MentorSessionType.find({
            mentorId: mentorId, // Make sure to match how you look up mentors
            isActive: true
        }).populate("templateId", "title category");

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });

    } catch (error) {
        console.error("Error fetching public mentor sessions:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch sessions",
            error: error.message,
        });
    }
}
