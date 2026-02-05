const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// ====================
// Basic Middleware
// ====================

// CORS middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://jobzeemini.onrender.com",
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost, configured frontend URL, and Render domains
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.includes("onrender.com")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    exposedHeaders: ["Content-Length", "X-JSON"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files for certificates
app.use('/uploads/certificates', express.static('uploads/certificates'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ====================
// Routes
// ====================
const authRoutes = require("./routes/authRoutes");
const employerRoutes = require("./routes/employerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const dashboardAssets = require("./routes/dashboardAssets");
const contactRoutes = require("./routes/contactRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const savedJobRoutes = require("./routes/savedJobRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const userNotificationRoutes = require("./routes/userNotificationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const eventsPublic = require("./routes/eventsPublic");
const ticketRoutes = require("./routes/ticketRoutes");
const employerNotifications = require("./routes/employerNotifications");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const shopPaymentRoutes = require("./routes/shopPaymentRoutes");
const addressRoutes = require("./routes/addressRoutes");
const cartRoutes = require("./routes/cartRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const internshipApplicationRoutes = require("./routes/internshipApplicationRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const screeningRoutes = require("./routes/screeningRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const mentorApplicationRoutes = require("./routes/mentorApplicationRoutes");
const sessionTemplateRoutes = require("./routes/sessionTemplateRoutes");
const mentorSessionRoutes = require("./routes/mentorSessionRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const sessionPaymentRoutes = require("./routes/sessionPaymentRoutes");
const messageRoutes = require("./routes/messageRoutes");
const calendarNoteRoutes = require("./routes/calendarNoteRoutes");
const testRoutes = require("./routes/testRoutes");
const employerTestRoutes = require("./routes/employerTestRoutes");
const employerQuestionBankRoutes = require("./routes/employerQuestionBankRoutes");
const learningRoutes = require("./routes/learningRoutes");
const learningPathRoutes = require("./routes/learningPathRoutes");
const microQuizRoutes = require("./routes/microQuizRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/employers", employerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardAssets);
app.use("/api/contact", contactRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/user/notifications", userNotificationRoutes);
app.use("/api/events", eventsPublic);
app.use("/api/tickets", ticketRoutes);
app.use("/api/employers/notifications", employerNotifications);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shop-payments", shopPaymentRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/internship-applications", internshipApplicationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/screening", screeningRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/mentor-applications", mentorApplicationRoutes);
app.use("/api/session-templates", sessionTemplateRoutes);
app.use("/api/mentor-sessions", mentorSessionRoutes);
app.use("/api/sessions", bookingRoutes);
app.use("/api/session-payments", sessionPaymentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/calendar-notes", calendarNoteRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/employer-tests", employerTestRoutes);
app.use("/api/employer-questions", employerQuestionBankRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/learning-paths", learningPathRoutes);
app.use("/api", microQuizRoutes); // Micro quiz routes
app.use("/api/certificates", certificateRoutes); // Certificate routes

// Debug endpoint to test frontend connectivity
app.get("/api/debug", (req, res) => {
  res.json({
    message: "Debug endpoint working!",
    timestamp: new Date().toISOString(),
    origin: req.get("Origin") || "No origin header",
    userAgent: req.get("User-Agent") || "No user agent",
    method: req.method,
    url: req.url,
    headers: req.headers,
  });
});

// Test POST endpoint
app.post("/api/debug", (req, res) => {
  res.json({
    message: "Debug POST endpoint working!",
    timestamp: new Date().toISOString(),
    body: req.body,
    origin: req.get("Origin") || "No origin header",
    contentType: req.get("Content-Type") || "No content type",
  });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    let dbPing = "Unknown";
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        dbPing = "OK";
      }
    } catch (pingError) {
      dbPing = "Failed";
    }

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStates[dbState],
        connected: dbState === 1,
        ping: dbPing,
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        status: "error",
        connected: false,
      },
    });
  }
});

// Handle 404 for unmatched routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    errorType: "not_found",
  });
});

// Global error handler middleware (must be last)
app.use((err, req, res, next) => {
  console.error("Global error handler:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      errorType: "server_error",
    });
  }
});

// ====================
// MongoDB Connection
// ====================
const mongoUri = process.env.MONGODB_URI?.includes("mongodb+srv")
  ? process.env.MONGODB_URI
  : process.env.MONGO_URI;

console.log("Attempting to connect to MongoDB...");
mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  })
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    console.log(
      "Database URI:",
      mongoUri.replace(/:([^:@]{8})[^:@]*@/, ":***@"),
    );
    // Ensure important indexes exist (non-blocking)
    try {
      const UserSignIn = require("./models/UserSignIn");
      await UserSignIn.syncIndexes();
      console.log("🔧 UserSignIn indexes synced");
    } catch (e) {
      console.warn("⚠️ Failed to sync UserSignIn indexes:", e?.message || e);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    // Don't exit, let server run without DB for debugging
  });

// MongoDB connection event handlers
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT. Gracefully shutting down...");
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
});

// ====================
// Start Server
// ====================
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on("error", (err) => {
  console.error("❌ Server error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please use a different port.`,
    );
  }
});

// Set server timeout
server.timeout = 30000; // 30 seconds
