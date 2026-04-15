const Registration = require('../models/Registration');
const Event = require('../models/Event');

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

module.exports = {
    registerForEvent,
    getMyRegistrations
};
