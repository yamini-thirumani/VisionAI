// src/validators/testValidator.js

import Joi from 'joi';

/**
 * Validation schemas for test result endpoints
 */

// ========================================
// CREATE TEST RESULT VALIDATION
// ========================================

/**
 * Create test result validation schema
 */
export const createTestSchema = Joi.object({
  // Visual Acuity (required)
  visualAcuity: Joi.object({
    snellen: Joi.string()
      .pattern(/^20\/\d+$/)
      .required()
      .messages({
        'string.pattern.base': 'Snellen notation must be in format "20/XX"',
        'any.required': 'Snellen notation is required'
      }),
    
    logMAR: Joi.number()
      .min(-0.3)
      .max(2.0)
      .required()
      .messages({
        'number.min': 'LogMAR cannot be less than -0.3',
        'number.max': 'LogMAR cannot exceed 2.0',
        'any.required': 'LogMAR score is required'
      }),
    
    decimal: Joi.number()
      .min(0)
      .max(2)
      .optional(),
    
    accuracyPercentage: Joi.number()
      .min(0)
      .max(100)
      .optional()
  })
  .required(),
  
  // Classification (required)
  classification: Joi.string()
    .valid('normal', 'borderline', 'mild-myopia', 'moderate-myopia', 'severe-myopia')
    .required()
    .messages({
      'any.only': 'Classification must be one of: normal, borderline, mild-myopia, moderate-myopia, severe-myopia',
      'any.required': 'Classification is required'
    }),
  
  // Test Conditions (optional but recommended)
  testConditions: Joi.object({
    averageDistance: Joi.number()
      .min(30)
      .max(100)
      .optional()
      .messages({
        'number.min': 'Distance cannot be less than 30cm',
        'number.max': 'Distance cannot exceed 100cm'
      }),
    
    lightingLevel: Joi.number()
      .min(0)
      .max(300)
      .optional(),
    
    violations: Joi.array()
      .items(
        Joi.object({
          type: Joi.string()
            .valid('distance', 'lighting', 'posture', 'movement')
            .required(),
          count: Joi.number()
            .integer()
            .min(0)
            .default(1),
          timestamp: Joi.date()
            .default(Date.now)
        })
      )
      .max(10)  // Maximum 10 violations
      .optional()
      .messages({
        'array.max': 'Too many violations recorded (maximum 10)'
      }),
    
    headPosture: Joi.object({
      yaw: Joi.number().min(-45).max(45).optional(),
      pitch: Joi.number().min(-45).max(45).optional(),
      roll: Joi.number().min(-45).max(45).optional()
    })
    .optional()
  })
  .optional(),
  
  // Reliability Metrics (required)
  reliability: Joi.object({
    confidenceScore: Joi.number()
      .min(0)
      .max(100)
      .required()
      .messages({
        'number.min': 'Confidence score cannot be negative',
        'number.max': 'Confidence score cannot exceed 100',
        'any.required': 'Confidence score is required'
      }),
    
    consistencyScore: Joi.number()
      .min(0)
      .max(1)
      .optional(),
    
    averageResponseTime: Joi.number()
      .min(0)
      .optional()
  })
  .required(),
  
  // Individual Responses (optional)
  responses: Joi.array()
    .items(
      Joi.object({
        level: Joi.string()
          .pattern(/^20\/\d+$/)
          .required(),
        optotype: Joi.string()
          .length(1)
          .required(),
        userResponse: Joi.string()
          .length(1)
          .required(),
        correct: Joi.boolean()
          .required(),
        responseTime: Joi.number()
          .min(0)
          .required(),
        distance: Joi.number()
          .min(30)
          .max(100)
          .optional()
      })
    )
    .min(1)  // At least one response
    .optional()
    .messages({
      'array.min': 'At least one response is required'
    }),
  
  // Test Metadata (optional)
  testDuration: Joi.number()
    .min(0)
    .optional(),
  
  deviceInfo: Joi.object({
    userAgent: Joi.string().optional(),
    screenResolution: Joi.string().optional(),
    cameraResolution: Joi.string().optional()
  })
  .optional(),
  
  status: Joi.string()
    .valid('completed', 'incomplete', 'invalid')
    .default('completed')
    .optional(),
  
  notes: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
});

// ========================================
// TEST ID VALIDATION (for URL params)
// ========================================

/**
 * MongoDB ObjectId validation for test ID
 */
export const testIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid test ID format',
      'any.required': 'Test ID is required'
    })
});

// ========================================
// QUERY PARAMETERS VALIDATION
// ========================================

/**
 * Pagination and filtering validation
 */
export const testQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .messages({
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  sort: Joi.string()
    .valid('createdAt', '-createdAt', 'classification', '-classification')
    .default('-createdAt')
    .optional()
    .messages({
      'any.only': 'Sort must be one of: createdAt, -createdAt, classification, -classification'
    }),
  
  classification: Joi.string()
    .valid('normal', 'borderline', 'mild-myopia', 'moderate-myopia', 'severe-myopia')
    .optional(),
  
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be in ISO format'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))  // Must be after startDate
    .optional()
    .messages({
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    })
});