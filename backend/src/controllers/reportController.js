// src/controllers/reportController.js

import reportService from '../services/reportService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import { catchAsync } from '../middlewares/errorHandler.js';

/**
 * Report Controllers
 * Handle report generation HTTP requests
 */

// ========================================
// GENERATE TEST REPORT
// ========================================

/**
 * @route   GET /api/reports/:testId
 * @desc    Generate detailed report for a test
 * @access  Private (own test or admin)
 */
export const generateTestReport = catchAsync(async (req, res) => {
  const testId = req.params.testId;
  
  const report = await reportService.generateTestReport(testId);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Report generated successfully',
    { report }
  );
});

// ========================================
// GENERATE TREND ANALYSIS
// ========================================

/**
 * @route   GET /api/reports/user/:userId/trend
 * @desc    Get vision trend analysis
 * @access  Private (own trends or admin)
 * @query   period - 'week', 'month', 'year', 'all'
 */
export const generateTrendAnalysis = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const period = req.query.period || 'all';
  
  const trend = await reportService.generateTrendAnalysis(userId, period);
  
  sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Trend analysis generated successfully',
    { trend }
  );
});