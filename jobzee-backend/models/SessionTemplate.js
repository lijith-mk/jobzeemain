const mongoose = require("mongoose");

const sessionTemplateSchema = new mongoose.Schema(
    {
        templateId: {
            type: String,
            unique: true,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        defaultDuration: {
            type: Number, // duration in minutes
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("SessionTemplate", sessionTemplateSchema);
