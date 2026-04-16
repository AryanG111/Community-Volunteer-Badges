const express = require('express');
const router = express.Router();
const { getBadges, assignBadge } = require('../controllers/badgeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getBadges);
router.post('/assign', protect, admin, assignBadge);

module.exports = router;
