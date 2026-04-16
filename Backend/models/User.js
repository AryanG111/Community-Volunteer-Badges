const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6
    },
    badges: [
        {
            badge: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Badge'
            },
            name: String, // Keeping name for quick display
            earnedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    eventsAttended: {
        type: [
            {
                title: {
                    type: String,
                    required: true,
                    trim: true
                },
                date: {
                    type: Date,
                    required: true
                },
                location: {
                    type: String,
                    trim: true,
                    default: ''
                }
            }
        ],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['normal', 'admin'],
        default: 'normal'
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
