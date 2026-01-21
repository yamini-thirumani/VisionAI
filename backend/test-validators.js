// test-validators.js

import { registerSchema, loginSchema } from './src/validators/authValidator.js';
import { createTestSchema } from './src/validators/testValidator.js';

console.log('🧪 Testing Validators...\n');

// ========================================
// TEST 1: Valid Registration
// ========================================
console.log('TEST 1: Valid registration data');
const validRegister = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25
};

const { error: error1, value: value1 } = registerSchema.validate(validRegister);
console.log(error1 ? '❌ Failed' : '✅ Passed');
if (error1) console.log(error1.details);

// ========================================
// TEST 2: Invalid Registration
// ========================================
console.log('\nTEST 2: Invalid registration data');
const invalidRegister = {
  name: 'J',  // Too short
  email: 'not-an-email',
  password: '123',  // Too short, no uppercase, no letters
  age: -5  // Negative
};

const { error: error2 } = registerSchema.validate(invalidRegister, { abortEarly: false });
console.log(error2 ? '✅ Caught errors' : '❌ Should have failed');
if (error2) {
  console.log('Errors found:');
  error2.details.forEach(err => {
    console.log(`  - ${err.path.join('.')}: ${err.message}`);
  });
}

// ========================================
// TEST 3: Valid Login
// ========================================
console.log('\nTEST 3: Valid login data');
const validLogin = {
  email: 'test@example.com',
  password: 'anything'
};

const { error: error3 } = loginSchema.validate(validLogin);
console.log(error3 ? '❌ Failed' : '✅ Passed');

// ========================================
// TEST 4: Test Result Validation
// ========================================
console.log('\nTEST 4: Valid test result');
const validTest = {
  visualAcuity: {
    snellen: '20/40',
    logMAR: 0.3
  },
  classification: 'mild-myopia',
  reliability: {
    confidenceScore: 87
  }
};

const { error: error4 } = createTestSchema.validate(validTest);
console.log(error4 ? '❌ Failed' : '✅ Passed');

// ========================================
// TEST 5: Strip Unknown Fields
// ========================================
console.log('\nTEST 5: Strip unknown fields');
const dataWithExtra = {
  email: 'test@example.com',
  password: 'Password123',
  hackField: 'malicious data'
};

const { value: value5 } = loginSchema.validate(dataWithExtra, { stripUnknown: true });
console.log('Has hackField?', 'hackField' in value5 ? '❌' : '✅ Stripped');
console.log('Cleaned data:', value5);

console.log('\n✅ Validator tests complete!\n');