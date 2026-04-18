const Badge = require('../models/Badge');
const User = require('../models/User');

// @desc    Initialize default badges
const initBadges = async () => {
    try {
        const defaultBadges = [
            {
                name: 'Bronze',
                description: 'Awarded for completing 1 volunteering event.',
                type: 'bronze',
                requiredEvents: 1,
                icon: 'bronze-badge.png'
            },
            {
                name: 'Silver',
                description: 'Awarded for completing 3 volunteering events.',
                type: 'silver',
                requiredEvents: 3,
                icon: 'silver-badge.png'
            },
            {
                name: 'Gold',
                description: 'Awarded for completing 5 volunteering events.',
                type: 'gold',
                requiredEvents: 5,
                icon: 'gold-badge.png'
            }
        ];

        for (const badge of defaultBadges) {
            await Badge.findOneAndUpdate(
                { name: badge.name },
                badge,
                { upsert: true, new: true }
            );
        }
        console.log('✓ Default badges initialized');
    } catch (error) {
        console.error('Error initializing badges:', error);
    }
};

// @desc    Get all available badges
// @route   GET /api/badges
// @access  Private
const getBadges = async (req, res) => {
    try {
        const badges = await Badge.find();
        res.status(200).json(badges);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Manually assign badge to user
// @route   POST /api/badges/assign
// @access  Private/Admin
const assignBadge = async (req, res) => {
    try {
        const { userId, badgeId } = req.body;
        
        const user = await User.findById(userId);
        const badge = await Badge.findById(badgeId);

        if (!user || !badge) {
            return res.status(404).json({ message: 'User or Badge not found' });
        }

        // Check if user already has this badge
        const hasBadge = user.badges.some(b => b.badge && b.badge.toString() === badgeId);
        if (hasBadge) {
            return res.status(400).json({ message: 'User already has this badge' });
        }

        user.badges.push({
            badge: badge._id,
            name: badge.name,
            earnedAt: new Date()
        });

        await user.save();
        res.status(200).json({ message: 'Badge assigned successfully', badges: user.badges });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logic for automatic assignment - exported for use in registration controller
const checkAndAwardBadges = async (user) => {
    try {
        const eventCount = user.eventsAttended.length;
        // Find badges that user qualifies for based on event count
        const badges = await Badge.find({ requiredEvents: { $lte: eventCount }, type: { $ne: 'special' } });

        let awarded = false;
        for (const badge of badges) {
            const hasBadge = user.badges.some(b => {
                const currentId = b.badge._id ? b.badge._id.toString() : b.badge.toString();
                return currentId === badge._id.toString();
            });
            if (!hasBadge) {
                user.badges.push({
                    badge: badge._id,
                    name: badge.name,
                    earnedAt: new Date()
                });
                awarded = true;
            }
        }

        if (awarded) {
            await user.save();
        }
        return awarded;
    } catch (error) {
        console.error('Error in checkAndAwardBadges:', error);
    }
};

module.exports = {
    getBadges,
    assignBadge,
    initBadges,
    checkAndAwardBadges
};
