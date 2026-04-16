const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: 'badge-icon.png'
    },
    type: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'special'],
        required: true
    },
    requiredEvents: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;
