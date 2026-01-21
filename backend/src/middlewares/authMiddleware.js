// src/middlewares/authMiddleware.js

import { verifyToken } from '../config/jwt.js';
import User from '../models/User.js';
import { AuthenticationError, NotFoundError } from '../utils/errorTypes.js';

/**
 * Protect routes - Require authentication
 * Verifies JWT token and attaches user to request
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from "Bearer TOKEN"
      token = req.headers.authorization.split(' ')[1];
    }
    
    // 2. Check if token exists
    if (!token) {
      throw new AuthenticationError('Authentication required. Please provide a valid token');
    }
    
    // 3. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      throw new AuthenticationError(error.message);
    }
    
    // 4. Check if user still exists
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new NotFoundError('User no longer exists');
    }
    
    // 5. Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Your account has been deactivated');
    }
    
    // 6. Attach user to request (for use in next middleware/controller)
    req.user = user;
    req.userId = user._id;
    
    // 7. Continue to next middleware
    next();
    
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if no token
 * Useful for endpoints that work differently for logged-in vs guest users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    // Get token
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // If no token, continue without user
    if (!token) {
      return next();
    }
    
    // Verify token
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (error) {
      // Token invalid, continue without user
      console.log('Invalid token in optional auth:', error.message);
    }
    
    next();
    
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict to specific roles
 * Must be used AFTER protect middleware
 * 
 * @param  {...String} roles - Allowed roles
 * @returns {Function} Middleware
 * 
 * Usage: protect, restrictTo('admin'), controller
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    try {
      // Check if user exists (should be set by protect middleware)
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      // Check if user's role is in allowed roles
      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError(
          `You do not have permission to perform this action. Required role: ${roles.join(' or ')}`
        );
      }
      
      next();
      
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if authenticated user is accessing their own resource
 * 
 * @param {String} paramName - Name of URL parameter containing user ID (default: 'id')
 * @returns {Function} Middleware
 * 
 * Usage: protect, checkOwnership('id'), controller
 */
export const checkOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      // Check if user exists
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      // Get target user ID from URL params
      const targetUserId = req.params[paramName];
      
      // Check if user is accessing their own resource OR is admin
      if (
        req.user._id.toString() !== targetUserId &&
        req.user.role !== 'admin'
      ) {
        throw new AuthorizationError(
          'You do not have permission to access this resource'
        );
      }
      
      next();
      
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user owns a test result
 * 
 * @param {String} paramName - Parameter name for test ID (default: 'id')
 */
export const checkTestOwnership = (paramName = 'id') => {
  return async (req, res, next) => {
    try {
      // Import here to avoid circular dependency
      const TestResult = (await import('../models/TestResult.js')).default;
      
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      const testId = req.params[paramName];
      const test = await TestResult.findById(testId);
      
      if (!test) {
        throw new NotFoundError('Test result not found');
      }
      
      // Check ownership or admin
      if (
        test.userId.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
      ) {
        throw new AuthorizationError(
          'You do not have permission to access this test result'
        );
      }
      
      // Attach test to request for use in controller
      req.test = test;
      
      next();
      
    } catch (error) {
      next(error);
    }
  };
};