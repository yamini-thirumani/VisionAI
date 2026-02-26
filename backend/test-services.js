import 'dotenv/config';
import { connectDB, disconnectDB } from './src/config/database.js';
import * as authService from './src/services/authService.js';
import * as testService from './src/services/testService.js';
import User from './src/models/User.js';
import TestResult from './src/models/TestResult.js';

async function testServices() {
  try {
    await connectDB();
    console.log('\n🧪 Testing Services...\n');
    
    // ========================================
    // TEST 1: Register User
    // ========================================
    console.log('TEST 1: Register user');
    const registerResult = await authService.register({
      name: 'Service Test User',
      email: 'servicetest@visionai.com',
      password: 'TestPass123',
      age: 30
    });
    
    console.log('✅ User registered:', registerResult.user.name);
    console.log('✅ Token generated:', registerResult.token ? 'Yes' : 'No');
    
    const userId = registerResult.user.id;
    
    // ========================================
    // TEST 2: Login User
    // ========================================
    console.log('\nTEST 2: Login user');
    const loginResult = await authService.login(
      'servicetest@visionai.com',
      'TestPass123'
    );
    
    console.log('✅ Login successful:', loginResult.user.name);
    
    // ========================================
    // TEST 3: Create Test Result
    // ========================================
    console.log('\nTEST 3: Create test result');
    const testResult = await testService.createTestResult(userId, {
      visualAcuity: {
        snellen: '20/40',
        logMAR: 0.3,
        decimal: 0.5,
        accuracyPercentage: 85
      },
      classification: 'mild-myopia',
      testConditions: {
        averageDistance: 50,
        lightingLevel: 100,
        violations: []
      },
      reliability: {
        confidenceScore: 88,
        consistencyScore: 0.9,
        averageResponseTime: 2.5
      },
      responses: [
        {
          level: '20/200',
          optotype: 'E',
          userResponse: 'E',
          correct: true,
          responseTime: 2000,
          distance: 50
        }
      ],
      testDuration: 180
    });
    
    console.log('✅ Test created:', testResult._id);
    console.log('   Classification:', testResult.classification);
    console.log('   Is reliable:', testResult.isReliable());
    
    // ========================================
    // TEST 4: Get Test Statistics
    // ========================================
    console.log('\nTEST 4: Get test statistics');
    const stats = await testService.getUserTestStatistics(userId);
    
    console.log('✅ Statistics:');
    console.log('   Total tests:', stats.totalTests);
    console.log('   Avg confidence:', stats.avgConfidence);
    
    // ========================================
    // CLEANUP
    // ========================================
    console.log('\n🧹 Cleaning up...');
    await TestResult.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    
    await disconnectDB();
    console.log('\n✅ All service tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Service test failed:', error.message);
    console.error(error);
    await disconnectDB();
    process.exit(1);
  }
}

testServices();
