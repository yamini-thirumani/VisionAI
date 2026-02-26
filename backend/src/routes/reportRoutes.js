// src/routes/reportRoutes.js

import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { protect, checkOwnership, checkTestOwnership } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Report Routes
 * Base path: /api/reports
 */

// All routes require authentication
router.use(protect);

// Generate test report
router.get(
  '/:testId',
  checkTestOwnership('testId'),
  reportController.generateTestReport
);

// Generate trend analysis
router.get(
  '/user/:userId/trend',
  checkOwnership('userId'),
  reportController.generateTrendAnalysis
);

export default router;