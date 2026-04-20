const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventDetails } = require('../controllers/eventController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createEvent);
router.get('/', protect, getEvents);
router.get('/:id', protect, admin, getEventDetails);

module.exports = router;
