const User = require('../models/User');
const Registration = require('../models/Registration');
const { checkAndAwardBadges } = require('./badgeController');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        let user = await User.findById(req.user._id)
            .select('-password')
            .populate('badges.badge');

        if (user) {
            const awarded = await checkAndAwardBadges(user);
            
            // Refetch only if newly awarded to get populated badges
            if (awarded) {
                user = await User.findById(req.user._id)
                    .select('-password')
                    .populate('badges.badge');
            }

            const attendedCount = user.eventsAttended ? user.eventsAttended.length : 0;
            const registrationsCount = await Registration.countDocuments({ user: user._id });
            const displayName = user.name && user.name.trim() ? user.name : user.email.split('@')[0];

            res.status(200).json({
                _id: user._id,
                name: displayName,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                badges: user.badges || [],
                eventsAttended: user.eventsAttended || [],
                attendedCount,
                registrationsCount
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const search = req.query.search || '';
        const searchQuery = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        };

        const totalUsers = await User.countDocuments(searchQuery);
        const users = await User.find(searchQuery)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            users,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProfile,
    getAllUsers
};
