const mongoose = require("mongoose");

const mentorSessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            unique: true,
            required: true,
        },
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mentor",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sessionTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MentorSessionType",
            required: true,
        },
        scheduledDate: {
            type: Date,
            required: true,
        },
        scheduledTime: {
            type: String, // e.g., "10:00 AM - 11:00 AM"
            required: true,
        },
        duration: {
            type: Number, // duration in minutes
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            default: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        paymentStatus: {
            type: String,
            enum: ["free", "pending", "paid", "failed", "refunded"],
            default: "pending",
        },
        paymentMode: {
            type: String,
            enum: ["none", "mock", "razorpay"],
            default: "none",
        },
        paymentId: {
            type: String,
        },
        sessionStatus: {
            type: String,
            enum: ["scheduled", "completed", "cancelled", "no-show"],
            default: "scheduled",
        },
        meetingLink: {
            type: String,
        },
        notes: {
            type: String,
        },
        cancelledBy: {
            type: String,
            enum: ["user", "mentor", "admin"],
        },
        cancelledAt: {
            type: Date,
        },
        cancellationReason: {
            type: String,
        },
        evaluation: {
            type: String, // For mock interview feedback
        },
        linkAddedAt: {
            type: Date,
        },
        mentorJoinedAt: {
            type: Date,
        },
        employeeJoinedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Indexes for efficient queries
mentorSessionSchema.index({ mentorId: 1, scheduledDate: 1 });
mentorSessionSchema.index({ userId: 1, scheduledDate: 1 });
mentorSessionSchema.index({ sessionId: 1 });
mentorSessionSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("MentorSession", mentorSessionSchema);
