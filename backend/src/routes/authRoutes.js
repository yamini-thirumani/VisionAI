// src/routes/authRoutes.js

import express from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validator.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema
} from '../validators/authValidator.js';

const router = express.Router();

/**
 * Auth Routes
 * Base path: /api/auth
 */

// Public routes
router.post(
  '/register',
  validateBody(registerSchema),
  authController.register
);

router.post(
  '/login',
  validateBody(loginSchema),
  authController.login
);

// Protected routes
router.get(
  '/me',
  protect,
  authController.getCurrentUser
);

router.post(
  '/logout',
  protect,
  authController.logout
);

router.patch(
  '/password',
  protect,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;