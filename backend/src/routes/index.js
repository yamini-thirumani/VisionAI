// src/routes/index.js

import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import testRoutes from './testRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = express.Router();

/**
 * Main Router
 * Combines all route modules
 */

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tests', testRoutes);
router.use('/reports', reportRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'VisionAI API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tests: '/api/tests',
      reports: '/api/reports',
      health: '/api/health'
    }
  });
});

export default router;