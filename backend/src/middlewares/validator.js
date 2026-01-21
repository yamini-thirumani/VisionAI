// src/middlewares/validator.js

import { ValidationError } from '../utils/errorTypes.js';

/**
 * Validation middleware factory
 * Creates middleware for validating request data
 * 
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {String} source - Where to get data from ('body', 'params', 'query')
 * @returns {Function} Express middleware
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    // Get data from specified source
    const dataToValidate = req[source];
    
    // Validate with Joi
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,  // Return all errors, not just first
      stripUnknown: true,  // Remove fields not in schema
      convert: true        // Convert types (e.g., "5" to 5)
    });
    
    // If validation fails
    if (error) {
      // Format Joi errors
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')  // Remove quotes from message
      }));
      
      // Throw ValidationError
      throw new ValidationError('Validation failed', errors);
    }
    
    // Replace original data with validated/sanitized data
    req[source] = value;
    
    // Move to next middleware
    next();
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate URL parameters
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => validate(schema, 'query');