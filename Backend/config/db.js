const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = (process.env.MONGO_URL || process.env.MONGO_URI || '').trim();
        
        if (!uri) {
            console.error('Available keys:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('URI')));
            throw new Error('MongoDB connection URI is missing.');
        }

        if (/\s/.test(uri)) {
            console.warn('CRITICAL WARNING: Your MongoDB URI contains a space! This will cause authentication to fail.');
        }

        // Log an obscured version of the URI for debugging
        const obscuredUri = uri.replace(/:([^@]+)@/, ":****@");
        console.log(`Attempting to connect to: ${obscuredUri}`);

        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
