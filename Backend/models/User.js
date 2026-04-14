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
    badges: {
        type: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                earnedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        default: []
    },
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
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
