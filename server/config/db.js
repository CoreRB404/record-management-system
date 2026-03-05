const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS for reliable SRV record resolution (Atlas)
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Connect to MongoDB database
 * Uses MONGO_URI from environment variables
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
