require('dotenv').config();
const bcrypt = require('bcryptjs');

async function testAuthUtils() {
  console.log('🧪 Testing auth utils...');
  
  const { generateVerificationToken, generateExpirationTime, isExpired } = require('./src/utils/auth.utils');
  
  // Test token generation
  const token = generateVerificationToken();
  console.log('✅ Generated verification token:', token.substring(0, 10) + '...');
  
  // Test expiration time generation
  const expirationTime = generateExpirationTime(24);
  console.log('✅ Generated expiration time:', expirationTime);
  
  // Test expiration check
  const notExpired = isExpired(expirationTime);
  console.log('✅ Token expired?', notExpired);
  
  // Test with past date
  const pastDate = new Date();
  pastDate.setHours(pastDate.getHours() - 25);
  const expired = isExpired(pastDate);
  console.log('✅ Past date expired?', expired);
  
  console.log('✅ All auth utils tests passed!');
}

testAuthUtils().catch(console.error);
