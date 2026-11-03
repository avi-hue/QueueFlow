const Queue = require('../models/Queue');
const Token = require('../models/Token');
const Business = require('../models/Business');
const User = require('../models/User');
const HourlyStat = require('../models/HourlyStat');
const { getIO } = require('../sockets');
const notificationService = require('./notificationService');

async function emitUpdates(businessId, token) {
  try {
    const io = getIO();
    if (io) {
      if (businessId) {
        io.to(`business:${businessId}`).emit('queue:updated');
        io.emit('queue:updated'); // Global queue sync
        io.emit('public:queue:updated'); // Global emit for Discover page sync
      }
      if (token) {
        io.to(`token:${token._id}`).emit('token:updated');
        if (token.userId) {
          io.to(`user:${token.userId}`).emit('token:updated');
          io.to(`user:${token.userId}`).emit('queue:updated');
        }
      }

      // Proactively notify all active customers in this queue so line position & token queue update live
      if (businessId) {
        try {
          const activeTokens = await Token.find({
            businessId,
            status: { $in: ['waiting', 'called', 'serving'] }
          });
          for (const t of activeTokens) {
            if (t.userId) {
              io.to(`user:${t.userId}`).emit('token:updated');
              io.to(`user:${t.userId}`).emit('queue:updated');
            }
            io.to(`token:${t._id}`).emit('token:updated');
          }
        } catch (innerErr) {
          // ignore
        }
      }
    }
  } catch (error) {
    console.error('Socket emission error:', error);
  }
}

async function enrichToken(token, business = null) {
  if (!token) return null;
  const raw = typeof token.toObject === 'function' ? token.toObject() : { ...token };

  let customerName = raw.walkInName;
  let customerPhone = '';
  let customerEmail = '';

  if (raw.userId) {
    try {
      const user = await User.findById(raw.userId);
      if (user) {
        customerName = user.name;
        customerPhone = user.phone || '';
        customerEmail = user.email || '';
      }
    } catch (err) {
      // ignore
    }
  }

  raw.customerName = customerName || 'Guest Customer';
  raw.customerPhone = customerPhone;
  raw.customerEmail = customerEmail;

  if (raw.counterId) {
    if (!business && raw.businessId) {
      business = await Business.findById(raw.businessId);
    }
    const counterObj = business?.counters?.find((c) => String(c._id) === String(raw.counterId));
    raw.counterName = counterObj ? counterObj.name : 'Counter';
  } else {
    raw.counterName = null;
  }

  return raw;
}

/**
 * Smart Wait-Time Prediction Engine (Module 3)
 * Calculates accurate dynamic waiting times by combining:
 * 1. Current Queue Data: position ahead, active service counters concurrency, live session service durations.
 * 2. Historical Service Patterns: hourly statistics across days of week and times of day.
 */
async function predictWaitTime(business, queue, waitingAheadCount) {
  const defaultAvg = business?.settings?.avgServiceTimeDefault || 5;
  const now = new Date();
  const currentHour = now.getHours();
  const currentDayOfWeek = now.getDay();

  // 1. Current Queue Concurrency (Active Service Counters)
  const activeCounters = (business?.counters || []).filter((c) => c.isActive).length;
  const effectiveCounters = Math.max(1, activeCounters);

  // 2. Current Session Completed Tokens (Live Rolling Service Time)
  const completedTokens = await Token.find({ queueId: queue._id, status: 'completed' });
  let liveTotalMinutes = 0;
  let liveSampleCount = 0;

  for (const token of completedTokens) {
    const start = token.serviceStartedAt || token.calledAt;
    const end = token.completedAt;
    if (start && end) {
      const diffMs = new Date(end) - new Date(start);
      const diffMins = diffMs / (1000 * 60);
      if (diffMins > 0.1 && diffMins < 180) {
        liveTotalMinutes += diffMins;
        liveSampleCount++;
      }
    }
  }

  const liveAvgServiceTime = liveSampleCount > 0 ? liveTotalMinutes / liveSampleCount : null;

  // 3. Historical Service Patterns Lookup (Time of day / Day of week)
  const hourlyMatch = await HourlyStat.find({
    businessId: business._id,
    hour: currentHour
  });

  let historicalAvgServiceTime = defaultAvg;
  let historicalSampleCount = 0;

  if (hourlyMatch && hourlyMatch.length > 0) {
    const dayMatches = hourlyMatch.filter((h) => h.dayOfWeek === currentDayOfWeek && h.avgServiceMin > 0);
    const targetSet = dayMatches.length > 0 ? dayMatches : hourlyMatch.filter((h) => h.avgServiceMin > 0);
    
    if (targetSet.length > 0) {
      const sum = targetSet.reduce((acc, h) => acc + h.avgServiceMin, 0);
      historicalAvgServiceTime = sum / targetSet.length;
      historicalSampleCount = targetSet.length;
    }
  }

  // 4. Dynamic Hybrid Blending
  let blendedAvgServiceTime = defaultAvg;
  let confidence = 'baseline';
  let liveWeight = 0;

  if (liveSampleCount > 0) {
    // Dynamic weight increases with live sample count: 1 sample -> 40%, 2 -> 50%, 5+ -> 80%
    liveWeight = Math.min(0.85, 0.3 + liveSampleCount * 0.1);
    blendedAvgServiceTime = (1 - liveWeight) * historicalAvgServiceTime + liveWeight * liveAvgServiceTime;
    confidence = liveSampleCount >= 3 ? 'high' : 'medium';
  } else if (historicalSampleCount > 0) {
    blendedAvgServiceTime = historicalAvgServiceTime;
    confidence = 'historical';
  } else {
    blendedAvgServiceTime = defaultAvg;
    confidence = 'baseline';
  }

  blendedAvgServiceTime = Math.max(1, Number(blendedAvgServiceTime.toFixed(1)));

  // 5. Multi-Server Concurrency Estimation (M/M/c Queueing model)
  // Wait Time = (people ahead * blended avg service time) / active counters
  let estimatedWaitMins = 0;
  if (waitingAheadCount > 0) {
    const rawWait = (waitingAheadCount * blendedAvgServiceTime) / effectiveCounters;
    estimatedWaitMins = Math.max(1, Math.round(rawWait));
  }

  return {
    estimatedWaitMins,
    confidence, // 'high' | 'medium' | 'historical' | 'baseline'
    waitingAhead: waitingAheadCount,
    activeCounters: effectiveCounters,
    blendedAvgServiceTime,
    liveAvgServiceTime: liveAvgServiceTime ? Number(liveAvgServiceTime.toFixed(1)) : null,
    historicalAvgServiceTime: Number(historicalAvgServiceTime.toFixed(1)),
    liveSampleCount,
    historicalSampleCount,
    liveWeightPercent: Number((liveWeight * 100).toFixed(0)),
    currentHour,
    dayOfWeek: currentDayOfWeek,
    algorithm: 'hybrid_dynamic_m_m_c'
  };
}

/**
 * Backward-compatible helper for average service time
 */
async function getDynamicAvgServiceTime(business, queue) {
  const prediction = await predictWaitTime(business, queue, 1);
  return prediction.blendedAvgServiceTime;
}

/**
 * Detailed business wait time prediction & historical breakdown
 */
async function getBusinessPrediction(businessId) {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error('Business not found');
  }

  const queue = await getOrCreateTodaysQueue(businessId);
  const waitingTokens = await Token.find({ queueId: queue._id, status: 'waiting' });
  const prediction = await predictWaitTime(business, queue, waitingTokens.length);

  // Retrieve today's day-of-week historical pattern across operating hours
  const historicalStats = await HourlyStat.find({
    businessId: business._id,
    dayOfWeek: prediction.dayOfWeek
  });

  const hourlyPattern = historicalStats
    .map((s) => ({
      hour: s.hour,
      avgServiceMin: s.avgServiceMin,
      avgWaitMin: s.avgWaitMin,
      served: s.served
    }))
    .sort((a, b) => a.hour - b.hour);

  return {
    businessId: business._id,
    businessName: business.name,
    queueStatus: queue.status,
    totalWaiting: waitingTokens.length,
    activeCounters: prediction.activeCounters,
    prediction,
    hourlyPattern
  };
}


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

  // Estimate initial wait time using Smart Wait-Time Prediction (Module 3)
  const waitingAhead = await Token.countDocuments({ queueId: queue._id, status: 'waiting' });
  const prediction = await predictWaitTime(business, queue, waitingAhead);
  const estimatedWaitAtJoin = prediction.estimatedWaitMins;

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
  try {
    await notificationService.checkAndTriggerApproachingAlerts(businessId, queue._id);
  } catch (notifErr) {
    console.error('Notification error on joinQueue:', notifErr);
  }
  emitUpdates(businessId, newToken);
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
  const prediction = await predictWaitTime(business, queue, waitingAhead);
  const estimatedWaitAtJoin = prediction.estimatedWaitMins;

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
  try {
    await notificationService.checkAndTriggerApproachingAlerts(businessId, queue._id);
  } catch (notifErr) {
    console.error('Notification error on joinQueue:', notifErr);
  }
  emitUpdates(businessId, newToken);
  return newToken;
}

/**
 * Call the next waiting customer to a service counter in strict FIFO order.
 * If counterId is omitted or 'auto', automatically dispatches to the first available empty counter.
 */
async function callNext(businessId, counterId = null, staffId = null) {
  const queue = await getOrCreateTodaysQueue(businessId);
  if (queue.status === 'closed') {
    throw new Error('Cannot call customers when queue is closed');
  }

  // Find lowest token number in waiting status (strict FIFO)
  const waitingTokens = await Token.find({ queueId: queue._id, status: 'waiting' });
  if (!waitingTokens || waitingTokens.length === 0) {
    throw new Error('No customers currently waiting in queue');
  }

  // Pick earliest waiting token in strict FIFO order
  waitingTokens.sort((a, b) => a.tokenNumber - b.tokenNumber);
  const nextToken = waitingTokens[0];

  const business = await Business.findById(businessId);
  const activeCounters = (business?.counters || []).filter((c) => c.isActive);

  // If no counter specified or 'auto', find the first active counter that is currently empty (not serving any called/serving token)
  let targetCounterId = counterId;
  if (!targetCounterId || targetCounterId === 'auto') {
    const activeTokens = await Token.find({
      queueId: queue._id,
      status: { $in: ['called', 'serving'] }
    });
    const busyCounterIds = new Set(
      activeTokens.map((t) => String(t.counterId)).filter(Boolean)
    );
    const emptyCounter = activeCounters.find((c) => !busyCounterIds.has(String(c._id)));

    if (emptyCounter) {
      targetCounterId = emptyCounter._id;
    } else if (activeCounters.length > 0) {
      targetCounterId = activeCounters[0]._id;
    }
  }

  nextToken.status = 'called';
  nextToken.calledAt = new Date().toISOString();
  nextToken.counterId = targetCounterId || null;
  await nextToken.save();

  // Update nowServing array in Queue
  if (targetCounterId) {
    const idx = queue.nowServing.findIndex((ns) => String(ns.counterId) === String(targetCounterId));
    if (idx >= 0) {
      queue.nowServing[idx].tokenId = nextToken._id;
    } else {
      queue.nowServing.push({ counterId: targetCounterId, tokenId: nextToken._id });
    }
    await queue.save();
  }

  try {
    const counterObj = business?.counters?.find((c) => String(c._id) === String(targetCounterId));
    const counterName = counterObj ? counterObj.name : 'Counter';
    await notificationService.notifyCustomerCalled(nextToken, business, counterName);
    await notificationService.checkAndTriggerApproachingAlerts(businessId, queue._id);
  } catch (notifErr) {
    console.error('Notification error on callNext:', notifErr);
  }

  emitUpdates(businessId, nextToken);
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
  emitUpdates(token.businessId, token);
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

  // Record service duration & update HourlyStat historical patterns (Module 3)
  try {
    const start = token.serviceStartedAt || token.calledAt;
    const end = token.completedAt;
    let durationMin = 0;
    if (start && end) {
      durationMin = Math.max(0.5, (new Date(end) - new Date(start)) / 60000);
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    let stat = await HourlyStat.findOne({
      businessId: token.businessId,
      date: todayStr,
      hour: currentHour
    });

    if (!stat) {
      stat = new HourlyStat({
        businessId: token.businessId,
        date: todayStr,
        dayOfWeek: currentDay,
        hour: currentHour,
        arrivals: 1,
        served: 1,
        avgServiceMin: durationMin > 0 ? Number(durationMin.toFixed(1)) : 5,
        activeCounters: 1
      });
    } else {
      const prevServed = stat.served || 0;
      const prevAvg = stat.avgServiceMin || 5;
      const newServed = prevServed + 1;
      const newAvg = durationMin > 0 ? (prevAvg * prevServed + durationMin) / newServed : prevAvg;
      stat.served = newServed;
      stat.avgServiceMin = Number(newAvg.toFixed(1));
    }
    await stat.save();
  } catch (statErr) {
    console.error('Failed to update HourlyStat on token completion:', statErr);
  }

  // Remove from queue nowServing
  const queue = await Queue.findById(token.queueId);
  if (queue) {
    queue.nowServing = queue.nowServing.filter((ns) => String(ns.tokenId) !== String(token._id));
    await queue.save();
  }

  try {
    const business = await Business.findById(token.businessId);
    if (business) {
      await notificationService.notifyCustomerCompleted(token, business);
    }
    await notificationService.checkAndTriggerApproachingAlerts(token.businessId, token.queueId);
  } catch (notifErr) {
    console.error('Notification error on completeToken:', notifErr);
  }

  emitUpdates(token.businessId, token);
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

  try {
    const business = await Business.findById(token.businessId);
    if (business) {
      await notificationService.notifyCustomerSkipped(token, business);
    }
    await notificationService.checkAndTriggerApproachingAlerts(token.businessId, token.queueId);
  } catch (notifErr) {
    console.error('Notification error on skipToken:', notifErr);
  }

  emitUpdates(token.businessId, token);
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

  try {
    await notificationService.checkAndTriggerApproachingAlerts(token.businessId, token.queueId);
  } catch (notifErr) {
    console.error('Notification error on cancelToken:', notifErr);
  }

  emitUpdates(token.businessId, token);
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

  try {
    await notificationService.notifyQueueStatusChange(businessId, status);
  } catch (notifErr) {
    console.error('Notification error on updateQueueStatus:', notifErr);
  }

  emitUpdates(businessId, null);
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

  // Enrich every token with customerName and counterName for owner and staff sync
  const enrichedTokens = await Promise.all(allTokens.map((t) => enrichToken(t, business)));

  const waitingTokens = enrichedTokens.filter((t) => t.status === 'waiting');
  // Sort waiting list in strict FIFO order (lowest token number first)
  waitingTokens.sort((a, b) => a.tokenNumber - b.tokenNumber);

  const calledTokens = enrichedTokens.filter((t) => t.status === 'called');
  const servingTokens = enrichedTokens.filter((t) => t.status === 'serving');
  const completedTokens = enrichedTokens.filter((t) => t.status === 'completed');

  // Compute live counter availability & occupancy (which counters are empty vs serving)
  const activeServingList = [...calledTokens, ...servingTokens];
  const liveCounters = (business.counters || []).map((c) => {
    const activeToken = activeServingList.find(
      (t) => String(t.counterId) === String(c._id)
    );
    const completedCount = completedTokens.filter(
      (t) => String(t.counterId) === String(c._id)
    ).length;

    return {
      _id: c._id,
      name: c.name,
      isActive: Boolean(c.isActive),
      staffId: c.staffId || null,
      isOccupied: Boolean(activeToken),
      status: !c.isActive ? 'offline' : (activeToken ? 'busy' : 'available'),
      currentToken: activeToken || null,
      tokensServedToday: completedCount
    };
  });

  const prediction = await predictWaitTime(business, queue, waitingTokens.length);
  const estimatedWaitMins = prediction.estimatedWaitMins;

  return {
    businessId: business._id,
    businessName: business.name,
    queueId: queue._id,
    status: queue.status,
    tokenSeq: queue.tokenSeq,
    nowServing: queue.nowServing,
    counters: liveCounters,
    stats: {
      totalWaiting: waitingTokens.length,
      totalCalled: calledTokens.length,
      totalServing: servingTokens.length,
      totalCompleted: completedTokens.length,
      activeCountersCount: liveCounters.filter((c) => c.isActive).length,
      emptyCountersCount: liveCounters.filter((c) => c.status === 'available').length,
      busyCountersCount: liveCounters.filter((c) => c.status === 'busy').length,
      estimatedWaitMins,
      prediction
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

  const waitingAhead = Math.max(0, position - 1);
  const prediction = await predictWaitTime(business, queue, waitingAhead);
  const estimatedWaitMins = prediction.estimatedWaitMins;

  // Find assigned counter details if called or serving
  let counterName = null;
  if (token.counterId && business) {
    const counterObj = business.counters?.find((c) => String(c._id) === String(token.counterId));
    if (counterObj) counterName = counterObj.name;
  }

  // Also calculate current serving token number for this queue
  let currentServingNumber = null;
  let currentServingLabel = null;
  if (queue && queue.nowServing && queue.nowServing.length > 0) {
    const servingEntry = queue.nowServing[0];
    if (servingEntry && servingEntry.tokenId) {
      const curToken = await Token.findById(servingEntry.tokenId);
      if (curToken) {
        currentServingNumber = curToken.tokenNumber;
        currentServingLabel = curToken.tokenLabel;
      }
    }
  }

  const enriched = await enrichToken(token, business);

  return {
    ...enriched,
    businessName: business?.name || 'Business',
    businessCategory: business?.category || 'General',
    businessAddress: business?.address || '',
    businessPhone: business?.phone || '',
    queueStatus: queue?.status || 'open',
    position,
    estimatedWaitMins,
    prediction,
    counterName,
    currentServingNumber,
    currentServingLabel
  };
}

/**
 * Get completed shop visit history for a customer
 * (Only tokens that were called and completed)
 */
async function getCustomerHistory(userId) {
  const completedTokens = await Token.find({
    userId,
    status: 'completed'
  });

  const history = [];
  for (const token of completedTokens) {
    const business = await Business.findById(token.businessId);
    let counterName = 'Counter';
    if (token.counterId && business) {
      const counterObj = business.counters?.find((c) => String(c._id) === String(token.counterId));
      if (counterObj) counterName = counterObj.name;
    }

    let durationMinutes = 0;
    const start = token.serviceStartedAt || token.calledAt;
    const end = token.completedAt;
    if (start && end) {
      durationMinutes = Math.max(1, Math.round((new Date(end) - new Date(start)) / 60000));
    }

    let waitMinutes = 0;
    if (token.joinedAt && (token.calledAt || token.completedAt)) {
      waitMinutes = Math.max(1, Math.round((new Date(token.calledAt || token.completedAt) - new Date(token.joinedAt)) / 60000));
    }

    history.push({
      _id: token._id,
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      tokenLabel: token.tokenLabel,
      businessId: business?._id || token.businessId,
      businessName: business?.name || 'Unknown Venue',
      category: business?.category || 'Services',
      address: business?.address || '',
      phone: business?.phone || '',
      counterName,
      source: token.source,
      joinedAt: token.joinedAt,
      calledAt: token.calledAt,
      serviceStartedAt: token.serviceStartedAt,
      completedAt: token.completedAt,
      durationMinutes,
      waitMinutes,
      status: 'completed'
    });
  }

  history.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
  return history;
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
  getUserActiveToken,
  getCustomerHistory,
  enrichToken,
  predictWaitTime,
  getBusinessPrediction,
  getDynamicAvgServiceTime
};

