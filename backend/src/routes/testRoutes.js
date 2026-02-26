// src/routes/testRoutes.js

import express from 'express';
import * as testController from '../controllers/testController.js';
import { protect, checkOwnership } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validator.js';
import {
  createTestSchema,
  testIdSchema,
  testQuerySchema
} from '../validators/testValidator.js';

const router = express.Router();

/**
 * Test Routes
 * Base path: /api/tests
 */

// All routes require authentication
router.use(protect);

// Create test result
router.post(
  '/',
  validateBody(createTestSchema),
  testController.createTestResult
);

// Get single test
router.get(
  '/:id',
  validateParams(testIdSchema),
  testController.getTestResult
);

// Delete test
router.delete(
  '/:id',
  validateParams(testIdSchema),
  testController.deleteTestResult
);

// Get user's test history
router.get(
  '/user/:userId',
  checkOwnership('userId'),
  validateQuery(testQuerySchema),
  testController.getUserTestHistory
);

// Get latest test
router.get(
  '/user/:userId/latest',
  checkOwnership('userId'),
  testController.getLatestTest
);

// Get test statistics
router.get(
  '/user/:userId/statistics',
  checkOwnership('userId'),
  testController.getTestStatistics
);

export default router;