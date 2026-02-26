// src/controllers/testController.js

import * as testService from '../services/testService.js';
import { sendSuccess, sendPaginated } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import { catchAsync } from '../middlewares/errorHandler.js';

/**
 * Test Controllers
 * Handle vision test HTTP requests
 */

// ========================================
// CREATE TEST RESULT
// ========================================

/**
 * @route   POST /api/tests
 * @desc    Create new test result
 * @access  Private
 */
export const createTestResult = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const testData = req.body;
  
  const testResult = await testService.createTestResult(userId, testData);
  
  sendSuccess(
    res,
    HTTP_STATUS.CREATED,
    'Test result saved successfully',
    { test: testResult }
  );
});

// ========================================
// GET TEST RESULT BY ID
// ========================================

/**
 * @route   GET /api/tests/:id
 * @desc    Get single test result
 * @access  Private (own test or admin)
 */
export const getTestResult = catchAsync(async (req, res) => {
  const testId = req.params.id;
  const requesterId = req.user._id;
  
  const test = await testService.getTestResultById(testId, requesterId);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Test result retrieved successfully',
    { test }
  );
});

// ========================================
// GET USER'S TEST HISTORY
// ========================================

/**
 * @route   GET /api/tests/user/:userId
 * @desc    Get all tests for a user
 * @access  Private (own tests or admin)
 */
export const getUserTestHistory = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const {
    page,
    limit,
    sort,
    classification,
    startDate,
    endDate
  } = req.validatedQuery || req.query;
  
  const result = await testService.getUserTestHistory(userId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sort,
    classification,
    startDate,
    endDate
  });
  
  sendPaginated(res, result.tests, result.pagination);
});

// ========================================
// GET LATEST TEST
// ========================================

/**
 * @route   GET /api/tests/user/:userId/latest
 * @desc    Get user's most recent test
 * @access  Private (own tests or admin)
 */
export const getLatestTest = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  
  const test = await testService.getLatestTest(userId);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Latest test retrieved successfully',
    { test }
  );
});

// ========================================
// DELETE TEST RESULT
// ========================================

/**
 * @route   DELETE /api/tests/:id
 * @desc    Delete test result
 * @access  Private (own test or admin)
 */
export const deleteTestResult = catchAsync(async (req, res) => {
  const testId = req.params.id;
  const requesterId = req.user._id;
  
  await testService.deleteTestResult(testId, requesterId);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Test result deleted successfully',
    null
  );
});

// ========================================
// GET TEST STATISTICS
// ========================================

/**
 * @route   GET /api/tests/user/:userId/statistics
 * @desc    Get user's test statistics
 * @access  Private (own stats or admin)
 */
export const getTestStatistics = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  
  const stats = await testService.getUserTestStatistics(userId);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Statistics retrieved successfully',
    { statistics: stats }
  );
});