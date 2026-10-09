const { ApiError } = require('../utils/ApiError');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Requires one of roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
};

const requireBusinessAccess = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (req.user.role !== 'owner' && req.user.role !== 'staff') {
    return next(new ApiError(403, 'Access restricted to business staff or owners'));
  }

  if (!req.user.businessId) {
    return next(new ApiError(400, 'User is not associated with any business'));
  }

  next();
};

module.exports = { requireRole, requireBusinessAccess };
