const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const connectDB = require('./config/db');

const seedAdmin = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email: admin@example.com');
            console.log('Password: admin123');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create admin user
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('\n✓ Admin user created successfully!');
        console.log('\nAdmin Credentials:');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        console.log('\nUse these credentials to login at http://localhost:3000/login.html');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
