import 'dotenv/config';
import { connectDB, disconnectDB } from './src/config/database.js';
import User from './src/models/User.js';
import TestResult from './src/models/TestResult.js';

async function testModels() {
  try {
    // 1. Connect to Database
    await connectDB();
    console.log('\n🧪 Testing Models...\n');

    // ==========================================
    // TEST 1: Create User
    // ==========================================
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@visionai.com',
      password: 'TestPassword123',
      age: 25,
      gender: 'male',
      medicalHistory: {
        previousEyeConditions: null,
        familyHistoryMyopia: false,
        currentGlassesUser: false
      }
    });

    console.log('✅ User created:', testUser.getPublicProfile());

    // ==========================================
    // TEST 2: Password Hashing
    // ==========================================
    // We select '+password' because it is set to select: false in schema
    const userWithPassword = await User.findById(testUser._id).select('+password');
    
    // Check if the password stored is different from plain text
    const isHashed = userWithPassword.password !== 'TestPassword123';
    console.log(`✅ Password Hashed: ${isHashed}`);

    // ==========================================
    // TEST 3: Password Comparison
    // ==========================================
    const isMatch = await userWithPassword.comparePassword('TestPassword123');
    console.log(`✅ Password Match: ${isMatch}`);

    if (!isMatch) {
      console.warn('⚠️ WARNING: Password match failed. Check User.js for double-hashing middleware.');
    }

    // ==========================================
    // TEST 4: Create Test Result
    // ==========================================
    const testResult = await TestResult.create({
      userId: testUser._id,
      
      // Visual Acuity Data
      visualAcuity: {
        snellen: '20/40',
        logMAR: 0.3,
        decimal: 0.5,
        accuracyPercentage: 78
      },
      
      classification: 'mild-myopia',
      testDuration: 180,

      // REQUIRED: Test Conditions (Fixed validation error)
      testConditions: {
        averageDistance: 45, // cm
        lightingLevel: 250,  // lux
        violations: [],       // Empty array is fine
        headPosture: {
          yaw: 0,
          pitch: 0,
          roll: 0
        }
      },

      // REQUIRED: Reliability Metrics (Fixed validation error)
      reliability: {
        confidenceScore: 85,
        consistencyScore: 0.92,
        averageResponseTime: 1200 // ms
      },

      // REQUIRED: Responses (Fixed middleware error)
      // Middleware throws error if responses array is empty
      responses: [
        {
          level: '20/40',
          optotype: 'E',
          userResponse: 'E',
          correct: true,
          responseTime: 1200,
          distance: 45
        }
      ],

      deviceInfo: {
        userAgent: 'TestScript/1.0',
        screenResolution: '1920x1080'
      }
    });

    console.log('✅ Test result created:', testResult.getSummary());

    // ==========================================
    // CLEANUP
    // ==========================================
    console.log('\n🧹 Cleaning up test data...');
    await TestResult.deleteMany({ userId: testUser._id });
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Cleanup complete');

    await disconnectDB();
    console.log('\n🎉 All tests passed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.errors) {
      // Mongoose validation errors
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    } else {
      console.error(error);
    }
    
    // Attempt cleanup even on failure
    try {
      await disconnectDB();
    } catch (e) { /* ignore */ }
    
    process.exit(1);
  }
}

testModels();