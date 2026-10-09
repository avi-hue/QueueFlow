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

module.exports = {
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
