// src/models/TestResult.js

import mongoose from 'mongoose';

/**
 * TestResult Schema
 * Stores vision test results and conditions
 */
const testResultSchema = new mongoose.Schema({
  // ========================================
  // REFERENCE TO USER
  // ========================================
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // References User model
    required: [true, 'User ID is required'],
    index: true
  },
  
  // ========================================
  // VISUAL ACUITY RESULTS
  // ========================================
  
  visualAcuity: {
    snellen: {
      type: String,
      required: [true, 'Snellen notation is required'],
      match: [/^20\/\d+$/, 'Invalid Snellen format (e.g., 20/40)'],
      trim: true
    },
    
    logMAR: {
      type: Number,
      required: [true, 'LogMAR score is required'],
      min: [-0.3, 'LogMAR cannot be less than -0.3'],
      max: [2.0, 'LogMAR cannot exceed 2.0']
    },
    
    decimal: {
      type: Number,
      min: [0, 'Decimal value cannot be negative'],
      max: [2, 'Decimal value cannot exceed 2']
    },
    
    accuracyPercentage: {
      type: Number,
      min: [0, 'Accuracy cannot be negative'],
      max: [100, 'Accuracy cannot exceed 100'],
      default: 0
    }
  },
  
  // ========================================
  // TEST CLASSIFICATION
  // ========================================
  
  classification: {
    type: String,
    required: [true, 'Classification is required'],
    enum: {
      values: [
        'normal',
        'borderline',
        'mild-myopia',
        'moderate-myopia',
        'severe-myopia'
      ],
      message: '{VALUE} is not a valid classification'
    },
 
  },
  
  // ========================================
  // TESTING CONDITIONS
  // ========================================
  
  testConditions: {
    averageDistance: {
      type: Number,
      required: [true, 'Average distance is required'],
      min: [20, 'Distance cannot be less than 20cm'],
      max: [150, 'Distance cannot exceed 150cm']
    },
    
    lightingLevel: {
      type: Number,
      min: [0, 'Lighting level cannot be negative'],
      max: [300, 'Lighting level cannot exceed 300 lux']
    },

    lightingQuality: {
      type: String,
      enum: ['OPTIMAL', 'TOO_DARK', 'TOO_BRIGHT', 'GLARE_DETECTED', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    
    violations: [{
      type: {
        type: String,
        enum: ['distance', 'lighting', 'posture', 'movement'],
        required: true
      },
      count: {
        type: Number,
        min: 0,
        default: 1
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    
    headPosture: {
      yaw: {
        type: Number,
        min: -45,
        max: 45
      },
      pitch: {
        type: Number,
        min: -45,
        max: 45
      },
      roll: {
        type: Number,
        min: -45,
        max: 45
      }
    }
  },
  
  // ========================================
  // RELIABILITY METRICS
  // ========================================
  
  reliability: {
    confidenceScore: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence score cannot be negative'],
      max: [100, 'Confidence score cannot exceed 100']
    },
    
    consistencyScore: {
      type: Number,
      min: [0, 'Consistency score cannot be negative'],
      max: [1, 'Consistency score cannot exceed 1']
    },
    
    averageResponseTime: {
      type: Number,
      min: [0, 'Response time cannot be negative']
    }
  },
  
  // ========================================
  // INDIVIDUAL RESPONSES (for analysis)
  // ========================================
  
  responses: [{
    level: {
      type: String,
      required: true,
      match: /^20\/\d+$/
    },
    optotype: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1
    },
    userResponse: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1
    },
    correct: {
      type: Boolean,
      required: true
    },
    responseTime: {
      type: Number,
      required: true,
      min: 0
    },
    distance: {
      type: Number,
      min: 20,
      max: 150
    }
  }],
  
  // ========================================
  // TEST METADATA
  // ========================================
  
  testDuration: {
    type: Number,
    min: [0, 'Test duration cannot be negative']
  },
  
  deviceInfo: {
    userAgent: String,
    screenResolution: String,
    cameraResolution: String
  },
  
  status: {
    type: String,
    enum: ['completed', 'incomplete', 'invalid'],
    default: 'completed'
  },
  
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
  
}, {
  timestamps: true,  // createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========================================
// INDEXES for Query Optimization
// ========================================

// Compound index for user's tests sorted by date
testResultSchema.index({ userId: 1, createdAt: -1 });

// Index for filtering by classification
testResultSchema.index({ userId: 1, classification: 1 });
// Index for date range queries
testResultSchema.index({ createdAt: -1 });


// ========================================
// VIRTUAL PROPERTIES
// ========================================

/**
 * Format test date in readable format
 */
testResultSchema.virtual('testDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

/**
 * Get time since test
 */
testResultSchema.virtual('timeSinceTest').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

/**
 * Check if test is recent (within last 30 days)
 */
testResultSchema.virtual('isRecent').get(function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.createdAt >= thirtyDaysAgo;
});

// ========================================
// INSTANCE METHODS
// ========================================

testResultSchema.methods.isReliable = function() {
  return (
    this.reliability.confidenceScore >= 70 &&
    this.testConditions.violations.length < 3 &&
    this.status === 'completed'
  );
};


testResultSchema.methods.getSummary = function() {
  return {
    id: this._id,
    date: this.testDate,
    snellen: this.visualAcuity.snellen,
    classification: this.classification,
    reliable: this.isReliable(),
    confidenceScore: this.reliability.confidenceScore
  };
};

/**
 * Calculate overall test quality score (0-100)
 * 
 */
testResultSchema.methods.calculateQualityScore = function() {
  const weights = {
    confidence: 0.4,
    violations: 0.3,
    consistency: 0.2,
    duration: 0.1
  };
  
  // Confidence score (0-100)
  const confidenceComponent = this.reliability.confidenceScore * weights.confidence;
  
  // Violations score (fewer is better)
  const violationsScore = Math.max(0, 100 - (this.testConditions.violations.length * 20));
  const violationsComponent = violationsScore * weights.violations;
  
  // Consistency score (0-1 to 0-100)
  const consistencyComponent = (this.reliability.consistencyScore || 0) * 100 * weights.consistency;
  
  // Duration score (ideal: 120-240 seconds)
  let durationScore = 100;
  if (this.testDuration < 60) durationScore = 50;  // Too fast
  if (this.testDuration > 300) durationScore = 70; // Too slow
  const durationComponent = durationScore * weights.duration;
  
  return Math.round(
    confidenceComponent +
    violationsComponent +
    consistencyComponent +
    durationComponent
  );
};

/**
 * Get recommendations based on test result
 * 
 */
testResultSchema.methods.getRecommendations = function() {
  const recommendations = [];
  
  // Based on classification
  switch (this.classification) {
    case 'severe-myopia':
    case 'moderate-myopia':
      recommendations.push('Schedule a comprehensive eye examination as soon as possible');
      recommendations.push('Avoid straining your eyes with prolonged screen time');
      break;
    case 'mild-myopia':
      recommendations.push('Consider consulting an eye care professional');
      recommendations.push('Monitor your vision regularly');
      break;
    case 'borderline':
      recommendations.push('Retest in 3-6 months');
      recommendations.push('Practice good eye health habits');
      break;
    case 'normal':
      recommendations.push('Your vision appears normal');
      recommendations.push('Continue regular eye check-ups');
      break;
  }
  
  // Based on reliability
  if (!this.isReliable()) {
    recommendations.push('Consider retaking the test in better conditions');
  }
  
  // Based on violations
  if (this.testConditions.violations.length > 0) {
    recommendations.push('Ensure proper lighting and distance in future tests');
  }
  
  return recommendations;
};

// ========================================
// STATIC METHODS
// ========================================


testResultSchema.statics.getLatestTest = function(userId) {
  return this.findOne({ userId })
    .sort({ createdAt: -1 })
    .exec();
};


testResultSchema.statics.getUserTestCount = function(userId) {
  return this.countDocuments({ userId });
};


testResultSchema.statics.getTestsByClassification = function(userId, classification) {
  return this.find({ userId, classification })
    .sort({ createdAt: -1 })
    .exec();
};


testResultSchema.statics.getTestsInDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .sort({ createdAt: -1 })
  .exec();
};


testResultSchema.statics.getReliableTests = function(userId) {
  return this.find({
    userId,
    'reliability.confidenceScore': { $gte: 70 },
    status: 'completed'
  })
  .sort({ createdAt: -1 })
  .exec();
};

/**
 * Calculate user's average visual acuity

 */
testResultSchema.statics.getAverageAcuity = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        avgLogMAR: { $avg: '$visualAcuity.logMAR' },
        avgAccuracy: { $avg: '$visualAcuity.accuracyPercentage' },
        avgConfidence: { $avg: '$reliability.confidenceScore' },
        testCount: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || null;
};

// ========================================
// MIDDLEWARE
// ========================================

/**
 * PRE-SAVE: Validate test conditions
 */
testResultSchema.pre('save', function() {
  // Validate violations
  if (this.testConditions.violations.length > 10) {
    throw new Error('Test has too many violations - may be invalid');
  }
  
  // Validate responses
  if (this.responses.length === 0) {
    throw new Error('Test must have at least one response');
  }
  
});

/**
 * POST-SAVE: Log test creation
 */
testResultSchema.post('save', function(doc) {
  console.log(`New test result saved: ${doc._id} for user: ${doc.userId}`);
});

// ========================================
// MODEL EXPORT
// ========================================

export default mongoose.model('TestResult', testResultSchema);