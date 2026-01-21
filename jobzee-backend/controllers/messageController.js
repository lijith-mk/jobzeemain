const MentorSession = require("../models/MentorSession");
const SessionMessage = require("../models/SessionMessage");
const Mentor = require("../models/Mentor");
const User = require("../models/User");

/**
 * Utility function to check if messaging is allowed for a session
 * @param {Object} session - The session object
 * @param {String} userId - The user ID attempting to send message
 * @param {String} userType - 'mentor' or 'user'
 * @returns {Object} { allowed: boolean, reason: string }
 */
const canSendMessage = (session, userId, userType) => {
    // Convert IDs to strings for comparison
    const sessionMentorId = session.mentorId?._id ? session.mentorId._id.toString() : session.mentorId.toString();
    const sessionUserId = session.userId?._id ? session.userId._id.toString() : session.userId.toString();
    const currentUserId = userId.toString();

    // Check if user is part of the session
    const isMentor = userType === "mentor" && sessionMentorId === currentUserId;
    const isEmployee = userType === "user" && sessionUserId === currentUserId;

    console.log('canSendMessage check:', {
        userType,
        currentUserId,
        sessionMentorId,
        sessionUserId,
        isMentor,
        isEmployee
    });

    if (!isMentor && !isEmployee) {
        return {
            allowed: false,
            reason: "You are not a participant in this session",
        };
    }

    // Check session status - messaging blocked for cancelled and no-show
    const blockedStatuses = ["cancelled", "no-show"];
    if (blockedStatuses.includes(session.sessionStatus)) {
        return {
            allowed: false,
            reason: `This session was ${session.sessionStatus}. Messaging is disabled.`,
        };
    }

    // Messaging allowed for scheduled, completed sessions
    return {
        allowed: true,
        reason: "Messaging is active",
    };
};

/**
 * Send a message in a session
 * POST /api/messages/send
 */
exports.sendMessage = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const senderId = req.user?.id || req.mentor?.id;
        const senderType = req.user ? "user" : "mentor";

        console.log('sendMessage called:', {
            sessionId,
            senderId,
            senderType,
            hasUser: !!req.user,
            hasMentor: !!req.mentor,
            userObj: req.user,
            mentorObj: req.mentor
        });

        if (!sessionId || !message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Session ID and message are required",
            });
        }

        // Find session
        const session = await MentorSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        console.log('Session found:', {
            sessionId: session._id,
            mentorId: session.mentorId,
            userId: session.userId,
            sessionStatus: session.sessionStatus
        });

        // Check if messaging is allowed
        const messageCheck = canSendMessage(session, senderId, senderType);
        if (!messageCheck.allowed) {
            return res.status(403).json({
                success: false,
                message: messageCheck.reason,
            });
        }

        // Create message
        const newMessage = new SessionMessage({
            sessionId,
            senderId,
            senderType,
            message: message.trim(),
        });

        await newMessage.save();

        // Populate sender info
        const populatedMessage = await SessionMessage.findById(newMessage._id)
            .populate({
                path: "senderId",
                select: "name email photo",
                model: senderType === "mentor" ? "Mentor" : "User",
            });

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: populatedMessage,
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: error.message,
        });
    }
};

/**
 * Get all messages for a session
 * GET /api/messages/session/:sessionId
 */
exports.getSessionMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id || req.mentor?.id;
        const userType = req.user ? "user" : "mentor";

        // Find session
        const session = await MentorSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        console.log('getSessionMessages - Session found:', {
            sessionId: session._id,
            mentorId: session.mentorId,
            userId: session.userId,
            requestUserId: userId,
            requestUserType: userType
        });

        // Check if user is part of the session - handle both populated and unpopulated IDs
        const sessionMentorId = session.mentorId?._id ? session.mentorId._id.toString() : session.mentorId.toString();
        const sessionUserId = session.userId?._id ? session.userId._id.toString() : session.userId.toString();
        const currentUserId = userId.toString();

        const isMentor = userType === "mentor" && sessionMentorId === currentUserId;
        const isEmployee = userType === "user" && sessionUserId === currentUserId;

        console.log('getSessionMessages - Participant check:', {
            sessionMentorId,
            sessionUserId,
            currentUserId,
            isMentor,
            isEmployee
        });

        if (!isMentor && !isEmployee) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view these messages",
            });
        }

        // Get messages
        const messages = await SessionMessage.find({ sessionId })
            .sort({ createdAt: 1 })
            .lean();

        // Populate sender info for each message
        const populatedMessages = await Promise.all(
            messages.map(async (msg) => {
                const Model = msg.senderType === "mentor" ? Mentor : User;
                const sender = await Model.findById(msg.senderId).select("name email photo");
                return {
                    ...msg,
                    sender,
                };
            })
        );

        // Check messaging status
        const messageCheck = canSendMessage(session, userId, userType);

        res.status(200).json({
            success: true,
            data: {
                messages: populatedMessages,
                session: {
                    sessionId: session.sessionId,
                    status: session.sessionStatus,
                    scheduledDate: session.scheduledDate,
                    scheduledTime: session.scheduledTime,
                },
                messagingAllowed: messageCheck.allowed,
                messagingReason: messageCheck.reason,
            },
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
            error: error.message,
        });
    }
};

/**
 * Mark messages as read
 * PATCH /api/messages/mark-read/:sessionId
 */
exports.markMessagesAsRead = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id || req.mentor?.id;
        const userType = req.user ? "user" : "mentor";

        // Find session
        const session = await MentorSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        // Check if user is part of the session - handle both populated and unpopulated IDs
        const sessionMentorId = session.mentorId?._id ? session.mentorId._id.toString() : session.mentorId.toString();
        const sessionUserId = session.userId?._id ? session.userId._id.toString() : session.userId.toString();
        const currentUserId = userId.toString();

        const isMentor = userType === "mentor" && sessionMentorId === currentUserId;
        const isEmployee = userType === "user" && sessionUserId === currentUserId;

        if (!isMentor && !isEmployee) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to mark these messages as read",
            });
        }

        // Mark messages as read (messages sent by the other party)
        const otherSenderType = userType === "mentor" ? "user" : "mentor";
        const result = await SessionMessage.updateMany(
            {
                sessionId,
                senderType: otherSenderType,
                isRead: false,
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            }
        );

        res.status(200).json({
            success: true,
            message: "Messages marked as read",
            data: {
                modifiedCount: result.modifiedCount,
            },
        });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark messages as read",
            error: error.message,
        });
    }
};

/**
 * Get unread message count for a user
 * GET /api/messages/unread-count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id || req.mentor?.id;
        const userType = req.user ? "user" : "mentor";

        // Find all sessions for this user
        const query = userType === "mentor" ? { mentorId: userId } : { userId };
        const sessions = await MentorSession.find(query).select("_id");
        const sessionIds = sessions.map((s) => s._id);

        // Count unread messages (sent by the other party)
        const otherSenderType = userType === "mentor" ? "user" : "mentor";
        const unreadCount = await SessionMessage.countDocuments({
            sessionId: { $in: sessionIds },
            senderType: otherSenderType,
            isRead: false,
        });

        res.status(200).json({
            success: true,
            data: {
                unreadCount,
            },
        });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch unread count",
            error: error.message,
        });
    }
};

/**
 * Get all conversations (sessions with messages) for a user
 * GET /api/messages/conversations
 */
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user?.id || req.mentor?.id;
        const userType = req.user ? "user" : "mentor";

        // Find all sessions for this user
        const query = userType === "mentor" ? { mentorId: userId } : { userId };
        const sessions = await MentorSession.find(query)
            .populate("mentorId", "name email photo")
            .populate("userId", "name email photo")
            .populate("sessionTypeId", "title")
            .sort({ scheduledDate: -1 });

        // Get last message and unread count for each session
        const conversations = await Promise.all(
            sessions.map(async (session) => {
                const lastMessage = await SessionMessage.findOne({ sessionId: session._id })
                    .sort({ createdAt: -1 })
                    .lean();

                const otherSenderType = userType === "mentor" ? "user" : "mentor";
                const unreadCount = await SessionMessage.countDocuments({
                    sessionId: session._id,
                    senderType: otherSenderType,
                    isRead: false,
                });

                const messageCheck = canSendMessage(session, userId, userType);

                return {
                    session: {
                        _id: session._id,
                        sessionId: session.sessionId,
                        status: session.sessionStatus,
                        scheduledDate: session.scheduledDate,
                        scheduledTime: session.scheduledTime,
                        mentorId: session.mentorId,
                        userId: session.userId,
                        sessionTypeId: session.sessionTypeId,
                    },
                    lastMessage,
                    unreadCount,
                    messagingAllowed: messageCheck.allowed,
                };
            })
        );

        // Return ALL sessions (not just those with messages)
        // This allows users to start conversations for any booked session
        res.status(200).json({
            success: true,
            data: conversations,
        });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversations",
            error: error.message,
        });
    }
};

module.exports.canSendMessage = canSendMessage;
