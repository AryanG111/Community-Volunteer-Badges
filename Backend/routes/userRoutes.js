const express = require('express');
const router = express.Router();
const { getProfile, getUsers } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.get('/', protect, admin, getUsers);

module.exports = router;
