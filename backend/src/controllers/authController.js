// src/controllers/authController.js

import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import { catchAsync } from '../middlewares/errorHandler.js';

/**
 * Auth Controllers
 * Handle authentication HTTP requests
 */

// ========================================
// REGISTER
// ========================================

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
export const register = catchAsync(async (req, res) => {
  const { name, email, password, age, gender, phone } = req.body;
  
  const result = await authService.register({
    name,
    email,
    password,
    age,
    gender,
    phone
  });
  
  sendSuccess(
    res,
    HTTP_STATUS.CREATED,
    'Registration successful',
    result
  );
});

// ========================================
// LOGIN
// ========================================

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await authService.login(email, password);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Login successful',
    result
  );
});

// ========================================
// GET CURRENT USER
// ========================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
export const getCurrentUser = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  const user = await authService.getCurrentUser(userId);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'User retrieved successfully',
    { user }
  );
});

// ========================================
// LOGOUT
// ========================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
export const logout = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  await authService.logout(userId);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Logout successful',
    null
  );
});

// ========================================
// CHANGE PASSWORD
// ========================================

/**
 * @route   PATCH /api/auth/password
 * @desc    Change password
 * @access  Private
 */
export const changePassword = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;
  
  await authService.changePassword(userId, currentPassword, newPassword);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Password updated successfully',
    null
  );
});