
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};


const VISION_CONSTANTS = {
  SNELLEN_LEVELS: ['20/200', '20/150', '20/100', '20/70', '20/50', '20/40', '20/30', '20/25', '20/20'],
  
  CLASSIFICATIONS: {
    NORMAL: 'normal',
    BORDERLINE: 'borderline',
    MILD_MYOPIA: 'mild-myopia',
    MODERATE_MYOPIA: 'moderate-myopia',
    SEVERE_MYOPIA: 'severe-myopia'
  },
  
  DISTANCE_RANGE: {
    MIN: 30,  // cm
    MAX: 100,
    OPTIMAL_MIN: 40,
    OPTIMAL_MAX: 60
  },
  
  LIGHTING_RANGE: {
    MIN: 50,  // lux
    MAX: 150,
    OPTIMAL: 100
  },
  
  RELIABILITY_THRESHOLD: 70  // Minimum confidence score
};

// User Roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Validation Constants
const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  AGE_MIN: 5,
  AGE_MAX: 120
};

// Rate Limiting
const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
};

export{
  HTTP_STATUS,
  VISION_CONSTANTS,
  USER_ROLES,
  VALIDATION,
  RATE_LIMIT
};