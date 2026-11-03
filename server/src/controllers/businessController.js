const businessService = require('../services/businessService');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

const getProfile = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  if (!businessId) {
    throw new ApiError(400, 'User is not associated with any business');
  }

  const business = await businessService.getBusinessById(businessId);
  res.status(200).json({
    success: true,
    data: { business }
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  if (!businessId) {
    throw new ApiError(400, 'User is not associated with any business');
  }

  const business = await businessService.updateBusinessProfile(businessId, req.body);
  res.status(200).json({
    success: true,
    data: { business }
  });
});

const addCounter = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  const counter = await businessService.addCounter(businessId, req.body);
  res.status(201).json({
    success: true,
    data: { counter }
  });
});

const updateCounter = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  const counterId = req.params.id;
  const counter = await businessService.updateCounter(businessId, counterId, req.body);
  res.status(200).json({
    success: true,
    data: { counter }
  });
});

const deleteCounter = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  const counterId = req.params.id;
  const result = await businessService.deleteCounter(businessId, counterId);
  res.status(200).json({
    success: true,
    data: result
  });
});

const addStaff = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  const staff = await businessService.addStaffMember(businessId, req.body);
  res.status(201).json({
    success: true,
    data: { staff }
  });
});

const removeStaff = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  const staffId = req.params.id;
  const result = await businessService.removeStaffMember(businessId, staffId);
  res.status(200).json({
    success: true,
    data: result
  });
});

const getStaff = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  const staff = await businessService.getStaffMembers(businessId);
  res.status(200).json({
    success: true,
    data: { staff }
  });
});

const getPublicBusiness = asyncHandler(async (req, res) => {
  const business = await businessService.getBusinessById(req.params.id);
  res.status(200).json({
    success: true,
    data: { business }
  });
});


function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const rlat1 = lat1 * (Math.PI / 180);
  const rlat2 = lat2 * (Math.PI / 180);
  const difflat = rlat2 - rlat1;
  const difflon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(difflat / 2) * Math.sin(difflat / 2) +
    Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

const getAllBusinesses = asyncHandler(async (req, res) => {
  const Business = require('../models/Business');
  const queueService = require('../services/queueService');
  
  const businesses = await Business.find({});
  
  const userLat = req.query.lat ? parseFloat(req.query.lat) : 40.748817;
  const userLon = req.query.lng ? parseFloat(req.query.lng) : -73.98513;
  const categoryFilter = req.query.category && req.query.category !== 'all' ? req.query.category.toLowerCase() : null;
  const searchFilter = req.query.search ? req.query.search.toLowerCase().trim() : null;
  const maxDistance = req.query.maxDistance ? parseFloat(req.query.maxDistance) : null;
  const statusFilter = req.query.status; // 'open' or 'all'
  const sortBy = req.query.sort || 'default'; // 'wait_time', 'queue_size', 'distance', 'name'

  let businessesWithStats = await Promise.all(businesses.map(async (biz) => {
    let stats = null;
    let queueState = null;
    try {
      queueState = await queueService.getQueueState(biz._id);
      stats = queueState.stats;
    } catch (e) {
      // Queue might not exist for today yet
    }
    
    // Haversine distance in miles
    const [bizLon, bizLat] = biz.location?.coordinates || [0, 0];
    const distanceMiles = calculateHaversineDistance(userLat, userLon, bizLat, bizLon);

    const queueStatus = queueState?.status || 'open';
    const isOpen = biz.isActive && queueStatus === 'open';
    const waitingCount = stats ? stats.totalWaiting : 0;
    const estimatedWaitMins = stats ? stats.estimatedWaitMins : 0;
    const activeCounters = (biz.counters || []).filter((c) => c.isActive).length;
    const totalCounters = (biz.counters || []).length;

    return {
      ...biz.toObject(),
      stats,
      distanceMiles: String(distanceMiles),
      queueSize: waitingCount,
      estimatedWaitMins,
      queueStatus,
      isOpen,
      activeCounters,
      totalCounters,
      allowRemoteJoin: biz.settings?.allowRemoteJoin !== false
    };
  }));

  // Filtering
  if (categoryFilter) {
    businessesWithStats = businessesWithStats.filter((b) => b.category?.toLowerCase() === categoryFilter);
  }

  if (searchFilter) {
    businessesWithStats = businessesWithStats.filter((b) => {
      const nameMatch = b.name?.toLowerCase().includes(searchFilter);
      const descMatch = b.description?.toLowerCase().includes(searchFilter);
      const catMatch = b.category?.toLowerCase().includes(searchFilter);
      const addrMatch = b.address?.toLowerCase().includes(searchFilter);
      return nameMatch || descMatch || catMatch || addrMatch;
    });
  }

  if (maxDistance && !isNaN(maxDistance)) {
    businessesWithStats = businessesWithStats.filter((b) => parseFloat(b.distanceMiles) <= maxDistance);
  }

  if (statusFilter === 'open') {
    businessesWithStats = businessesWithStats.filter((b) => b.isOpen);
  }

  // Sorting
  if (sortBy === 'wait_time') {
    businessesWithStats.sort((a, b) => (a.stats?.estimatedWaitMins || 0) - (b.stats?.estimatedWaitMins || 0));
  } else if (sortBy === 'queue_size') {
    businessesWithStats.sort((a, b) => (a.stats?.totalWaiting || 0) - (b.stats?.totalWaiting || 0));
  } else if (sortBy === 'distance') {
    businessesWithStats.sort((a, b) => parseFloat(a.distanceMiles) - parseFloat(b.distanceMiles));
  } else if (sortBy === 'name') {
    businessesWithStats.sort((a, b) => a.name.localeCompare(b.name));
  }

  res.status(200).json({ success: true, data: { businesses: businessesWithStats } });
});

const compareBusinesses = asyncHandler(async (req, res) => {
  const Business = require('../models/Business');
  const queueService = require('../services/queueService');
  
  const userLat = req.query.lat ? parseFloat(req.query.lat) : 40.748817;
  const userLon = req.query.lng ? parseFloat(req.query.lng) : -73.98513;

  let ids = [];
  if (req.query.ids) {
    ids = String(req.query.ids).split(',').map((id) => id.trim()).filter(Boolean);
  }

  let businesses = [];
  if (ids.length > 0) {
    businesses = await Promise.all(ids.map((id) => Business.findById(id)));
    businesses = businesses.filter(Boolean);
  } else {
    const all = await Business.find({});
    businesses = all.slice(0, 4);
  }

  if (businesses.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        businesses: [],
        summary: null
      }
    });
  }

  const comparisonList = await Promise.all(
    businesses.map(async (biz) => {
      let stats = null;
      let queueState = null;
      try {
        queueState = await queueService.getQueueState(biz._id);
        stats = queueState.stats;
      } catch (e) {}

      const [bizLon, bizLat] = biz.location?.coordinates || [0, 0];
      const distanceMiles = calculateHaversineDistance(userLat, userLon, bizLat, bizLon);

      const waitingCount = stats ? stats.totalWaiting : 0;
      const servingCount = stats ? (stats.totalServing || 0) + (stats.totalCalled || 0) : 0;
      const estimatedWaitMins = stats ? stats.estimatedWaitMins : 0;
      const queueStatus = queueState ? queueState.status : 'open';
      const isOpen = biz.isActive && queueStatus === 'open';
      const activeCounters = (biz.counters || []).filter((c) => c.isActive).length;
      const totalCounters = (biz.counters || []).length;
      const maxQueue = biz.settings?.maxQueueSize || 50;
      const capacityRemaining = Math.max(0, maxQueue - (waitingCount + servingCount));

      return {
        _id: biz._id,
        name: biz.name,
        category: biz.category || 'General',
        address: biz.address,
        phone: biz.phone,
        description: biz.description,
        distanceMiles: String(distanceMiles),
        queueSize: waitingCount,
        servingCount,
        estimatedWaitMins,
        confidence: stats?.prediction?.confidence || 'baseline',
        blendedAvgServiceTime: stats?.prediction?.blendedAvgServiceTime || biz.settings?.avgServiceTimeDefault || 5,
        availability: {
          queueStatus,
          isOpen,
          allowRemoteJoin: biz.settings?.allowRemoteJoin !== false,
          activeCounters,
          totalCounters,
          maxQueueSize: maxQueue,
          capacityRemaining
        },
        stats
      };
    })
  );

  let minWait = Infinity;
  let minQueue = Infinity;
  let minDistance = Infinity;

  comparisonList.forEach((b) => {
    if (b.availability.isOpen) {
      if (b.estimatedWaitMins < minWait) minWait = b.estimatedWaitMins;
      if (b.queueSize < minQueue) minQueue = b.queueSize;
    }
    const distNum = parseFloat(b.distanceMiles);
    if (!isNaN(distNum) && distNum < minDistance) minDistance = distNum;
  });

  const businessesWithFlags = comparisonList.map((b) => ({
    ...b,
    isFastestWait: b.availability.isOpen && b.estimatedWaitMins === minWait,
    isShortestQueue: b.availability.isOpen && b.queueSize === minQueue,
    isClosest: parseFloat(b.distanceMiles) === minDistance
  }));

  const fastest = businessesWithFlags.find((b) => b.isFastestWait);
  const shortest = businessesWithFlags.find((b) => b.isShortestQueue);
  const closest = businessesWithFlags.find((b) => b.isClosest);

  res.status(200).json({
    success: true,
    data: {
      businesses: businessesWithFlags,
      summary: {
        totalCompared: businessesWithFlags.length,
        fastestOption: fastest ? { id: fastest._id, name: fastest.name, waitMins: fastest.estimatedWaitMins } : null,
        shortestQueueOption: shortest ? { id: shortest._id, name: shortest.name, queueSize: shortest.queueSize } : null,
        closestOption: closest ? { id: closest._id, name: closest.name, distanceMiles: closest.distanceMiles } : null
      }
    }
  });
});

module.exports = {
  getAllBusinesses,
  compareBusinesses,
  getProfile,
  updateProfile,
  addCounter,
  updateCounter,
  deleteCounter,
  addStaff,
  removeStaff,
  getStaff,
  getPublicBusiness
};
