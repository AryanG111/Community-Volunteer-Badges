const Event = require('../models/Event');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
    try {
        const { title, description, date, location, organizer, maxSlots } = req.body;

        if (!title || !description || !date || !location || !maxSlots) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        const eventDate = new Date(date);
        if (Number.isNaN(eventDate.getTime())) {
            return res.status(400).json({ message: 'Please provide a valid date' });
        }

        const startOfDay = new Date(eventDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(eventDate);
        endOfDay.setHours(23, 59, 59, 999);

        const duplicateEvent = await Event.findOne({
            location: location.trim(),
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (duplicateEvent) {
            return res.status(409).json({ message: 'An event already exists at the same date and location' });
        }

        const slots = Number(maxSlots) || 50;

        const event = await Event.create({
            title: title.trim(),
            description: description.trim(),
            date: eventDate,
            location: location.trim(),
            organizer: organizer?.trim() || 'Community',
            maxSlots: slots,
            availableSlots: slots
        });

        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get event details (Admin)
// @route   GET /api/events/:id
// @access  Private/Admin
const getEventDetails = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const Registration = require('../models/Registration'); // Import Registration here to avoid cyclic dependency if any, but it's cleaner to have it at top if possible.
        const registrations = await Registration.find({ event: eventId })
            .populate('user', 'name email phone');

        res.status(200).json({
            event,
            registrations,
            joinedCount: registrations.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createEvent,
    getEvents,
    getEventDetails
};
