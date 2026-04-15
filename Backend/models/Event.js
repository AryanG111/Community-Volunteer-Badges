const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an event title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide an event description'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Please provide an event date']
    },
    location: {
        type: String,
        required: [true, 'Please provide an event location'],
        trim: true
    },
    organizer: {
        type: String,
        trim: true,
        default: 'Community'
    },
    maxSlots: {
        type: Number,
        required: [true, 'Please provide maximum slots'],
        default: 50
    },
    availableSlots: {
        type: Number,
        default: function() {
            return this.maxSlots;
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
