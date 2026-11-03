const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireBusinessAccess } = require('../middleware/role');

router.use(authenticate);
router.use(requireBusinessAccess);
router.use(requireRole('owner', 'staff'));

router.get('/', analyticsController.getAnalytics);
router.patch('/status', requireRole('owner'), analyticsController.updateQueueStatusFromAnalytics);

module.exports = router;
