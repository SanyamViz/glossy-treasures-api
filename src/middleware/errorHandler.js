// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`);
  console.error('Message:', err.message);
  console.error('Name:', err.name);
  console.error('Stack:', err.stack);
  
  // Custom properties often found in errors
  const details = {};
  Object.getOwnPropertyNames(err).forEach(key => {
    details[key] = err[key];
  });
  console.error('Full Error Details:', details);

  // Prisma known request errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({ error: 'Database error', details: err.message, code: err.code });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    details: err.message || 'No detailed message provided',
    fullError: process.env.NODE_ENV === 'development' ? details : undefined
  });
}

module.exports = errorHandler;
