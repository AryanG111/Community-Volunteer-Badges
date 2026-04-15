const User = require('../models/User');
const bcrypt = require('bcryptjs');

const initAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.log('Admin credentials not set in .env');
            return;
        }

        const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });

        if (!existingAdmin) {
            console.log('Admin not found or details mismatch. Creating/Updating admin...');
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            const user = await User.findOne({ email: adminEmail });
            
            if (user) {
                user.role = 'admin';
                user.password = hashedPassword;
                await user.save();
                console.log(`User ${adminEmail} promoted to Admin.`);
            } else {
                await User.create({
                    name: 'Global Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin'
                });
                console.log(`Admin user created: ${adminEmail}`);
            }
        } else {
            console.log('Admin check: Admin user is present and matches .env configuration.');
        }
    } catch (error) {
        console.error('Admin Initialization Error:', error);
    }
};

module.exports = initAdmin;
