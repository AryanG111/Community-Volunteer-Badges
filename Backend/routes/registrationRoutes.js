const express = require('express');
const router = express.Router();
const { registerForEvent, getMyRegistrations } = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, registerForEvent);
router.get('/my', protect, getMyRegistrations);

module.exports = router;
