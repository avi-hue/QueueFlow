const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireBusinessAccess } = require('../middleware/role');

// Public route: business queue status summary
router.get('/public/:businessId', queueController.getPublicQueueStatus);

// Public route: Smart Wait-Time Prediction breakdown (Module 3)
router.get('/prediction/:businessId', queueController.getPredictionBreakdown);

// Customer endpoints (Protected)
router.use(authenticate);


router.post('/join', requireRole('customer'), queueController.joinQueue);
router.get('/my-token', requireRole('customer'), queueController.getMyToken);
router.post('/cancel/:tokenId', requireRole('customer'), queueController.cancelToken);

// Business Staff / Owner Queue Control Endpoints (Protected)
router.get('/business/queue', requireRole('staff', 'owner'), requireBusinessAccess, queueController.getBusinessQueue);
router.patch('/business/queue/status', requireRole('owner'), requireBusinessAccess, queueController.updateQueueStatus);
router.post('/business/queue/call-next', requireRole('staff', 'owner'), requireBusinessAccess, queueController.callNext);
router.post('/business/queue/start-service/:tokenId', requireRole('staff', 'owner'), requireBusinessAccess, queueController.startService);
router.post('/business/queue/complete/:tokenId', requireRole('staff', 'owner'), requireBusinessAccess, queueController.completeToken);
router.post('/business/queue/skip/:tokenId', requireRole('staff', 'owner'), requireBusinessAccess, queueController.skipToken);
router.post('/business/queue/walk-in', requireRole('staff', 'owner'), requireBusinessAccess, queueController.addWalkIn);

module.exports = router;
