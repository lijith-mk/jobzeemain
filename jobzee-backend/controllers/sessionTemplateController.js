const SessionTemplate = require("../models/SessionTemplate");
const { v4: uuidv4 } = require("uuid"); // Assuming uuid is available or I can use crypto
const crypto = require("crypto");

// Create a new session template
exports.createTemplate = async (req, res) => {
    try {
        const { title, description, defaultDuration, category, isActive } = req.body;

        const templateId = crypto.randomBytes(4).toString("hex"); // Generate a simple unique ID

        const newTemplate = new SessionTemplate({
            templateId,
            title,
            description,
            defaultDuration,
            category,
            isActive: isActive !== undefined ? isActive : true,
        });

        await newTemplate.save();

        res.status(201).json({
            success: true,
            data: newTemplate,
            message: "Session template created successfully",
        });
    } catch (error) {
        console.error("Error creating session template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create session template",
            error: error.message,
        });
    }
};

// Get all session templates
exports.getAllTemplates = async (req, res) => {
    try {
        const { isActive } = req.query;
        const query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        const templates = await SessionTemplate.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: templates.length,
            data: templates,
        });
    } catch (error) {
        console.error("Error fetching session templates:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch session templates",
            error: error.message,
        });
    }
};

// Get a single session template by ID
exports.getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await SessionTemplate.findOne({
            $or: [{ templateId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Session template not found",
            });
        }

        res.status(200).json({
            success: true,
            data: template,
        });
    } catch (error) {
        console.error("Error fetching session template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch session template",
            error: error.message,
        });
    }
};

// Update a session template
exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const template = await SessionTemplate.findOneAndUpdate(
            {
                $or: [{ templateId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
            },
            updateData,
            { new: true, runValidators: true }
        );

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Session template not found",
            });
        }

        res.status(200).json({
            success: true,
            data: template,
            message: "Session template updated successfully",
        });
    } catch (error) {
        console.error("Error updating session template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update session template",
            error: error.message,
        });
    }
};

// Toggle template status (enable/disable)
exports.toggleTemplateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body; // Expect explicit status or toggle if not provided

        const query = {
            $or: [{ templateId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
        };

        const template = await SessionTemplate.findOne(query);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Session template not found",
            });
        }

        // specific set or toggle
        template.isActive = isActive !== undefined ? isActive : !template.isActive;
        await template.save();

        res.status(200).json({
            success: true,
            data: template,
            message: `Session template ${template.isActive ? "enabled" : "disabled"} successfully`,
        });
    } catch (error) {
        console.error("Error toggling session template status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update session template status",
            error: error.message,
        });
    }
};

// Delete a session template (Optional, but good for cleanup)
exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await SessionTemplate.findOneAndDelete({
            $or: [{ templateId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Session template not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Session template deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting session template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete session template",
            error: error.message,
        });
    }
}
