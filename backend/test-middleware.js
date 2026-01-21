// test-middleware.js

import 'dotenv/config';
import { generateToken, verifyToken } from './src/config/jwt.js';
import { ValidationError, AuthenticationError } from './src/utils/errorTypes.js';

console.log('🧪 Testing Middleware Components...\n');

// ========================================
// TEST 1: JWT Token Generation
// ========================================
console.log('TEST 1: JWT token generation');
const token = generateToken({ userId: '123', role: 'user' });
console.log('Token generated:', token ? '✅' : '❌');
console.log('Token length:', token.length, 'characters');

// ========================================
// TEST 2: JWT Token Verification
// ========================================
console.log('\nTEST 2: JWT token verification');
try {
  const decoded = verifyToken(token);
  console.log('Token verified:', '✅');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('Token verification failed:', '❌');
  console.log(error.message);
}

// ========================================
// TEST 3: Invalid Token
// ========================================
console.log('\nTEST 3: Invalid token handling');
try {
  verifyToken('invalid-token');
  console.log('Should have failed:', '❌');
} catch (error) {
  console.log('Correctly caught invalid token:', '✅');
  console.log('Error:', error.message);
}

// ========================================
// TEST 4: Custom Error Classes
// ========================================
console.log('\nTEST 4: Custom error classes');
try {
  throw new ValidationError('Test validation error', [
    { field: 'email', message: 'Invalid email' }
  ]);
} catch (error) {
  console.log('ValidationError created:', error.isOperational ? '✅' : '❌');
  console.log('Status code:', error.statusCode);
  console.log('Has errors array:', error.errors ? '✅' : '❌');
}

try {
  throw new AuthenticationError('Test auth error');
} catch (error) {
  console.log('AuthenticationError created:', error.isOperational ? '✅' : '❌');
  console.log('Status code:', error.statusCode);
}

console.log('\n✅ Middleware component tests complete!\n');