const analyticsService = require('../services/analyticsService');
const queueService = require('../services/queueService');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

/**
 * Get full business analytics dashboard metrics
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  if (!businessId) {
    throw new ApiError(400, 'User is not associated with any business');
  }

  const timeframe = req.query.timeframe || 'today';
  const analytics = await analyticsService.getBusinessAnalytics(businessId, timeframe);

  res.status(200).json({
    success: true,
    data: analytics
  });
});

/**
 * Quick queue management from analytics dashboard (status update)
 */
const updateQueueStatusFromAnalytics = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  const { status } = req.body;
  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  const queue = await queueService.updateQueueStatus(businessId, status);
  res.status(200).json({
    success: true,
    message: `Queue status updated to ${status}`,
    data: { queue }
  });
});

module.exports = {
  getAnalytics,
  updateQueueStatusFromAnalytics
};
