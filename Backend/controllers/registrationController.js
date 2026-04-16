const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { checkAndAwardBadges } = require('./badgeController');

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = req.user._id;

        if (!eventId) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        // 1. Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // 2. Check for duplicate registration
        const existingRegistration = await Registration.findOne({ user: userId, event: eventId });
        if (existingRegistration) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        // 3. Check for available slots
        if (event.availableSlots <= 0) {
            return res.status(400).json({ message: 'No slots available for this event' });
        }

        // 4. Create registration
        const registration = await Registration.create({
            user: userId,
            event: eventId
        });

        // 5. Update event available slots
        event.availableSlots -= 1;
        await event.save();

        res.status(201).json({
            message: 'Successfully registered for event',
            registration,
            remainingSlots: event.availableSlots
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user's registrations
// @route   GET /api/registrations/my
// @access  Private
const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ user: req.user._id }).populate('event');
        res.status(200).json(registrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update registration status (Admin)
// @route   PUT /api/registrations/:id/status
// @access  Private/Admin
const updateRegistrationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const registrationId = req.params.id;

        if (!['attended', 'cancelled', 'registered'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const registration = await Registration.findById(registrationId).populate('event user');
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const previousStatus = registration.status;
        registration.status = status;
        await registration.save();

        // If status changed to 'attended', add to user's eventsAttended and check for badges
        if (status === 'attended' && previousStatus !== 'attended') {
            const user = await User.findById(registration.user._id);
            const event = registration.event;

            // Check if already in eventsAttended to avoid duplicates
            const alreadyAttended = user.eventsAttended.some(e => e.title === event.title && e.date.getTime() === event.date.getTime());
            
            if (!alreadyAttended) {
                user.eventsAttended.push({
                    title: event.title,
                    date: event.date,
                    location: event.location
                });
                await user.save();
                
                // Trigger badge logic
                await checkAndAwardBadges(user);
            }
        }

        res.status(200).json({
            message: `Registration marked as ${status}`,
            registration
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerForEvent,
    getMyRegistrations,
    updateRegistrationStatus
};
