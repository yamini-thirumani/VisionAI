// src/services/userService.js

import User from '../models/User.js';
import TestResult from '../models/TestResult.js';
import {
  NotFoundError,
  AuthorizationError,
  ValidationError
} from '../utils/errorTypes.js';
import logger from '../utils/logger.js';

/**
 * User Service
 * Handles user profile and account management
 */

// ========================================
// GET USER PROFILE
// ========================================

/**
 * Get user profile by ID
 * @param {String} userId - User ID
 * @param {String} requesterId - ID of user making request
 * @returns {Promise<Object>} - User profile
 */
export const getUserProfile = async (userId, requesterId) => {
  try {
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Check if user is accessing their own profile or is admin
    // (This is also checked in middleware, but good to double-check)
    const requester = await User.findById(requesterId);
    
    if (
      userId !== requesterId &&
      requester.role !== 'admin'
    ) {
      throw new AuthorizationError('You do not have permission to view this profile');
    }
    
    // Get additional stats
    const testCount = await TestResult.getUserTestCount(userId);
    const latestTest = await TestResult.getLatestTest(userId);
    
    // Return profile with stats
    return {
      ...user.getPublicProfile(),
      stats: {
        totalTests: testCount,
        latestTest: latestTest ? latestTest.getSummary() : null
      }
    };
    
  } catch (error) {
    logger.error(`Get user profile error: ${error.message}`);
    throw error;
  }
};

// ========================================
// UPDATE USER PROFILE
// ========================================

/**
 * Update user profile
 * @param {String} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated user
 */
export const updateUserProfile = async (userId, updateData) => {
  try {
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Fields that can be updated
    const allowedUpdates = ['name', 'age', 'gender', 'phone', 'medicalHistory', 'calibration'];
    
    // Update only allowed fields
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'medicalHistory' && user.medicalHistory) {
          // Merge medical history
          user.medicalHistory = {
            ...user.medicalHistory.toObject(),
            ...updateData.medicalHistory
          };
        } else if (key === 'calibration') {
          const prev =
            user.calibration?.toObject?.() ||
            (user.calibration && typeof user.calibration === 'object' ? { ...user.calibration } : {});
          user.calibration = {
            ...prev,
            ...updateData.calibration,
            lastCalibratedAt: new Date()
          };
        } else {
          user[key] = updateData[key];
        }
      }
    });
    
    // Save updated user
    await user.save();
    
    logger.info(`User profile updated: ${user.email}`);
    
    return user.getPublicProfile();
    
  } catch (error) {
    logger.error(`Update user profile error: ${error.message}`);
    throw error;
  }
};

// ========================================
// DELETE USER ACCOUNT
// ========================================

/**
 * Delete user account (soft delete)
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Success message
 */
export const deleteUserAccount = async (userId) => {
  try {
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Soft delete (deactivate account)
    user.isActive = false;
    await user.save();
    
    // Also soft delete all test results
    await TestResult.updateMany(
      { userId },
      { status: 'invalid' }
    );
    
    logger.info(`User account deleted (soft): ${user.email}`);
    
    return {
      message: 'Account deleted successfully'
    };
    
  } catch (error) {
    logger.error(`Delete user account error: ${error.message}`);
    throw error;
  }
};

// ========================================
// HARD DELETE (Admin only)
// ========================================

/**
 * Permanently delete user account
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Success message
 */
export const hardDeleteUser = async (userId) => {
  try {
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Delete all test results
    await TestResult.deleteMany({ userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    logger.warn(`User permanently deleted: ${user.email}`);
    
    return {
      message: 'User and all associated data permanently deleted'
    };
    
  } catch (error) {
    logger.error(`Hard delete user error: ${error.message}`);
    throw error;
  }
};

// ========================================
// GET ALL USERS (Admin only)
// ========================================

/**
 * Get all users with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - { users, pagination }
 */
export const getAllUsers = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      isActive
    } = options;
    
    // Build query
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    
    // Calculate skip
    const skip = (page - 1) * limit;
    
    // Get users
    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const totalUsers = await User.countDocuments(query);
    
    return {
      users: users.map(user => user.getPublicProfile()),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        usersPerPage: limit
      }
    };
    
  } catch (error) {
    logger.error(`Get all users error: ${error.message}`);
    throw error;
  }
};

// ========================================
// REACTIVATE ACCOUNT
// ========================================

/**
 * Reactivate deactivated account
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Success message
 */
export const reactivateAccount = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    if (user.isActive) {
      throw new ValidationError('Account is already active');
    }
    
    user.isActive = true;
    await user.save();
    
    logger.info(`User account reactivated: ${user.email}`);
    
    return {
      message: 'Account reactivated successfully'
    };
    
  } catch (error) {
    logger.error(`Reactivate account error: ${error.message}`);
    throw error;
  }
};