const Event = require('../models/Event');

// @desc    Create a new event
// @route   POST /api/events
// @access  Public (or Private if middleware added later)
const createEvent = async (req, res) => {
    try {
        const { title, description, date, location, organizer, maxSlots } = req.body;

        if (!title || !description || !date || !location) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        const event = await Event.create({
            title,
            description,
            date,
            location,
            organizer,
            maxSlots: maxSlots || 50,
            availableSlots: maxSlots || 50
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

module.exports = {
    createEvent,
    getEvents
};
