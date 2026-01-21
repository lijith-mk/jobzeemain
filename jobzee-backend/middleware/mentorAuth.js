const jwt = require("jsonwebtoken");
const Mentor = require("../models/Mentor");

const mentorAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
        errorType: "no_token",
      });
    }

    // Enforce JWT_SECRET environment variable
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

    // Check if the token is for a mentor
    if (decoded.role !== "mentor") {
      return res.status(403).json({
        message: "Access denied. Mentor access required.",
        errorType: "invalid_role",
      });
    }

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

    next();
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
    console.error("Mentor auth error:", err);
    res.status(500).json({
      message: "Server error during authentication",
      errorType: "server_error",
    });
  }
};

module.exports = { mentorAuth };
