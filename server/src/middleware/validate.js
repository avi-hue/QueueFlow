const { ApiError } = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    // Replace with parsed/sanitized data if schema defines them
    if (validated.body) req.body = validated.body;
    if (validated.query) req.query = validated.query;
    if (validated.params) req.params = validated.params;
    next();
  } catch (error) {
    if (error.errors) {
      const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return next(new ApiError(400, messages, error.errors));
    }
    return next(new ApiError(400, error.message || 'Validation failed'));
  }
};

module.exports = { validate };
