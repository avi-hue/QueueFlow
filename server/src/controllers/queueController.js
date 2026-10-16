const queueService = require('../services/queueService');

/**
 * Customer: Join business queue
 */
async function joinQueue(req, res, next) {
  try {
    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ status: 'fail', message: 'businessId is required' });
    }

    const token = await queueService.joinQueue(businessId, req.user._id);
    res.status(201).json({
      status: 'success',
      data: { token }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

/**
 * Customer: Get active ticket & line position
 */
async function getMyToken(req, res, next) {
  try {
    const tokenInfo = await queueService.getUserActiveToken(req.user._id);
    res.status(200).json({
      status: 'success',
      data: { token: tokenInfo }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Customer: Cancel active token
 */
async function cancelToken(req, res, next) {
  try {
    const { tokenId } = req.params;
    const token = await queueService.cancelToken(tokenId, req.user._id);
    res.status(200).json({
      status: 'success',
      message: 'Token cancelled successfully',
      data: { token }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

/**
 * Public: Get queue status snapshot for a business
 */
async function getPublicQueueStatus(req, res, next) {
  try {
    const { businessId } = req.params;
    const state = await queueService.getQueueState(businessId);
    res.status(200).json({
      status: 'success',
      data: {
        businessId: state.businessId,
        businessName: state.businessName,
        status: state.status,
        totalWaiting: state.stats.totalWaiting,
        estimatedWaitMins: state.stats.estimatedWaitMins
      }
    });
  } catch (err) {
    res.status(404).json({ status: 'fail', message: err.message });
  }
}

/**
 * Public: Get detailed Smart Wait-Time Prediction breakdown for a business (Module 3)
 */
async function getPredictionBreakdown(req, res, next) {
  try {
    const { businessId } = req.params;
    const predictionData = await queueService.getBusinessPrediction(businessId);
    res.status(200).json({
      status: 'success',
      data: predictionData
    });
  } catch (err) {
    res.status(404).json({ status: 'fail', message: err.message });
  }
}


/**
 * Staff / Owner: Get full queue view for business dashboard
 */
async function getBusinessQueue(req, res, next) {
  try {
    const businessId = req.user.businessId;
    if (!businessId) {
      return res.status(400).json({ status: 'fail', message: 'User is not associated with any business' });
    }

    const state = await queueService.getQueueState(businessId);
    res.status(200).json({
      status: 'success',
      data: { queue: state }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Owner: Toggle queue status (open, paused, closed)
 */
async function updateQueueStatus(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ status: 'fail', message: 'Status is required' });
    }

    const queue = await queueService.updateQueueStatus(businessId, status);
    res.status(200).json({
      status: 'success',
      message: `Queue status updated to ${status}`,
      data: { queue }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

/**
 * Staff / Owner: Call next customer in queue
 */
async function callNext(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const { counterId } = req.body;
    if (!counterId) {
      return res.status(400).json({ status: 'fail', message: 'counterId is required' });
    }

    const token = await queueService.callNext(businessId, counterId, req.user._id);
    res.status(200).json({
      status: 'success',
      message: `Called token ${token.tokenLabel}`,
      data: { token }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

/**
 * Staff / Owner: Start service for called token
 */
async function startService(req, res, next) {
  try {
    const { tokenId } = req.params;
    const token = await queueService.startService(tokenId);
    res.status(200).json({
      status: 'success',
      message: `Service started for token ${token.tokenLabel}`,
      data: { token }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

/**
 * Staff / Owner: Complete token service
 */
async function completeToken(req, res, next) {
  try {
    const { tokenId } = req.params;
    const token = await queueService.completeToken(tokenId);
    res.status(200).json({
      status: 'success',
      message: `Completed service for token ${token.tokenLabel}`,
      data: { token }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

/**
 * Staff / Owner: Skip token
 */
async function skipToken(req, res, next) {
  try {
    const { tokenId } = req.params;
    const token = await queueService.skipToken(tokenId);
    res.status(200).json({
      status: 'success',
      message: `Skipped token ${token.tokenLabel}`,
      data: { token }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

/**
 * Staff / Owner: Add walk-in customer
 */
async function addWalkIn(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const { walkInName, counterId } = req.body;

    const token = await queueService.addWalkIn(businessId, walkInName, counterId);
    res.status(201).json({
      status: 'success',
      message: `Created walk-in token ${token.tokenLabel}`,
      data: { token }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

module.exports = {
  joinQueue,
  getMyToken,
  cancelToken,
  getPublicQueueStatus,
  getPredictionBreakdown,
  getBusinessQueue,
  updateQueueStatus,
  callNext,
  startService,
  completeToken,
  skipToken,
  addWalkIn
};

