// src/controllers/userController.js

import * as userService from '../services/userService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import { catchAsync } from '../middlewares/errorHandler.js';

/**
 * User Controllers
 * Handle user management HTTP requests
 */

// ========================================
// GET USER PROFILE
// ========================================

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile
 * @access  Private (own profile or admin)
 */
export const getUserProfile = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const requesterId = req.user._id;
  
  const profile = await userService.getUserProfile(userId, requesterId);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'User profile retrieved successfully',
    { user: profile }
  );
});

// ========================================
// UPDATE USER PROFILE
// ========================================

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (own profile only)
 */
export const updateUserProfile = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const updateData = req.body;
  
  const updatedUser = await userService.updateUserProfile(userId, updateData);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Profile updated successfully',
    { user: updatedUser }
  );
});

// ========================================
// DELETE USER ACCOUNT
// ========================================

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user account (soft delete)
 * @access  Private (own account only)
 */
export const deleteUserAccount = catchAsync(async (req, res) => {
  const userId = req.params.id;
  
  await userService.deleteUserAccount(userId);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Account deleted successfully',
    null
  );
});

// ========================================
// GET ALL USERS (Admin)
// ========================================

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (admin only)
 */
export const getAllUsers = catchAsync(async (req, res) => {
  const { page, limit, sortBy, order, isActive } = req.query;
  
  const result = await userService.getAllUsers({
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    order,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
  });
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Users retrieved successfully',
    result.users
  );
  
  // Note: pagination info already included in result
});