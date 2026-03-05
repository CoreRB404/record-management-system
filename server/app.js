const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const mongoSanitize = require('./middleware/mongoSanitize');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recordRoutes = require('./routes/recordRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const trashRoutes = require('./routes/trashRoutes');

const app = express();

// ── Security Middleware ──────────────────────────────────────────────
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: { policy: 'same-site' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
        noSniff: true,
        xssFilter: true,
    })
);

app.use(
    cors({
        origin: function (origin, callback) {
            // read comma-separated list of allowed origins from env variable
            // special case: allow '*' to accept any origin (development/test only!)
            const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
            const allowedOrigins = raw.split(',').map((o) => o.trim());

            // allow if no Origin header (curl, mobile, etc.)
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes('*')) {
                if (process.env.NODE_ENV === 'production') {
                    console.warn('CORS: wildcard * is not allowed in production');
                    return callback(new Error('Not allowed by CORS'));
                }
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400, // Cache preflight for 24 hours
    })
);

// ── Rate Limiting ────────────────────────────────────────────────────
// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
});

// Strict rate limiter for authentication endpoints (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Only 10 login attempts per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.',
    },
});

// Strict rate limiter for password-related endpoints
const passwordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Only 5 password change attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password change attempts. Please try again later.',
    },
});

app.use('/api/', apiLimiter);

// ── Body Parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb to prevent large payload attacks
app.use(express.urlencoded({ extended: false })); // false is safer — no nested objects

// ── NoSQL Injection Prevention ───────────────────────────────────────
// Strips MongoDB operators ($gt, $regex, $where, etc.) from all user input
app.use(mongoSanitize);

// ── Logging ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ── Security Headers (additional) ────────────────────────────────────
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.removeHeader('X-Powered-By');
    next();
});

// ── API Routes ───────────────────────────────────────────────────────
app.use('/api/auth/login', authLimiter); // Brute-force protection on login
app.use('/api/auth/password', passwordLimiter); // Rate limit password changes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/trash', trashRoutes);

// ── Health Check ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

// ── 404 Handler ──────────────────────────────────────────────────────
// Don't expose route details in production
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found',
    });
});

// ── Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
