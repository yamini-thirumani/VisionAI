// src/routes/userRoutes.js

import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect, restrictTo, checkOwnership } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validator.js';
import { updateProfileSchema, userIdSchema } from '../validators/userValidator.js';

const router = express.Router();

/**
 * User Routes
 * Base path: /api/users
 */

// All routes require authentication
router.use(protect);

// Get all users (admin only)
router.get(
  '/',
  restrictTo('admin'),
  userController.getAllUsers
);

// Get user profile
router.get(
  '/:id',
  validateParams(userIdSchema),
  checkOwnership('id'),
  userController.getUserProfile
);

// Update user profile
router.put(
  '/:id',
  validateParams(userIdSchema),
  checkOwnership('id'),
  validateBody(updateProfileSchema),
  userController.updateUserProfile
);

// Delete user account
router.delete(
  '/:id',
  validateParams(userIdSchema),
  checkOwnership('id'),
  userController.deleteUserAccount
);

export default router;