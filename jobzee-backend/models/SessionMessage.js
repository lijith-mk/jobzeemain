const mongoose = require("mongoose");

const sessionMessageSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MentorSession",
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        senderType: {
            type: String,
            enum: ["mentor", "user"],
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Indexes for efficient queries
sessionMessageSchema.index({ sessionId: 1, createdAt: -1 });
sessionMessageSchema.index({ sessionId: 1, isRead: 1 });

module.exports = mongoose.model("SessionMessage", sessionMessageSchema);
