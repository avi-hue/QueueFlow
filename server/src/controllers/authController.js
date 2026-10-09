const authService = require('../services/authService');
const { asyncHandler } = require('../utils/asyncHandler');
const env = require('../config/env');

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      business: result.business || undefined,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);

  res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken
    }
  });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies.refreshToken;
  const result = await authService.refreshAccessToken(token);

  res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', cookieOptions);
  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    data: { user }
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe
};
