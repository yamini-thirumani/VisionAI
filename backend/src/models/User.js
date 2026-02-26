import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const userSchema = new mongoose.Schema({
  // ========================================
  // AUTHENTICATION FIELDS
  // ========================================
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false  // Don't return password in queries by default
  },
  
  // ========================================
  // PERSONAL INFORMATION
  // ========================================
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  age: {
    type: Number,
    min: [5, 'Age must be at least 5 years'],
    max: [120, 'Age cannot exceed 120 years']
  },
  
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'other', 'prefer-not-to-say'],
      message: '{VALUE} is not a valid gender option'
    },
    lowercase: true
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  
  // ========================================
  // MEDICAL HISTORY (Optional)
  // ========================================
  
  medicalHistory: {
    previousEyeConditions: {
      type: String,
      default: null
    },
    
    familyHistoryMyopia: {
      type: Boolean,
      default: false
    },
    
    currentGlassesUser: {
      type: Boolean,
      default: false
    },
    
    lastEyeExamDate: {
      type: Date,
      default: null
    }
  },
  
  // ========================================
  // SYSTEM FIELDS
  // ========================================
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLoginAt: {
    type: Date,
    default: null
  },

  // ========================================
  // DEVICE CALIBRATION (Optional)
  // ========================================

  calibration: {
    K: {
      type: Number,
      min: [10, 'Calibration constant K seems too small'],
      max: [1000, 'Calibration constant K seems too large']
    },
    lastCalibratedAt: {
      type: Date,
      default: null
    }
  }
  
}, 
{
  timestamps: true,  
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========================================
// INDEXES for Query Performance
// ========================================

userSchema.index({ isActive: 1 });

// ========================================
// MIDDLEWARE - Runs automatically
// ========================================




/**
 * PRE-SAVE MIDDLEWARE
 * Ensure email is lowercase (case-insensitive login)
 */
userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
});





// ========================================
// INSTANCE METHODS
// Methods available on each user document
// ========================================


userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Get public profile (remove sensitive fields)
 * @returns {Object} - Safe user object
 */
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.__v;
  
  return userObject;
};

/**
 * Check if user can take test (active account)
 * @returns {Boolean}
 */
userSchema.methods.canTakeTest = function() {
  return this.isActive;
};

// ========================================
// STATIC METHODS
// Methods available on User model itself
// ========================================

/**
 * Find user by email
 * @param {String} email
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};


userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

/**
 * Get user with password (for authentication)
 * @param {String} email
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// ========================================
// VIRTUAL PROPERTIES
// Computed fields not stored in database
// ========================================

/**
 * Get user's full test count (will be populated from TestResult)
 */
userSchema.virtual('testCount', {
  ref: 'TestResult',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

/**
 * Format account age
 */
userSchema.virtual('accountAge').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
});

// ========================================
// CUSTOM VALIDATION
// ========================================

/**
 * Validate age range based on medical history
 */
userSchema.path('age').validate(function(value) {
  // If user has glasses, they should be at least 5 years old
  if (this.medicalHistory?.currentGlassesUser && value < 5) {
    return false;
  }
  return true;
}, 'Age seems inconsistent with medical history');


export default mongoose.model('User', userSchema);
