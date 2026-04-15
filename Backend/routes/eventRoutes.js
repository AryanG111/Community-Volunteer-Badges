const express = require('express');
const router = express.Router();
const { createEvent, getEvents } = require('../controllers/eventController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createEvent);
router.get('/', protect, getEvents);

module.exports = router;
