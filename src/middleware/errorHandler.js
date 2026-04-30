// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Full Error Object:', JSON.stringify(err, null, 2));

  // Prisma known request errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({ error: 'Database error', details: err.message, code: err.code });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    details: err.message || 'No detailed message provided',
  });
}

module.exports = errorHandler;
