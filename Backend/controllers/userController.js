const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (user) {
            const participationCount = user.eventsAttended ? user.eventsAttended.length : 0;
            const displayName = user.name && user.name.trim() ? user.name : user.email.split('@')[0];

            res.status(200).json({
                _id: user._id,
                name: displayName,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                badges: user.badges || [],
                eventsAttended: user.eventsAttended || [],
                participationCount
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProfile
};
