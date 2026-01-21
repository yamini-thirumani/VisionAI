// src/middlewares/errorHandler.js

import { AppError } from '../utils/errorTypes.js';
import { sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';

/**
 * Global Error Handler Middleware
 * Catches all errors and sends consistent response
 * 
 * MUST be registered LAST in app.js
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // Operational errors (expected errors)
  if (err.isOperational) {
    return sendError(
      res,
      err.statusCode,
      err.message,
      err.errors || null
    );
  }
  
  // MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      `Invalid ${err.path}: ${err.value}`
    );
  }
  
  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    return sendError(
      res,
      HTTP_STATUS.CONFLICT,
      `${field} '${value}' already exists`
    );
  }
  
  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'Validation failed',
      errors
    );
  }
  
  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid token. Please log in again'
    );
  }
  
  if (err.name === 'TokenExpiredError') {
    return sendError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      'Your token has expired. Please log in again'
    );
  }
  
  // Programming errors (unexpected)
  console.error('💥 UNEXPECTED ERROR:', err);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Something went wrong. Please try again later'
    );
  }
  
  // In development, send full error
  return sendError(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    err.message,
    [{ stack: err.stack }]
  );
};

/**
 * Handle unhandled promise rejections
 * Register in server.js
 */
export const unhandledRejectionHandler = (server) => {
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    
    // Close server gracefully
    server.close(() => {
      process.exit(1);
    });
  });
};

/**
 * Handle uncaught exceptions
 * Register in server.js
 */
export const uncaughtExceptionHandler = () => {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    process.exit(1);
  });
};

/**
 * Async error wrapper
 * Wraps async controllers to catch errors automatically
 * 
 * Usage:
 * router.get('/users', catchAsync(async (req, res) => {
 *   const users = await User.find();  // If this throws, catchAsync catches it
 *   res.json(users);
 * }));
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};