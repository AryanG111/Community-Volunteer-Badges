const express = require('express');
const router = express.Router();
const { registerForEvent, getMyRegistrations, getAllRegistrations, updateRegistrationStatus } = require('../controllers/registrationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, registerForEvent);
router.get('/', protect, admin, getAllRegistrations);
router.get('/my', protect, getMyRegistrations);
router.put('/:id/status', protect, admin, updateRegistrationStatus);

module.exports = router;
