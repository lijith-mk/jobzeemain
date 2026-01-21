const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");


const jwt = require("jsonwebtoken");
const Mentor = require("../models/Mentor");

// Middleware to allow both user and mentor authentication
const protectBoth = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
                errorType: "no_token",
            });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("CRITICAL: JWT_SECRET environment variable is not set!");
            return res.status(500).json({
                success: false,
                message: "Server configuration error",
                errorType: "server_config_error",
            });
        }

        const decoded = jwt.verify(token, jwtSecret);

        if (decoded.role === "mentor") {
            const mentor = await Mentor.findById(decoded.id);

            if (!mentor) {
                return res.status(401).json({
                    message: "Mentor not found",
                    errorType: "mentor_not_found",
                });
            }

            if (mentor.status !== "approved") {
                return res.status(403).json({
                    message: "Your account is not approved yet. Please contact admin.",
                    errorType: "account_not_approved",
                });
            }

            if (!mentor.isActive) {
                return res.status(401).json({
                    message: "Account is deactivated",
                    errorType: "account_deactivated",
                });
            }

            req.mentor = {
                id: mentor._id,
                name: mentor.name,
                email: mentor.email,
                role: mentor.role,
                photo: mentor.photo,
            };
            // Ensure req.user is undefined to avoid confusion in controller
            req.user = undefined;

            return next();
        } else {
            // Assume it's a user (or admin)
            // We can optionally verify against User model if needed, but standard userAuth often just trusts the token for basic access
            // However, to be safe and consistent with userAuth middleware logic:
            if (decoded.role && decoded.role !== 'user' && decoded.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Invalid role.',
                    errorType: 'INVALID_ROLE'
                });
            }

            req.user = decoded;
            // Ensure req.mentor is undefined
            req.mentor = undefined;
            return next();
        }
    } catch (err) {
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid token",
                errorType: "invalid_token",
            });
        }
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired",
                errorType: "token_expired",
            });
        }
        console.error("Auth error:", err);
        return res.status(500).json({
            message: "Server error during authentication",
            errorType: "server_error",
        });
    }
};

// Send a message
router.post("/send", protectBoth, messageController.sendMessage);

// Get messages for a session
router.get("/session/:sessionId", protectBoth, messageController.getSessionMessages);

// Mark messages as read
router.patch("/mark-read/:sessionId", protectBoth, messageController.markMessagesAsRead);

// Get unread message count
router.get("/unread-count", protectBoth, messageController.getUnreadCount);

// Get all conversations
router.get("/conversations", protectBoth, messageController.getConversations);

module.exports = router;
