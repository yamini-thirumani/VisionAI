// src/services/testService.js

import TestResult from '../models/TestResult.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError
} from '../utils/errorTypes.js';
import logger from '../utils/logger.js';

/**
 * Test Service
 * Handles vision test result operations
 */

// ========================================
// CREATE TEST RESULT
// ========================================

/**
 * Create new test result
 * @param {String} userId - User ID
 * @param {Object} testData - Test result data
 * @returns {Promise<Object>} - Created test result
 */
export const createTestResult = async (userId, testData) => {
  try {
    // 1. Verify user exists and can take test
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    if (!user.canTakeTest()) {
      throw new AuthorizationError('Your account is not active. Cannot save test results');
    }
    
    // 2. Add userId to test data
    const testResultData = {
      ...testData,
      userId
    };
    
    // 3. Create test result
    const testResult = await TestResult.create(testResultData);
    
    // 4. Log test creation
    logger.info(`Test result created for user: ${userId}, classification: ${testResult.classification}`);
    
    // 5. Return test result
    return testResult;
    
  } catch (error) {
    logger.error(`Create test result error: ${error.message}`);

    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((e) => e.message);
      throw new ValidationError('Test result validation failed', details);
    }

    throw error;
  }
};

// ========================================
// GET TEST RESULT BY ID
// ========================================

/**
 * Get single test result
 * @param {String} testId - Test ID
 * @param {String} requesterId - User requesting the test
 * @returns {Promise<Object>} - Test result
 */
export const getTestResultById = async (testId, requesterId) => {
  try {
    // Find test result
    const test = await TestResult.findById(testId);
    
    if (!test) {
      throw new NotFoundError('Test result not found');
    }
    
    // Check authorization
    const requester = await User.findById(requesterId);
    
    if (
      test.userId.toString() !== requesterId &&
      requester.role !== 'admin'
    ) {
      throw new AuthorizationError('You do not have permission to view this test result');
    }
    
    return test;
    
  } catch (error) {
    logger.error(`Get test result error: ${error.message}`);
    throw error;
  }
};

// ========================================
// GET USER'S TEST HISTORY
// ========================================

/**
 * Get all tests for a user with pagination
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - { tests, pagination }
 */
export const getUserTestHistory = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      classification,
      startDate,
      endDate
    } = options;
    
    // Build query
    const query = { userId };
    
    // Filter by classification
    if (classification) {
      query.classification = classification;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Calculate skip
    const skip = (page - 1) * limit;
    
    // Get tests
    const tests = await TestResult.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const totalTests = await TestResult.countDocuments(query);
    
    return {
      tests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTests / limit),
        totalItems: totalTests,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalTests / limit),
        hasPrevPage: page > 1
      }
    };
    
  } catch (error) {
    logger.error(`Get user test history error: ${error.message}`);
    throw error;
  }
};

// ========================================
// GET LATEST TEST
// ========================================

/**
 * Get user's most recent test
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Latest test result
 */
export const getLatestTest = async (userId) => {
  try {
    const test = await TestResult.getLatestTest(userId);
    
    if (!test) {
      throw new NotFoundError('No test results found for this user');
    }
    
    return test;
    
  } catch (error) {
    logger.error(`Get latest test error: ${error.message}`);
    throw error;
  }
};

// ========================================
// DELETE TEST RESULT
// ========================================

/**
 * Delete test result
 * @param {String} testId - Test ID
 * @param {String} requesterId - User requesting deletion
 * @returns {Promise<Object>} - Success message
 */
export const deleteTestResult = async (testId, requesterId) => {
  try {
    // Find test
    const test = await TestResult.findById(testId);
    
    if (!test) {
      throw new NotFoundError('Test result not found');
    }
    
    // Check authorization
    const requester = await User.findById(requesterId);
    
    if (
      test.userId.toString() !== requesterId &&
      requester.role !== 'admin'
    ) {
      throw new AuthorizationError('You do not have permission to delete this test result');
    }
    
    // Delete test
    await TestResult.findByIdAndDelete(testId);
    
    logger.info(`Test result deleted: ${testId}`);
    
    return {
      message: 'Test result deleted successfully'
    };
    
  } catch (error) {
    logger.error(`Delete test result error: ${error.message}`);
    throw error;
  }
};

// ========================================
// GET TEST STATISTICS
// ========================================

/**
 * Get user's test statistics
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Statistics
 */
export const getUserTestStatistics = async (userId) => {
  try {
    const stats = await TestResult.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgConfidence: { $avg: '$reliability.confidenceScore' },
          avgAccuracy: { $avg: '$visualAcuity.accuracyPercentage' },
          classifications: {
            $push: '$classification'
          }
        }
      }
    ]);
    
    if (!stats.length) {
      return {
        totalTests: 0,
        avgConfidence: 0,
        avgAccuracy: 0,
        classificationBreakdown: {}
      };
    }
    
    // Count classification breakdown
    const classificationBreakdown = stats[0].classifications.reduce((acc, classification) => {
      acc[classification] = (acc[classification] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalTests: stats[0].totalTests,
      avgConfidence: Math.round(stats[0].avgConfidence),
      avgAccuracy: Math.round(stats[0].avgAccuracy),
      classificationBreakdown
    };
    
  } catch (error) {
    logger.error(`Get test statistics error: ${error.message}`);
    throw error;
  }
};