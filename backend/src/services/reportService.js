// src/services/reportService.js

import TestResult from '../models/TestResult.js';
import User from '../models/User.js';
import { NotFoundError } from '../utils/errorTypes.js';
import logger from '../utils/logger.js';

/**
 * Report Service
 * Handles report generation and trend analysis
 */

// ========================================
// GENERATE TEST REPORT
// ========================================

/**
 * Generate detailed report for a test
 * @param {String} testId - Test ID
 * @returns {Promise<Object>} - Detailed report
 */
export const generateTestReport = async (testId) => {
  try {
    // Get test result
    const test = await TestResult.findById(testId);
    
    if (!test) {
      throw new NotFoundError('Test result not found');
    }
    
    // Get user info
    const user = await User.findById(test.userId);
    
    // Calculate quality score
    const qualityScore = test.calculateQualityScore();
    
    // Get recommendations
    const recommendations = test.getRecommendations();
    
    // Build report
    const report = {
      testId: test._id,
      userId: test.userId,
      userName: user ? user.name : 'Unknown',
      userEmail: user ? user.email : 'Unknown',
      testDate: test.testDate,
      timeSinceTest: test.timeSinceTest,
      
      visualAcuity: {
        snellen: test.visualAcuity.snellen,
        logMAR: test.visualAcuity.logMAR,
        decimal: test.visualAcuity.decimal,
        accuracyPercentage: test.visualAcuity.accuracyPercentage,
        interpretation: getAcuityInterpretation(test.visualAcuity.snellen)
      },
      
      classification: {
        level: test.classification,
        severity: getClassificationSeverity(test.classification)
      },
      
      reliability: {
        confidenceScore: test.reliability.confidenceScore,
        consistencyScore: test.reliability.consistencyScore,
        averageResponseTime: test.reliability.averageResponseTime,
        qualityScore,
        rating: getReliabilityRating(test.reliability.confidenceScore),
        isReliable: test.isReliable()
      },
      
      testConditions: {
        averageDistance: test.testConditions.averageDistance,
        lightingLevel: test.testConditions.lightingLevel,
        violations: test.testConditions.violations,
        violationCount: test.testConditions.violations.length
      },
      
      recommendations,
      
      disclaimer: 'This is a preliminary screening tool and not a substitute for professional medical diagnosis. Please consult an eye care professional for comprehensive examination.'
    };
    
    logger.info(`Report generated for test: ${testId}`);
    
    return report;
    
  } catch (error) {
    logger.error(`Generate test report error: ${error.message}`);
    throw error;
  }
};

// ========================================
// GENERATE TREND ANALYSIS
// ========================================

/**
 * Analyze vision trends over time
 * @param {String} userId - User ID
 * @param {String} period - Time period ('week', 'month', 'year', 'all')
 * @returns {Promise<Object>} - Trend analysis
 */
export const generateTrendAnalysis = async (userId, period = 'all') => {
  try {
    // Calculate date range
    const now = new Date();
    let startDate = new Date(0); // Beginning of time
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Get tests in range
    const tests = await TestResult.find({
      userId,
      createdAt: { $gte: startDate },
      status: 'completed'
    }).sort({ createdAt: 1 });
    
    if (tests.length === 0) {
      throw new NotFoundError('No test results found for this period');
    }
    
    // Extract data points
    const dataPoints = tests.map(test => ({
      date: test.createdAt.toISOString().split('T')[0],
      snellen: test.visualAcuity.snellen,
      logMAR: test.visualAcuity.logMAR,
      classification: test.classification,
      confidenceScore: test.reliability.confidenceScore
    }));
    
    // Analyze trend
    const analysis = analyzeTrendDirection(tests);
    
    return {
      userId,
      period,
      testCount: tests.length,
      dateRange: {
        start: tests[0].createdAt,
        end: tests[tests.length - 1].createdAt
      },
      dataPoints,
      analysis
    };
    
  } catch (error) {
    logger.error(`Generate trend analysis error: ${error.message}`);
    throw error;
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get interpretation of visual acuity
 */
function getAcuityInterpretation(snellen) {
  const denominator = parseInt(snellen.split('/')[1]);
  
  if (denominator <= 20) return 'Normal or better than normal vision';
  if (denominator <= 30) return 'Slightly reduced vision';
  if (denominator <= 70) return 'Mild vision impairment';
  if (denominator <= 160) return 'Moderate vision impairment';
  return 'Severe vision impairment';
}

/**
 * Get classification severity level
 */
function getClassificationSeverity(classification) {
  const severityMap = {
    'normal': 0,
    'borderline': 1,
    'mild-myopia': 2,
    'moderate-myopia': 3,
    'severe-myopia': 4
  };
  return severityMap[classification] || 0