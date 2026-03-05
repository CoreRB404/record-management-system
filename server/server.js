require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// ── Validate required env vars before starting ──────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

const PORT = process.env.PORT || 5000;

/**
 * Start the server
 * Connects to MongoDB, then starts Express
 */
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
