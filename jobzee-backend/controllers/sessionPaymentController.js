const MentorSession = require("../models/MentorSession");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");

/**
 * Generate Invoice PDF for a session
 * GET /api/session-payments/invoice/:sessionId
 */
exports.generateInvoice = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;

        const session = await MentorSession.findOne({
            $or: [{ sessionId }, { _id: sessionId.match(/^[0-9a-fA-F]{24}$/) ? sessionId : null }],
            userId,
        }).populate([
            { path: "mentorId", select: "name email city country" },
            { path: "userId", select: "name email" },
            { path: "sessionTypeId", select: "title duration price" },
        ]);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.paymentStatus !== "paid") {
            return res.status(400).json({ message: "Invoice is only available for paid sessions" });
        }

        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoice-${session.sessionId}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text("INVOICE", { align: "right" });
        doc.fontSize(10).text(`Invoice Number: INV-${session.paymentId ? session.paymentId.slice(-8) : Date.now()}`, { align: "right" });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });
        doc.moveDown();

        // Company Info
        doc.fontSize(20).text("JobZee", 50, 57);
        doc.fontSize(10)
            .text("123 Tech Street", 50, 80)
            .text("New York, NY 10001", 50, 95)
            .text("support@jobzee.com", 50, 110);

        doc.moveDown();
        doc.text("--------------------------------------------------------------------------------------------------");
        doc.moveDown();

        // Bill To & From
        const customerY = 150;
        doc.fontSize(12).text("Bill To:", 50, customerY);
        doc.fontSize(10).text(session.userId.name, 50, customerY + 15);
        doc.text(session.userId.email, 50, customerY + 30);

        doc.fontSize(12).text("Service Provider:", 300, customerY);
        doc.fontSize(10).text(session.mentorId.name, 300, customerY + 15);
        doc.text(`${session.mentorId.city}, ${session.mentorId.country}`, 300, customerY + 30);
        doc.text(session.mentorId.email, 300, customerY + 45);

        // Table Header
        const tableTop = 250;
        doc.font("Helvetica-Bold");
        doc.text("Description", 50, tableTop);
        doc.text("Duration", 300, tableTop);
        doc.text("Amount", 450, tableTop, { align: "right" });
        doc.font("Helvetica");

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table Item
        const itemY = tableTop + 30;
        doc.text(`Mentor Session - ${session.sessionTypeId.title}`, 50, itemY);
        doc.text(`${session.duration} mins`, 300, itemY);
        doc.text(`${session.amount} ${session.currency}`, 450, itemY, { align: "right" });

        // Total
        doc.moveTo(50, itemY + 20).lineTo(550, itemY + 20).stroke();
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text("Total:", 350, itemY + 40);
        doc.text(`${session.amount} ${session.currency}`, 450, itemY + 40, { align: "right" });

        // Footer
        doc.fontSize(10).font("Helvetica")
            .text("Thank you for choosing JobZee!", 50, 700, { align: "center", width: 500 });

        doc.end();

    } catch (error) {
        console.error("Error generating invoice:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate invoice" });
        }
    }
};

// Initialize Razorpay instance
function getRazorpayInstance() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Razorpay keys are not configured. Please check your environment variables.");
    }

    // Validate key format (basic validation)
    if (keyId.length < 10 || keySecret.length < 10) {
        throw new Error("Invalid Razorpay keys format. Please check your environment variables.");
    }

    try {
        return new Razorpay({ key_id: keyId, key_secret: keySecret });
    } catch (error) {
        throw new Error("Failed to initialize Razorpay instance: " + error.message);
    }
}

/**
 * Create a payment order for a session (Razorpay Integration)
 * POST /api/session-payments/create
 */
exports.createPaymentOrder = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required",
            });
        }

        // Find the session
        const session = await MentorSession.findOne({
            $or: [{ sessionId }, { _id: sessionId.match(/^[0-9a-fA-F]{24}$/) ? sessionId : null }],
            userId,
        }).populate("sessionTypeId", "title price");

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found or unauthorized",
            });
        }

        // Check if session is free
        if (session.amount === 0) {
            return res.status(400).json({
                success: false,
                message: "This is a free session. No payment required.",
            });
        }

        // Check if already paid
        if (session.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment already completed for this session",
            });
        }

        // Create Razorpay order
        const razorpay = getRazorpayInstance();
        const currency = session.currency || "INR";
        const amountInPaise = Math.round(session.amount * 100);

        if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment amount",
            });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency,
            // Razorpay receipt max length is 40 chars.
            // sessionId might be 24 chars, Date.now() is 13 chars. "session_" is 8 chars.
            // Total > 40. We need to shorten it.
            receipt: `rcpt_${Date.now()}_${session.sessionId.slice(-10)}`,
            notes: {
                sessionId: session.sessionId,
                userId: String(userId),
                mentorId: String(session.mentorId),
                sessionTypeId: String(session.sessionTypeId._id || session.sessionTypeId),
            },
        });

        // Update session with Razorpay order ID
        session.paymentMode = "razorpay";
        session.paymentId = razorpayOrder.id; // Store order ID temporarily
        await session.save();

        const paymentOrder = {
            orderId: razorpayOrder.id,
            amount: session.amount,
            currency,
            sessionId: session.sessionId,
            sessionTitle: session.sessionTypeId.title,
            paymentMode: "razorpay",
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            createdAt: new Date(),
        };

        res.status(200).json({
            success: true,
            data: paymentOrder,
            message: "Payment order created successfully",
        });
    } catch (error) {
        console.error("Error creating payment order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create payment order",
            error: error.message,
        });
    }
};

/**
 * Verify Razorpay payment
 * POST /api/session-payments/verify
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { sessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required",
            });
        }

        if (!sessionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Missing required payment verification fields",
            });
        }

        // Find the session
        const session = await MentorSession.findOne({
            $or: [{ sessionId }, { _id: sessionId.match(/^[0-9a-fA-F]{24}$/) ? sessionId : null }],
            userId,
        }).populate([
            { path: "mentorId", select: "name email" },
            { path: "userId", select: "name email" },
            { path: "sessionTypeId", select: "title duration price" },
        ]);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found or unauthorized",
            });
        }

        // Check if already paid
        if (session.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment already verified for this session",
            });
        }

        // Verify Razorpay signature
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            // Payment verification failed
            session.paymentStatus = "failed";
            await session.save();

            return res.status(400).json({
                success: false,
                message: "Payment verification failed. Invalid signature.",
            });
        }

        // Payment verified successfully
        session.paymentStatus = "paid";
        session.paymentId = razorpay_payment_id; // Store actual payment ID
        session.paymentMode = "razorpay";
        session.sessionStatus = "scheduled"; // Confirm booking

        await session.save();

        // Send Invoice Email
        try {
            const { sendSessionInvoiceEmail } = require("../utils/emailService");
            // Construct the invoice URL. Ideally, this should be a protected frontend route that fetches the PDF, 
            // but for now, we'll point to the backend download link.
            // Note: The user will need to have a valid session (cookie/token) for the download to work if the route is protected.
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
            const invoiceUrl = `${backendUrl}/api/session-payments/invoice/${session.sessionId}`;

            await sendSessionInvoiceEmail(
                session.userId.email,
                session.userId.name,
                {
                    title: session.sessionTypeId.title,
                    mentorName: session.mentorId.name,
                    date: session.scheduledDate,
                    time: session.scheduledTime,
                    amount: session.amount,
                    currency: session.currency
                },
                invoiceUrl
            );
        } catch (emailError) {
            console.error("Failed to send invoice email:", emailError);
            // We don't fail the request if email fails, as payment is already verified
        }

        res.status(200).json({
            success: true,
            data: {
                session,
                payment: {
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    amount: session.amount,
                    currency: session.currency,
                    status: "success",
                    paidAt: new Date(),
                },
            },
            message: "Payment verified successfully! Your session is confirmed.",
        });
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify payment",
            error: error.message,
        });
    }
};

/**
 * Get payment details for a session
 * GET /api/session-payments/session/:sessionId
 */
exports.getPaymentDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;
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
        }).populate([
            { path: "mentorId", select: "name email" },
            { path: "sessionTypeId", select: "title duration price" },
        ]);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found or unauthorized",
            });
        }

        const paymentDetails = {
            sessionId: session.sessionId,
            amount: session.amount,
            currency: session.currency,
            paymentStatus: session.paymentStatus,
            paymentMode: session.paymentMode,
            paymentId: session.paymentId,
            sessionTitle: session.sessionTypeId.title,
            mentorName: session.mentorId.name,
        };

        res.status(200).json({
            success: true,
            data: paymentDetails,
        });
    } catch (error) {
        console.error("Error fetching payment details:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payment details",
            error: error.message,
        });
    }
};
