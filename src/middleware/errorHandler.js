// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // Prisma known request errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({ error: 'Database error', detail: err.message });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
