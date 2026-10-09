const Queue = require('../models/Queue');
const Token = require('../models/Token');
const Business = require('../models/Business');

/**
 * Get or initialize today's queue for a given business
 */
async function getOrCreateTodaysQueue(businessId) {
  const today = new Date().toISOString().split('T')[0];
  let queue = await Queue.findOne({ businessId, date: today });
  
  if (!queue) {
    queue = new Queue({
      businessId,
      date: today,
      status: 'open',
      tokenSeq: 0,
      nowServing: []
    });
    await queue.save();
  }
  return queue;
}

/**
 * Join a business queue as a remote customer
 */
async function joinQueue(businessId, userId) {
  const business = await Business.findById(businessId);
  if (!business || !business.isActive) {
    throw new Error('Business not found or inactive');
  }

  if (business.settings && business.settings.allowRemoteJoin === false) {
    throw new Error('Remote queue joining is disabled for this business');
  }

  const queue = await getOrCreateTodaysQueue(businessId);
  if (queue.status !== 'open') {
    throw new Error(`Queue is currently ${queue.status}. New entries are not being accepted.`);
  }

  // Check if user already has an active token in any business
  const existingActiveToken = await Token.findOne({
    userId,
    status: { $in: ['waiting', 'called', 'serving'] }
  });
  if (existingActiveToken) {
    throw new Error('You already have an active queue token');
  }

  // Check queue capacity limit
  const activeCount = await Token.countDocuments({
    queueId: queue._id,
    status: { $in: ['waiting', 'called', 'serving'] }
  });

  if (business.settings && business.settings.maxQueueSize > 0 && activeCount >= business.settings.maxQueueSize) {
    throw new Error('Queue has reached its maximum capacity for today');
  }

  // Increment token sequence
  queue.tokenSeq += 1;
  await queue.save();

  const tokenNumber = queue.tokenSeq;
  const paddedNumber = String(tokenNumber).padStart(3, '0');
  const prefix = business.name.charAt(0).toUpperCase() || 'A';
  const tokenLabel = `${prefix}-${paddedNumber}`;

  // Estimate initial wait time
  const waitingAhead = await Token.countDocuments({ queueId: queue._id, status: 'waiting' });
  const avgServiceTime = business.settings?.avgServiceTimeDefault || 5;
  const estimatedWaitAtJoin = waitingAhead * avgServiceTime;

  const newToken = new Token({
    queueId: queue._id,
    businessId,
    userId,
    tokenNumber,
    tokenLabel,
    status: 'waiting',
    joinedAt: new Date().toISOString(),
    estimatedWaitAtJoin,
    source: 'remote'
  });

  await newToken.save();
  return newToken;
}

/**
 * Add a walk-in customer token by staff
 */
async function addWalkIn(businessId, walkInName, counterId = null) {
  const business = await Business.findById(businessId);
  if (!business || !business.isActive) {
    throw new Error('Business not found or inactive');
  }

  const queue = await getOrCreateTodaysQueue(businessId);
  if (queue.status === 'closed') {
    throw new Error('Queue is currently closed');
  }

  queue.tokenSeq += 1;
  await queue.save();

  const tokenNumber = queue.tokenSeq;
  const paddedNumber = String(tokenNumber).padStart(3, '0');
  const prefix = business.name.charAt(0).toUpperCase() || 'A';
  const tokenLabel = `${prefix}-${paddedNumber}`;

  const waitingAhead = await Token.countDocuments({ queueId: queue._id, status: 'waiting' });
  const avgServiceTime = business.settings?.avgServiceTimeDefault || 5;
  const estimatedWaitAtJoin = waitingAhead * avgServiceTime;

  const newToken = new Token({
    queueId: queue._id,
    businessId,
    userId: null,
    walkInName: walkInName || 'Walk-in Guest',
    tokenNumber,
    tokenLabel,
    status: 'waiting',
    counterId: counterId || null,
    joinedAt: new Date().toISOString(),
    estimatedWaitAtJoin,
    source: 'walk_in'
  });

  await newToken.save();
  return newToken;
}

/**
 * Call the next waiting customer to a service counter
 */
async function callNext(businessId, counterId, staffId = null) {
  const queue = await getOrCreateTodaysQueue(businessId);
  if (queue.status === 'closed') {
    throw new Error('Cannot call customers when queue is closed');
  }

  // Find lowest token number in waiting status
  const waitingTokens = await Token.find({ queueId: queue._id, status: 'waiting' });
  if (!waitingTokens || waitingTokens.length === 0) {
    throw new Error('No customers currently waiting in queue');
  }

  // Pick earliest waiting token
  waitingTokens.sort((a, b) => a.tokenNumber - b.tokenNumber);
  const nextToken = waitingTokens[0];

  nextToken.status = 'called';
  nextToken.calledAt = new Date().toISOString();
  nextToken.counterId = counterId;
  await nextToken.save();

  // Update nowServing array in Queue
  const idx = queue.nowServing.findIndex((ns) => String(ns.counterId) === String(counterId));
  if (idx >= 0) {
    queue.nowServing[idx].tokenId = nextToken._id;
  } else {
    queue.nowServing.push({ counterId, tokenId: nextToken._id });
  }
  await queue.save();

  return nextToken;
}

/**
 * Start service for a called token
 */
async function startService(tokenId) {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new Error('Token not found');
  }

  if (token.status !== 'called') {
    throw new Error(`Cannot start service for token in status: ${token.status}`);
  }

  token.status = 'serving';
  token.serviceStartedAt = new Date().toISOString();
  await token.save();
  return token;
}

/**
 * Complete service for a token
 */
async function completeToken(tokenId) {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new Error('Token not found');
  }

  if (!['called', 'serving'].includes(token.status)) {
    throw new Error(`Cannot complete token in status: ${token.status}`);
  }

  token.status = 'completed';
  token.completedAt = new Date().toISOString();
  await token.save();

  // Remove from queue nowServing
  const queue = await Queue.findById(token.queueId);
  if (queue) {
    queue.nowServing = queue.nowServing.filter((ns) => String(ns.tokenId) !== String(token._id));
    await queue.save();
  }

  return token;
}

/**
 * Skip a token (mark as skipped / no-show)
 */
async function skipToken(tokenId) {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new Error('Token not found');
  }

  token.status = 'skipped';
  await token.save();

  const queue = await Queue.findById(token.queueId);
  if (queue) {
    queue.nowServing = queue.nowServing.filter((ns) => String(ns.tokenId) !== String(token._id));
    await queue.save();
  }

  return token;
}

/**
 * Cancel a customer token
 */
async function cancelToken(tokenId, userId = null) {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new Error('Token not found');
  }

  if (userId && String(token.userId) !== String(userId)) {
    throw new Error('Unauthorized to cancel this token');
  }

  if (['completed', 'cancelled'].includes(token.status)) {
    throw new Error(`Token is already ${token.status}`);
  }

  token.status = 'cancelled';
  await token.save();

  const queue = await Queue.findById(token.queueId);
  if (queue) {
    queue.nowServing = queue.nowServing.filter((ns) => String(ns.tokenId) !== String(token._id));
    await queue.save();
  }

  return token;
}

/**
 * Update queue status (open, paused, closed)
 */
async function updateQueueStatus(businessId, status) {
  if (!['open', 'paused', 'closed'].includes(status)) {
    throw new Error('Invalid queue status value');
  }

  const queue = await getOrCreateTodaysQueue(businessId);
  queue.status = status;
  await queue.save();
  return queue;
}

/**
 * Get full queue state for a business dashboard / public snapshot
 */
async function getQueueState(businessId) {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error('Business not found');
  }

  const queue = await getOrCreateTodaysQueue(businessId);
  const allTokens = await Token.find({ queueId: queue._id });

  const waitingTokens = allTokens.filter((t) => t.status === 'waiting');
  const calledTokens = allTokens.filter((t) => t.status === 'called');
  const servingTokens = allTokens.filter((t) => t.status === 'serving');
  const completedTokens = allTokens.filter((t) => t.status === 'completed');

  const avgServiceTime = business.settings?.avgServiceTimeDefault || 5;
  const estimatedWaitMins = waitingTokens.length * avgServiceTime;

  return {
    businessId: business._id,
    businessName: business.name,
    queueId: queue._id,
    status: queue.status,
    tokenSeq: queue.tokenSeq,
    nowServing: queue.nowServing,
    stats: {
      totalWaiting: waitingTokens.length,
      totalCalled: calledTokens.length,
      totalServing: servingTokens.length,
      totalCompleted: completedTokens.length,
      estimatedWaitMins
    },
    waitingTokens,
    calledTokens,
    servingTokens,
    recentCompletedTokens: completedTokens.slice(-10)
  };
}

/**
 * Get active token for a customer along with line position
 */
async function getUserActiveToken(userId) {
  const token = await Token.findOne({
    userId,
    status: { $in: ['waiting', 'called', 'serving'] }
  });

  if (!token) return null;

  const business = await Business.findById(token.businessId);
  const queue = await Queue.findById(token.queueId);

  // Calculate position ahead in line
  let position = 0;
  if (token.status === 'waiting') {
    const waitingList = await Token.find({ queueId: token.queueId, status: 'waiting' });
    position = waitingList.filter((t) => t.tokenNumber < token.tokenNumber).length + 1;
  }

  const avgServiceTime = business?.settings?.avgServiceTimeDefault || 5;
  const estimatedWaitMins = Math.max(0, (position - 1) * avgServiceTime);

  // Find assigned counter details if called or serving
  let counterName = null;
  if (token.counterId && business) {
    const counterObj = business.counters.find((c) => String(c._id) === String(token.counterId));
    if (counterObj) counterName = counterObj.name;
  }

  return {
    ...token.toObject(),
    businessName: business?.name || 'Business',
    queueStatus: queue?.status || 'open',
    position,
    estimatedWaitMins,
    counterName
  };
}

module.exports = {
  getOrCreateTodaysQueue,
  joinQueue,
  addWalkIn,
  callNext,
  startService,
  completeToken,
  skipToken,
  cancelToken,
  updateQueueStatus,
  getQueueState,
  getUserActiveToken
};
