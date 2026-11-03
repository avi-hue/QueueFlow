const { Notification, User, Business, Queue, Token } = require('../db/inMemoryStore');
const { getIO } = require('../sockets');

/**
 * Send and persist a real-time notification
 */
async function sendNotification({ userId, businessId = null, tokenId = null, type = 'general', title, message, data = {} }) {
  if (!userId) return null;

  const notif = new Notification({
    userId,
    businessId,
    tokenId,
    type,
    title,
    message,
    data,
    read: false,
    createdAt: new Date().toISOString()
  });

  await notif.save();

  // Real-time socket emission
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notif.toObject());
      if (tokenId) {
        io.to(`token:${tokenId}`).emit('notification:new', notif.toObject());
      }
    }
  } catch (err) {
    // Socket might not be initialized in test runner
  }

  return notif;
}

/**
 * Get all notifications for a specific user
 */
async function getUserNotifications(userId) {
  const notifications = await Notification.find({ userId });
  const unreadCount = notifications.filter((n) => !n.read).length;
  return {
    notifications,
    unreadCount
  };
}

/**
 * Mark a single notification as read
 */
async function markNotificationAsRead(notificationId, userId) {
  const notif = await Notification.findById(notificationId);
  if (!notif) {
    throw new Error('Notification not found');
  }
  if (String(notif.userId) !== String(userId)) {
    throw new Error('Unauthorized');
  }

  notif.read = true;
  notif.readAt = new Date().toISOString();
  await notif.save();
  return notif;
}

/**
 * Mark all notifications for a user as read
 */
async function markAllNotificationsAsRead(userId) {
  const result = await Notification.updateMany({ userId, read: false }, { read: true, readAt: new Date().toISOString() });
  return result;
}

/**
 * Delete a notification
 */
async function deleteNotification(notificationId, userId) {
  const notif = await Notification.findById(notificationId);
  if (!notif) {
    throw new Error('Notification not found');
  }
  if (String(notif.userId) !== String(userId)) {
    throw new Error('Unauthorized');
  }

  await Notification.findByIdAndDelete(notificationId);
  return { success: true };
}

/**
 * Check line positions for waiting customers and trigger "turn approaching" alerts
 * when position <= approachingThreshold (default 3)
 */
async function checkAndTriggerApproachingAlerts(businessId, queueId) {
  const business = await Business.findById(businessId);
  if (!business) return;

  const threshold = business.settings?.approachingThreshold || 3;
  const waitingTokens = await Token.find({ queueId, status: 'waiting' });
  waitingTokens.sort((a, b) => a.tokenNumber - b.tokenNumber);

  for (let i = 0; i < waitingTokens.length; i++) {
    const token = waitingTokens[i];
    const position = i + 1;

    // Check if within threshold and approaching alert not yet sent
    if (position <= threshold && (!token.notifiedFlags || !token.notifiedFlags.approachingSent)) {
      if (!token.notifiedFlags) {
        token.notifiedFlags = { approachingSent: true, calledSent: false, skippedSent: false };
      } else {
        token.notifiedFlags.approachingSent = true;
      }
      await token.save();

      if (token.userId) {
        const estWait = Math.max(1, position * (business.settings?.avgServiceTimeDefault || 5));
        await sendNotification({
          userId: token.userId,
          businessId: business._id,
          tokenId: token._id,
          type: 'approaching',
          title: 'Your turn is approaching!',
          message: `You are #${position} in line at ${business.name}. Estimated wait: ~${estWait} min. Please be ready to approach the counter.`,
          data: {
            businessId: business._id,
            businessName: business.name,
            tokenId: token._id,
            tokenLabel: token.tokenLabel,
            position,
            estimatedWaitMins: estWait
          }
        });
      }
    }
  }
}

/**
 * Trigger alert when a customer is called to a counter
 */
async function notifyCustomerCalled(token, business, counterName) {
  if (!token.userId) return;

  if (!token.notifiedFlags) {
    token.notifiedFlags = { approachingSent: true, calledSent: true, skippedSent: false };
  } else {
    token.notifiedFlags.calledSent = true;
  }
  await token.save();

  await sendNotification({
    userId: token.userId,
    businessId: business._id,
    tokenId: token._id,
    type: 'called',
    title: "You've been called!",
    message: `Token ${token.tokenLabel}: Please proceed to ${counterName || 'your assigned counter'} at ${business.name} now.`,
    data: {
      businessId: business._id,
      businessName: business.name,
      tokenId: token._id,
      tokenLabel: token.tokenLabel,
      counterName: counterName || 'Counter'
    }
  });
}

/**
 * Trigger alert to all active customers when queue status changes (e.g., paused or closed)
 */
async function notifyQueueStatusChange(businessId, newStatus) {
  const business = await Business.findById(businessId);
  if (!business) return;

  const today = new Date().toISOString().split('T')[0];
  const queue = await Queue.findOne({ businessId, date: today });
  if (!queue) return;

  const activeTokens = await Token.find({
    queueId: queue._id,
    status: { $in: ['waiting', 'called'] }
  });

  const statusLabel = newStatus === 'open' ? 'resumed' : newStatus === 'paused' ? 'paused' : 'closed';
  const title = `Queue ${newStatus.toUpperCase()}`;
  const message = `The queue at ${business.name} has been ${statusLabel} by the venue staff.`;

  for (const token of activeTokens) {
    if (token.userId) {
      await sendNotification({
        userId: token.userId,
        businessId: business._id,
        tokenId: token._id,
        type: 'queue_status',
        title,
        message,
        data: {
          businessId: business._id,
          businessName: business.name,
          queueStatus: newStatus
        }
      });
    }
  }
}

/**
 * Trigger alert when customer token is skipped
 */
async function notifyCustomerSkipped(token, business) {
  if (!token.userId) return;

  await sendNotification({
    userId: token.userId,
    businessId: business._id,
    tokenId: token._id,
    type: 'skipped',
    title: 'Token Skipped',
    message: `Your token ${token.tokenLabel} at ${business.name} was marked as skipped. Please speak to staff if you are still present.`,
    data: {
      businessId: business._id,
      businessName: business.name,
      tokenId: token._id,
      tokenLabel: token.tokenLabel
    }
  });
}

/**
 * Trigger alert when customer token is completed
 */
async function notifyCustomerCompleted(token, business) {
  if (!token.userId) return;

  await sendNotification({
    userId: token.userId,
    businessId: business._id,
    tokenId: token._id,
    type: 'completed',
    title: 'Service Completed',
    message: `Your service at ${business.name} is complete. Thank you for using QueueFlow!`,
    data: {
      businessId: business._id,
      businessName: business.name,
      tokenId: token._id,
      tokenLabel: token.tokenLabel
    }
  });
}

module.exports = {
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  checkAndTriggerApproachingAlerts,
  notifyCustomerCalled,
  notifyQueueStatusChange,
  notifyCustomerSkipped,
  notifyCustomerCompleted
};
