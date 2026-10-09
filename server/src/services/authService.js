const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Business = require('../models/Business');
const { ApiError } = require('../utils/ApiError');

const generateTokens = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
    businessId: user.businessId || null
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
};

const registerUser = async (data) => {
  const { name, email, password, phone, role = 'customer', business } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  if (role === 'owner') {
    if (!business || !business.name || !business.address) {
      throw new ApiError(400, 'Business name and address are required when registering as owner');
    }

    const user = new User({
      name,
      email,
      phone,
      passwordHash: password,
      role: 'owner'
    });
    await user.save();

    const coordinates = business.coordinates && business.coordinates.length === 2
      ? business.coordinates
      : [-73.985130, 40.748817]; // default coords (e.g. NYC) if not provided

    const newBusiness = new Business({
      ownerId: user._id,
      name: business.name,
      category: business.category || 'Other',
      description: business.description || '',
      phone: business.phone || phone || '',
      address: business.address,
      location: {
        type: 'Point',
        coordinates
      },
      counters: [
        {
          name: 'Counter 1',
          isActive: true
        }
      ]
    });
    await newBusiness.save();

    user.businessId = newBusiness._id;
    await user.save();

    const tokens = generateTokens(user);
    const populatedUser = await User.findById(user._id).populate('businessId');

    return { user: populatedUser, business: newBusiness, tokens };
  }

  // Register Customer
  const user = new User({
    name,
    email,
    phone,
    passwordHash: password,
    role: 'customer'
  });
  await user.save();

  const tokens = generateTokens(user);
  return { user, tokens };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokens = generateTokens(user);
  const populatedUser = await User.findById(user._id).populate('businessId');

  return { user: populatedUser, tokens };
};

const refreshAccessToken = async (token) => {
  if (!token) {
    throw new ApiError(401, 'Refresh token required');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User belonging to this token no longer exists');
    }

    const tokens = generateTokens(user);
    return { tokens, user };
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};

module.exports = {
  generateTokens,
  registerUser,
  loginUser,
  refreshAccessToken
};
