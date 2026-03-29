// src/validators/testValidator.js

import Joi from 'joi';

/**
 * Validation schemas for test result endpoints
 */

// ========================================
// CREATE TEST RESULT VALIDATION
// ========================================

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

  visualAcuityByEye: Joi.object({
    right: Joi.object({
      snellen: Joi.string().pattern(/^20\/\d+$/).required(),
      logMAR: Joi.number().min(-0.3).max(2).required(),
      decimal: Joi.number().min(0).max(2).optional(),
      accuracyPercentage: Joi.number().min(0).max(100).optional()
    }).required(),
    left: Joi.object({
      snellen: Joi.string().pattern(/^20\/\d+$/).required(),
      logMAR: Joi.number().min(-0.3).max(2).required(),
      decimal: Joi.number().min(0).max(2).optional(),
      accuracyPercentage: Joi.number().min(0).max(100).optional()
    }).required()
  }).optional(),

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
      .min(20)
      .max(150)
      .optional()
      .messages({
        'number.min': 'Distance cannot be less than 20cm',
        'number.max': 'Distance cannot exceed 150cm'
      }),

    lightingLevel: Joi.number()
      .min(0)
      .max(300)
      .optional(),

    // FIX 1: Added lightingQuality field that frontend sends
    lightingQuality: Joi.string()
      .valid('OPTIMAL', 'TOO_DARK', 'TOO_BRIGHT', 'GLARE_DETECTED', 'UNKNOWN')
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
          durationSeconds: Joi.number()
            .min(0)
            .optional(),
          reason: Joi.string().max(500).optional().allow(''),
          timestamp: Joi.date()
            .default(Date.now)
        })
      )
      .max(80)
      .optional()
      .messages({
        'array.max': 'Too many violations recorded (maximum 80)'
      }),

    glassesDetected: Joi.boolean()
      .optional(),

    testMode: Joi.string()
      .valid('monocular', 'binocular')
      .optional(),

    distanceCalibrationSource: Joi.string()
      .valid('device_or_profile', 'session_opt_out', 'default_estimate')
      .optional(),

    headPosture: Joi.object({
      yaw: Joi.number().min(-45).max(45).optional(),
      pitch: Joi.number().min(-45).max(45).optional(),
      roll: Joi.number().min(-45).max(45).optional()
    })
    .optional()
  })
  .optional(),

  // Reliability Metrics (required)
  // FIX 2: Added pauses array that frontend sends inside reliability
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
      .optional(),

    pauses: Joi.array()
      .items(
        Joi.object({
          reason: Joi.string().optional(),
          durationSeconds: Joi.number().min(0).optional()
        })
      )
      .optional()
  })
  .required(),

  // Individual Responses (optional)
  // FIX 3: userResponse changed from length(1) to max(10)
  //         because Tumbling E answers are words: 'right','left','up','down'
  // FIX 4: distance min lowered to 20 to handle edge cases near camera
  responses: Joi.array()
    .items(
      Joi.object({
        level: Joi.string()
          .pattern(/^20\/\d+$/)
          .required(),
        optotype: Joi.string()
          .max(5)
          .required(),
        userResponse: Joi.string()
          .max(10)
          .allow('')
          .required(),
        correct: Joi.boolean()
          .required(),
        responseTime: Joi.number()
          .min(0)
          .required(),
        distance: Joi.number()
          .min(20)
          .max(150)
          .optional(),
        eye: Joi.string()
          .valid('right', 'left', 'both')
          .optional()
      })
    )
    .min(1)
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
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    })
});