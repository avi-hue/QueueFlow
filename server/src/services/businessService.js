const Business = require('../models/Business');
const User = require('../models/User');
const { ApiError } = require('../utils/ApiError');

const getBusinessById = async (businessId) => {
  const business = await Business.findById(businessId).populate('counters.staffId', 'name email');
  if (!business) {
    throw new ApiError(404, 'Business not found');
  }
  return business;
};

const updateBusinessProfile = async (businessId, updates) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new ApiError(404, 'Business not found');
  }

  const allowedFields = [
    'name',
    'category',
    'description',
    'phone',
    'address',
    'location',
    'openingHours',
    'timezone',
    'isActive',
    'settings'
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      if (field === 'settings') {
        business.settings = { ...business.settings.toObject(), ...updates.settings };
      } else if (field === 'location' && updates.location.coordinates) {
        business.location = {
          type: 'Point',
          coordinates: updates.location.coordinates
        };
      } else {
        business[field] = updates[field];
      }
    }
  });

  await business.save();
  return business;
};

const addCounter = async (businessId, counterData) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new ApiError(404, 'Business not found');
  }

  const { name, isActive = true, staffId = null } = counterData;

  if (staffId) {
    const staff = await User.findOne({ _id: staffId, businessId, role: 'staff' });
    if (!staff) {
      throw new ApiError(400, 'Assigned staff member not found in this business');
    }
  }

  const newCounter = {
    name,
    isActive,
    staffId: staffId || null
  };

  business.counters.push(newCounter);
  await business.save();

  return business.counters[business.counters.length - 1];
};

const updateCounter = async (businessId, counterId, counterUpdates) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new ApiError(404, 'Business not found');
  }

  const counter = business.counters.id(counterId);
  if (!counter) {
    throw new ApiError(404, 'Counter not found');
  }

  if (counterUpdates.name !== undefined) counter.name = counterUpdates.name;
  if (counterUpdates.isActive !== undefined) counter.isActive = counterUpdates.isActive;
  if (counterUpdates.staffId !== undefined) {
    if (counterUpdates.staffId) {
      const staff = await User.findOne({
        _id: counterUpdates.staffId,
        businessId,
        role: 'staff'
      });
      if (!staff) {
        throw new ApiError(400, 'Assigned staff member not found in this business');
      }
      counter.staffId = counterUpdates.staffId;
    } else {
      counter.staffId = null;
    }
  }

  await business.save();
  return counter;
};

const deleteCounter = async (businessId, counterId) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new ApiError(404, 'Business not found');
  }

  const counter = business.counters.id(counterId);
  if (!counter) {
    throw new ApiError(404, 'Counter not found');
  }

  business.counters.pull(counterId);
  await business.save();
  return { counterId };
};

const addStaffMember = async (businessId, { name, email, password, phone }) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new ApiError(404, 'Business not found');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const staffUser = new User({
    name,
    email,
    passwordHash: password,
    phone: phone || '',
    role: 'staff',
    businessId
  });

  await staffUser.save();
  return staffUser;
};

const removeStaffMember = async (businessId, staffId) => {
  const staff = await User.findOne({ _id: staffId, businessId, role: 'staff' });
  if (!staff) {
    throw new ApiError(404, 'Staff member not found in this business');
  }

  // Remove staff from any counters they are assigned to
  await Business.updateOne(
    { _id: businessId, 'counters.staffId': staffId },
    { $set: { 'counters.$.staffId': null } }
  );

  await User.findByIdAndDelete(staffId);
  return { staffId };
};

const getStaffMembers = async (businessId) => {
  return await User.find({ businessId, role: 'staff' }).select('-passwordHash');
};

module.exports = {
  getBusinessById,
  updateBusinessProfile,
  addCounter,
  updateCounter,
  deleteCounter,
  addStaffMember,
  removeStaffMember,
  getStaffMembers
};
