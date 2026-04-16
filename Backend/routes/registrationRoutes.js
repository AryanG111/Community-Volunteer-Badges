const express = require('express');
const router = express.Router();
const { registerForEvent, getMyRegistrations, updateRegistrationStatus } = require('../controllers/registrationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, registerForEvent);
router.get('/my', protect, getMyRegistrations);
router.put('/:id/status', protect, admin, updateRegistrationStatus);

module.exports = router;
