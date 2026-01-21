const mongoose = require("mongoose");

const mentorSessionTypeSchema = new mongoose.Schema(
    {
        sessionTypeId: {
            type: String,
            unique: true,
            required: true,
        },
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mentor",
            required: true,
        },
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SessionTemplate",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        duration: {
            type: Number, // duration in minutes
            required: true,
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        currency: {
            type: String,
            default: 'INR'
        },
        description: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Compound index to ensure a mentor can't have duplicate templates of the same type if needed, 
// but for now we might allow multiple "Mock Interview" types with different prices/durations.
// Let's index mentorId for fast lookups.
mentorSessionTypeSchema.index({ mentorId: 1 });

module.exports = mongoose.model("MentorSessionType", mentorSessionTypeSchema);
