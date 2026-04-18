const express = require('express');
const router = express.Router();
const { registerForEvent, getMyRegistrations, getAllRegistrations, getRegistrationsByEvent, updateRegistrationStatus, markAttendance } = require('../controllers/registrationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, registerForEvent);
router.get('/', protect, admin, getAllRegistrations);
router.get('/my', protect, getMyRegistrations);
router.get('/event/:eventId', protect, admin, getRegistrationsByEvent);
router.put('/attend', protect, admin, markAttendance);
router.put('/:id/status', protect, admin, updateRegistrationStatus);

module.exports = router;
