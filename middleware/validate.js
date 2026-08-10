const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const details = issues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  Object.assign(req[source], result.data);
  next();
};

module.exports = validate;
