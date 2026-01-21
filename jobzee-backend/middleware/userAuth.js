const jwt = require('jsonwebtoken');

/**
 * User Authentication Middleware
 * Verifies JWT token and ensures the user is a regular user (not employer/mentor)
 */
const userAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token, authorization denied',
            errorType: 'NO_TOKEN'
        });
    }

    // Enforce JWT_SECRET environment variable
    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_key';
    if (!jwtSecret) {
        console.error('CRITICAL: JWT_SECRET environment variable is not set!');
        return res.status(500).json({
            success: false,
            message: 'Server configuration error',
            errorType: 'SERVER_CONFIG_ERROR'
        });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);

        // Ensure it's a regular user (not employer or mentor)
        if (decoded.role && decoded.role !== 'user' && decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. User authentication required.',
                errorType: 'INVALID_USER_ROLE'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('User auth middleware error:', error.message);

        let errorType = 'INVALID_TOKEN';
        let message = 'Token is not valid';

        if (error.name === 'TokenExpiredError') {
            errorType = 'TOKEN_EXPIRED';
            message = 'Token has expired';
        } else if (error.name === 'JsonWebTokenError') {
            errorType = 'MALFORMED_TOKEN';
            message = 'Malformed token';
        }

        res.status(401).json({
            success: false,
            message,
            errorType
        });
    }
};

module.exports = { userAuth };
