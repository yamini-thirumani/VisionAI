// src/services/authService.js

import User from '../models/User.js';
import { generateToken } from '../config/jwt.js';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError
} from '../utils/errorTypes.js';
import logger from '../utils/logger.js';

/**
 * Auth Service
 * Handles all authentication-related business logic
 */

// ========================================
// REGISTER USER
// ========================================

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - { user, token }
 */
export const register = async (userData) => {
  try {
    const { name, email, password, age, gender, phone } = userData;
    
    // 1. Check if user already exists
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }
    
    // 2. Create user
    const user = await User.create({
      name,
      email,
      password,  // Will be hashed by pre-save middleware
      age,
      gender,
      phone
    });
    
    // 3. Generate JWT token
    const token = generateToken({
      userId: user._id,
      role: user.role
    });
    
    // 4. Log successful registration
    logger.info(`New user registered: ${user.email}`);
    
    // 5. Return user and token (remove password)
    return {
      user: user.getPublicProfile(),
      token
    };
    
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
};

// ========================================
// LOGIN USER
// ========================================

/**
 * Login user
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Promise<Object>} - { user, token }
 */
export const login = async (email, password) => {
  try {
    // 1. Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }
    
    // 2. Find user with password (password is select: false by default)
    const user = await User.findByEmailWithPassword(email);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // 3. Check if account is active
    if (!user.isActive) {
      throw new AuthenticationError('Your account has been deactivated. Please contact support');
    }
    
    // 4. Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      throw new AuthenticationError('Invalid password');
    }
    
    // 5. Update last login time
    user.lastLoginAt = new Date();
    await user.save();
    
    // 6. Generate token
    const token = generateToken({
      userId: user._id,
      role: user.role
    });
    
    // 7. Log successful login
    logger.info(`User logged in: ${user.email}`);
    
    // 8. Return user and token
    return {
      user: user.getPublicProfile(),
      token
    };
    
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
};

// ========================================
// GET CURRENT USER
// ========================================

/**
 * Get current authenticated user
 * @param {String} userId - User ID from JWT
 * @returns {Promise<Object>} - User object
 */
export const getCurrentUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }
    
    return user.getPublicProfile();
    
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);
    throw error;
  }
};

// ========================================
// LOGOUT (Client-side, but we can log it)
// ========================================

/**
 * Logout user (mainly for logging purposes)
 * Actual logout happens client-side by removing token
 * @param {String} userId - User ID
 */
export const logout = async (userId) => {
  try {
    logger.info(`User logged out: ${userId}`);
    
    // In a more complex system, you might:
    // - Add token to blacklist
    // - Clear refresh tokens
    // - Log session end time
    
    return { message: 'Logout successful' };
    
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    throw error;
  }
};

// ========================================
// CHANGE PASSWORD
// ========================================

/**
 * Change user password
 * @param {String} userId - User ID
 * @param {String} currentPassword - Current password
 * @param {String} newPassword - New password
 * @returns {Promise<Object>} - Success message
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // 1. Get user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // 2. Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    
    if (!isPasswordCorrect) {
      throw new AuthenticationError('Current password is incorrect');
    }
    
    // 3. Check if new password is different
    if (currentPassword === newPassword) {
      throw new ValidationError('New password must be different from current password');
    }
    
    // 4. Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();
    
    // 5. Log password change
    logger.info(`Password changed for user: ${user.email}`);
    
    return {
      message: 'Password updated successfully'
    };
    
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    throw error;
  }
};

// ========================================
// VERIFY EMAIL (Future Enhancement)
// ========================================

/**
 * Verify user email
 * @param {String} token - Verification token
 */
export const verifyEmail = async (token) => {
  // TODO: Implement email verification
  // 1. Verify token
  // 2. Find user by verification token
  // 3. Update user.isEmailVerified = true
  // 4. Clear verification token
  throw new Error('Email verification not implemented yet');
};

// ========================================
// FORGOT PASSWORD (Future Enhancement)
// ========================================

/**
 * Send password reset email
 * @param {String} email - User email
 */
export const forgotPassword = async (email) => {
  // TODO: Implement password reset
  // 1. Find user by email
  // 2. Generate reset token
  // 3. Send email with reset link
  // 4. Store reset token with expiry
  throw new Error('Password reset not implemented yet');
};