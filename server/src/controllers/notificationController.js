const notificationService = require('../services/notificationService');
const { asyncHandler } = require('../utils/asyncHandler');

const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user._id);
  res.status(200).json({
    success: true,
    data: result
  });
});

const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.markNotificationAsRead(id, req.user._id);
  res.status(200).json({
    success: true,
    data: { notification }
  });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(req.user._id);
  res.status(200).json({
    success: true,
    data: result
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await notificationService.deleteNotification(id, req.user._id);
  res.status(200).json({
    success: true,
    data: result
  });
});

module.exports = {
  getMyNotifications,
  markRead,
  markAllRead,
  deleteNotification
};
