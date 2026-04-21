const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    errorName: err.name,
    errorCode: err.code,
    errorDetails: err,
  });

  // Express-validator errors (already handled, but catch any that slip through)
  if (err.type === 'express-validator') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message || 'Validation failed',
      details: err.errors || [],
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.entries(err.errors).map(([field, error]) => ({
      field: field,
      message: error.message || 'Invalid value',
      value: error.value,
    }));
    return res.status(400).json({
      error: 'Validation error',
      message: details[0]?.message || 'Invalid data provided',
      details: details,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    logger.error(`Duplicate key error: ${field} = ${value}`);
    return res.status(400).json({
      error: 'Duplicate entry',
      message: `${field} "${value}" already exists`,
      field: field,
      value: value,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: `Invalid ${err.kind} for field ${err.path}`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  // Check if response has already been sent
  if (res.headersSent) {
    logger.error('Response already sent, cannot send error response');
    return;
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      name: err.name,
      code: err.code,
    }),
  });
};

/**
 * 404 handler
 */
const notFound = (req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
};

module.exports = {
  errorHandler,
  notFound,
};







