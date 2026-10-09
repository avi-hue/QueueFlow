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


const getAllBusinesses = asyncHandler(async (req, res) => {
  const Business = require('../models/Business');
  const queueService = require('../services/queueService');
  
  const businesses = await Business.find({});
  
  // Attach live queue stats and calculate mock distance from a fixed user point (NYC center)
  const userLat = 40.748817;
  const userLon = -73.98513;

  const businessesWithStats = await Promise.all(businesses.map(async (biz) => {
    let stats = null;
    try {
      const state = await queueService.getQueueState(biz._id);
      stats = state.stats;
    } catch (e) {
      // Queue might not exist for today yet
    }
    
    // Haversine distance in miles
    const [bizLon, bizLat] = biz.location?.coordinates || [0, 0];
    const R = 3958.8; // Radius of the Earth in miles
    const rlat1 = userLat * (Math.PI/180);
    const rlat2 = bizLat * (Math.PI/180);
    const difflat = rlat2 - rlat1;
    const difflon = (bizLon - userLon) * (Math.PI/180);
    
    const a = 2 * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2) + Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
    const distanceMiles = (R * a).toFixed(1);

    return { ...biz.toObject(), stats, distanceMiles };
  }));

  res.status(200).json({ success: true, data: { businesses: businessesWithStats } });
});

module.exports = {
  getAllBusinesses,
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
