/**
 * Global error handling middleware
 * Provides consistent error responses without leaking sensitive info
 */
const errorHandler = (err, req, res, next) => {
    // Log error for development only
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        return res.status(404).json({
            success: false,
            message: 'Resource not found',
        });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'A record with that value already exists',
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((val) => val.message);
        return res.status(400).json({
            success: false,
            message: messages.join('. '),
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token has expired',
        });
    }

    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'Request blocked by CORS policy',
        });
    }

    // Default error response — never leak stack traces or internal error details
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? 'Internal Server Error'
                : err.message || 'Something went wrong',
    });
};

module.exports = errorHandler;
