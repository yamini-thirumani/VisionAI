// src/validators/userValidator.js

import Joi from 'joi';

/**
 * Validation schemas for user endpoints
 */

// ========================================
// UPDATE PROFILE VALIDATION
// ========================================

/**
 * Update user profile validation schema
 * All fields are optional (partial update)
 */
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  
  age: Joi.number()
    .integer()
    .min(5)
    .max(120)
    .optional()
    .messages({
      'number.integer': 'Age must be a whole number',
      'number.min': 'Age must be at least 5',
      'number.max': 'Age cannot exceed 120'
    }),
  
  gender: Joi.string()
    .valid('male', 'female', 'other', 'prefer-not-to-say')
    .lowercase()
    .optional()
    .messages({
      'any.only': 'Gender must be one of: male, female, other, prefer-not-to-say'
    }),
  
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]+$/)
    .optional()
    .allow(null, '')  // Allow removing phone
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  medicalHistory: Joi.object({
    previousEyeConditions: Joi.string()
      .max(500)
      .optional()
      .allow(null, '')
      .messages({
        'string.max': 'Previous eye conditions description cannot exceed 500 characters'
      }),
    
    familyHistoryMyopia: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Family history of myopia must be true or false'
      }),
    
    currentGlassesUser: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Current glasses user must be true or false'
      }),
    
    lastEyeExamDate: Joi.date()
      .max('now')  // Cannot be in future
      .optional()
      .allow(null)
      .messages({
        'date.base': 'Last eye exam date must be a valid date',
        'date.max': 'Last eye exam date cannot be in the future'
      })
  })
  .optional(),

  calibration: Joi.object({
    K: Joi.number()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'number.base': 'Calibration constant K must be a number',
        'number.min': 'Calibration constant K seems too small',
        'number.max': 'Calibration constant K seems too large',
        'any.required': 'Calibration constant K is required'
      })
  }).optional()
})
.min(1)  // At least one field must be provided
.messages({
  'object.min': 'At least one field must be provided for update'
});

// ========================================
// USER ID VALIDATION (for URL params)
// ========================================

/**
 * MongoDB ObjectId validation
 */
export const userIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)  // MongoDB ObjectId format
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
});