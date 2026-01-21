const MentorSession = require("../models/MentorSession");
const MentorSessionType = require("../models/MentorSessionType");
const Mentor = require("../models/Mentor");
const crypto = require("crypto");

/**
 * Book a session with a mentor
 * POST /api/sessions/book
 */
exports.bookSession = async (req, res) => {
    try {
        const { mentorId, sessionTypeId, scheduledDate, scheduledTime, notes } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required",
            });
        }

        // Validate required fields
        if (!mentorId || !sessionTypeId || !scheduledDate || !scheduledTime) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: mentorId, sessionTypeId, scheduledDate, scheduledTime",
            });
        }

        // Fetch session type details
        const sessionType = await MentorSessionType.findById(sessionTypeId);
        if (!sessionType) {
            return res.status(404).json({
                success: false,
                message: "Session type not found",
            });
        }

        // Verify mentor exists
        const mentor = await Mentor.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: "Mentor not found",
            });
        }

        // Parse scheduled date and normalize to start of day
        const sessionDate = new Date(scheduledDate);
        sessionDate.setUTCHours(0, 0, 0, 0);

        if (isNaN(sessionDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid scheduledDate format",
            });
        }

        // Check if date is in the past
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (sessionDate < today) {
            return res.status(400).json({
                success: false,
                message: "Cannot book sessions in the past",
            });
        }

        // If booking for today, check if time slot has passed
        if (sessionDate.getTime() === today.getTime()) {
            const timePart = scheduledTime.split("-")[0].trim(); // Get "10:00 AM"
            const [timeStr, modifier] = timePart.split(" ");
            let [hours, minutes] = timeStr.split(":").map(Number);

            if (modifier === "PM" && hours < 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;

            const slotDateTime = new Date();
            slotDateTime.setHours(hours, minutes, 0, 0);

            // Add a buffer (e.g., 30 mins) - user shouldn't book a slot that starts in 1 min
            // But strict check is fine: if (slotDateTime < new Date())
            if (slotDateTime < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "This time slot has already passed",
                });
            }
        }

        const dayOfWeek = sessionDate.toLocaleDateString('en-US', { weekday: 'long' });

        // Check mentor availability for the selected day and time
        const mentorAvailability = mentor.availability?.find(
            (avail) => avail.day === dayOfWeek
        );

        if (!mentorAvailability || !mentorAvailability.slots.includes(scheduledTime)) {
            return res.status(400).json({
                success: false,
                message: `Mentor is not available on ${dayOfWeek} at ${scheduledTime}`,
            });
        }

        // Check for double booking - prevent same mentor, date, and time
        const existingBooking = await MentorSession.findOne({
            mentorId,
            scheduledDate: sessionDate, // uses normalized date
            scheduledTime,
            sessionStatus: { $in: ["scheduled", "paid", "completed"] }, // Added 'paid' just in case
        });

        if (existingBooking) {
            return res.status(409).json({
                success: false,
                message: "This time slot is already booked",
            });
        }

        // Generate unique session ID
        const sessionId = `SESSION-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

        // Determine payment status and mode
        // Since free sessions are no longer allowed, assume all sessions are paid
        const isFree = false;
        const paymentStatus = "pending";
        const paymentMode = "mock";

        // Create session
        const newSession = new MentorSession({
            sessionId,
            mentorId,
            userId,
            sessionTypeId,
            scheduledDate: sessionDate,
            scheduledTime,
            duration: sessionType.duration,
            amount: sessionType.price,
            currency: sessionType.currency || "INR",
            paymentStatus,
            paymentMode,
            sessionStatus: "scheduled",
            notes,
        });

        await newSession.save();

        // Populate session details for response
        await newSession.populate([
            { path: "mentorId", select: "name email photo" },
            { path: "sessionTypeId", select: "title duration price" },
        ]);

        res.status(201).json({
            success: true,
            data: newSession,
            message: "Session created. Please complete payment to confirm booking.",
            requiresPayment: true,
        });
    } catch (error) {
        console.error("Error booking session:", error);
        res.status(500).json({
            success: false,
            message: "Failed to book session",
            error: error.message,
        });
    }
};

/**
 * Get user's booked sessions
 * GET /api/sessions/my-bookings
 */
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required",
            });
        }

        const sessions = await MentorSession.find({ userId })
            .populate("mentorId", "name email photo city country")
            .populate("sessionTypeId", "title duration price description")
            .sort({ scheduledDate: -1 });

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions,
        });
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message,
        });
    }
};

/**
 * Get mentor's sessions
 * GET /api/sessions/mentor-sessions
 */
exports.getMentorSessions = async (req, res) => {
    try {
        const mentorId = req.mentor?.id;

        if (!mentorId) {
            return res.status(401).json({
                success: false,
                message: "Mentor authentication required",
            });
        }

        const sessions = await MentorSession.find({ mentorId })
            .populate("userId", "name email")
            .populate("sessionTypeId", "title duration price")
            .sort({ scheduledDate: -1 });

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

/**
 * Get mentor's calendar data
 * GET /api/sessions/mentor/calendar
 */
exports.getMentorCalendar = async (req, res) => {
    try {
        const mentorId = req.mentor?.id;

        if (!mentorId) {
            return res.status(401).json({
                success: false,
                message: "Mentor authentication required",
            });
        }

        // Get query params for date range filtering (optional)
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                scheduledDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const sessions = await MentorSession.find({
            mentorId,
            sessionStatus: { $ne: 'cancelled' }, // Exclude cancelled sessions from calendar
            ...dateFilter
        })
            .populate("userId", "name email photo")
            .populate("sessionTypeId", "title duration price")
            .sort({ scheduledDate: 1, scheduledTime: 1 });

        // Format sessions for calendar
        const calendarEvents = sessions.map(session => {
            // Helper function to determine color based on session status
            const getColor = (status) => {
                return (status === 'scheduled' || status === 'paid') ? '#3B82F6' :
                    status === 'completed' ? '#10B981' :
                        status === 'cancelled' ? '#EF4444' :
                            status === 'no-show' ? '#F59E0B' : '#6B7280';
            };

            const sessionColor = getColor(session.sessionStatus);

            try {
                // Parse scheduled time - handle multiple formats
                const scheduledTime = session.scheduledTime || "12:00 PM";
                const startTimeString = scheduledTime.split('-')[0].trim();

                let hours = 12, minutes = 0;

                // Regex to match: "12:00 PM", "12:00PM", "12:00", "09:00"
                const timeMatch = startTimeString.match(/(\d{1,2}):(\d{2})\s?(AM|PM)?/i);

                if (timeMatch) {
                    hours = parseInt(timeMatch[1]);
                    minutes = parseInt(timeMatch[2]);
                    const modifier = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

                    if (modifier === 'PM' && hours < 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0;
                }

                const sessionDate = new Date(session.scheduledDate);
                const startDateTime = new Date(sessionDate);
                startDateTime.setHours(hours, minutes, 0, 0);

                const endDateTime = new Date(startDateTime);
                endDateTime.setMinutes(endDateTime.getMinutes() + (session.duration || 60));

                return {
                    id: session._id,
                    sessionId: session.sessionId,
                    title: session.sessionTypeId?.title || 'Mentorship Session',
                    employeeName: session.userId?.name || 'Unknown',
                    employeePhoto: session.userId?.photo,
                    employeeEmail: session.userId?.email,
                    start: startDateTime.toISOString(),
                    end: endDateTime.toISOString(),
                    duration: session.duration || 60,
                    status: session.sessionStatus,
                    paymentStatus: session.paymentStatus,
                    meetingLink: session.meetingLink,
                    amount: session.amount,
                    notes: session.notes,
                    color: sessionColor
                };
            } catch (parseError) {
                console.error(`Error parsing session ${session.sessionId}:`, parseError);
                // Return default event with CORRECT status-based color
                const sessionDate = new Date(session.scheduledDate);
                sessionDate.setHours(12, 0, 0, 0);
                const endDate = new Date(sessionDate);
                endDate.setMinutes(endDate.getMinutes() + (session.duration || 60));

                return {
                    id: session._id,
                    sessionId: session.sessionId,
                    title: session.sessionTypeId?.title || 'Mentorship Session',
                    employeeName: session.userId?.name || 'Unknown',
                    employeePhoto: session.userId?.photo,
                    employeeEmail: session.userId?.email,
                    start: sessionDate.toISOString(),
                    end: endDate.toISOString(),
                    duration: session.duration || 60,
                    status: session.sessionStatus,
                    paymentStatus: session.paymentStatus,
                    meetingLink: session.meetingLink,
                    amount: session.amount,
                    notes: session.notes,
                    color: sessionColor // Use correct color even if time parsing fails
                };
            }
        });

        res.status(200).json({
            success: true,
            count: calendarEvents.length,
            data: calendarEvents,
        });
    } catch (error) {
        console.error("Error fetching mentor calendar:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch calendar data",
            error: error.message,
        });
    }
};

/**
 * Get session by ID
 * GET /api/sessions/:sessionId
 */
exports.getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await MentorSession.findOne({
            $or: [{ sessionId }, { _id: sessionId.match(/^[0-9a-fA-F]{24}$/) ? sessionId : null }],
        })
            .populate("mentorId", "name email photo city country")
            .populate("userId", "name email")
            .populate("sessionTypeId", "title duration price description");

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        res.status(200).json({
            success: true,
            data: session,
        });
    } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch session",
            error: error.message,
        });
    }
};

/**
 * Cancel a session
 * PATCH /api/sessions/:sessionId/cancel
 */
exports.cancelSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { reason } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required",
            });
        }

        const session = await MentorSession.findOne({
            $or: [{ sessionId }, { _id: sessionId.match(/^[0-9a-fA-F]{24}$/) ? sessionId : null }],
            userId,
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found or unauthorized",
            });
        }

        if (session.sessionStatus === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Session is already cancelled",
            });
        }

        session.sessionStatus = "cancelled";
        session.cancelledBy = "user";
        session.cancelledAt = new Date();
        session.cancellationReason = reason;

        await session.save();

        res.status(200).json({
            success: true,
            data: session,
            message: "Session cancelled successfully",
        });
    } catch (error) {
        console.error("Error cancelling session:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel session",
            error: error.message,
        });
    }
};

/**
 * Get mentor availability for a specific date (Public)
 * GET /api/sessions/availability
 */
exports.getMentorDateAvailability = async (req, res) => {
    try {
        const { mentorId, date } = req.query;

        if (!mentorId || !date) {
            return res.status(400).json({
                success: false,
                message: "Missing mentorId or date"
            });
        }

        const queryDate = new Date(date);
        // Ensure we match the whole day. Note: Dates are stored as ISO in Mongo.
        // If we only store date part (set hours to 0), we should query strictly.
        // Looking at bookSession: `const sessionDate = new Date(scheduledDate);`
        // If frontend sends "2023-12-25", `new Date("2023-12-25")` usually is UTC 00:00.

        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const bookings = await MentorSession.find({
            mentorId,
            scheduledDate: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            sessionStatus: { $in: ["scheduled", "paid", "completed"] }
        }).select("scheduledTime");

        const bookedSlots = bookings.map(b => b.scheduledTime);

        res.status(200).json({
            success: true,
            bookedSlots
        });
    } catch (error) {
        console.error("Error fetching availability:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check availability",
            error: error.message
        });
    }
};

/**
 * Get session by ID for Mentor
 * GET /api/sessions/mentor/sessions/:sessionId
 */
exports.getMentorSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const mentorId = req.mentor.id;

        const session = await MentorSession.findOne({
            $or: [{ sessionId }, { _id: sessionId.match(/^[0-9a-fA-F]{24}$/) ? sessionId : null }],
            mentorId
        })
            .populate("userId", "name email city country photo resume")
            .populate("sessionTypeId", "title duration price description");

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found or unauthorized",
            });
        }

        res.status(200).json({
            success: true,
            data: session,
        });
    } catch (error) {
        console.error("Error fetching mentor session:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch session",
            error: error.message,
        });
    }
};

/**
 * Update session details (Notes, Evaluation, Status, Meeting Link)
 * PATCH /api/sessions/mentor/sessions/:sessionId
 */
exports.updateSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const mentorId = req.mentor.id;
        const { notes, evaluation, sessionStatus, meetingLink } = req.body;

        const session = await MentorSession.findOne({
            $or: [{ sessionId }, { _id: sessionId.match(/^[0-9a-fA-F]{24}$/) ? sessionId : null }],
            mentorId
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found or unauthorized",
            });
        }

        // Update fields if provided
        if (notes !== undefined) session.notes = notes;
        if (evaluation !== undefined) session.evaluation = evaluation;

        if (meetingLink !== undefined) {
            session.meetingLink = meetingLink;
            if (meetingLink && !session.linkAddedAt) {
                session.linkAddedAt = new Date();
            }
        }

        if (sessionStatus !== undefined) {
            if (sessionStatus === "completed") {
                // Check if start time has passed
                const now = new Date();
                const sessionStart = new Date(session.scheduledDate);
                // Parse scheduledTime string (e.g. "10:00 AM - 11:00 AM") to get start hour
                const timePart = session.scheduledTime.split("-")[0].trim();
                const [timeStr, modifier] = timePart.split(" ");
                let [hours, minutes] = timeStr.split(":").map(Number);

                if (modifier === "PM" && hours < 12) hours += 12;
                if (modifier === "AM" && hours === 12) hours = 0;

                sessionStart.setHours(hours, minutes, 0, 0);

                if (now < sessionStart) {
                    return res.status(400).json({
                        success: false,
                        message: "Cannot mark session as completed before it starts"
                    });
                }
            } else if (sessionStatus === "cancelled") {
                if (session.sessionStatus === "completed") {
                    return res.status(400).json({
                        success: false,
                        message: "Cannot cancel a completed session"
                    });
                }
                session.cancelledBy = "mentor";
                session.cancelledAt = new Date();
                if (req.body.cancellationReason) {
                    session.cancellationReason = req.body.cancellationReason;
                }
            }
            session.sessionStatus = sessionStatus;
        }

        await session.save();

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

/**
 * Track user/mentor joining the session
 * PATCH /api/sessions/:sessionId/join
 */
exports.trackJoinSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;
        const mentorId = req.mentor?.id;

        const session = await MentorSession.findOne({
            $or: [{ sessionId }, { _id: sessionId.match(/^[0-9a-fA-F]{24}$/) ? sessionId : null }]
        });

        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        const isMentor = mentorId && session.mentorId.toString() === mentorId;
        const isUser = userId && session.userId.toString() === userId;

        if (!isMentor && !isUser) {
            return res.status(403).json({ success: false, message: "Unauthorized to join this session" });
        }

        if (isMentor) {
            if (!session.mentorJoinedAt) {
                session.mentorJoinedAt = new Date();
                await session.save();
            }
        } else if (isUser) {
            if (!session.employeeJoinedAt) {
                session.employeeJoinedAt = new Date();
                await session.save();
            }
        }

        res.status(200).json({ success: true, message: "Join tracked" });

    } catch (error) {
        console.error("Error tracking join:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

