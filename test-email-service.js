require('dotenv').config();
const EmailService = require('./src/services/email.service');

async function testEmailService() {
  console.log('🧪 Testing email service...');
  console.log('📧 Email config:');
  console.log('  Host:', process.env.EMAIL_HOST);
  console.log('  Port:', process.env.EMAIL_PORT);
  console.log('  Secure:', process.env.EMAIL_SECURE);
  console.log('  User:', process.env.EMAIL_USER);
  console.log('  Pass:', process.env.EMAIL_PASS ? '***' : 'NOT SET');
  
  const emailService = new EmailService();
  
  // Test connection
  console.log('📡 Testing email connection...');
  const connectionResult = await emailService.testConnection();
  
  if (!connectionResult) {
    console.log('❌ Email connection failed!');
    return;
  }
  
  console.log('✅ Email connection successful!');
  
  // Test sending verification email
  console.log('📧 Testing verification email...');
  try {
    const result = await emailService.sendVerificationEmail(
      'test@example.com',
      'Test User',
      'test_verification_token_123',
      'doctor'
    );
    console.log('✅ Test verification email sent:', result);
  } catch (error) {
    console.log('❌ Failed to send verification email:', error.message);
  }
  
  // Test sending welcome email
  console.log('🎉 Testing welcome email...');
  try {
    const result = await emailService.sendWelcomeEmail(
      'test@example.com',
      'Test User',
      'doctor'
    );
    console.log('✅ Test welcome email sent:', result);
  } catch (error) {
    console.log('❌ Failed to send welcome email:', error.message);
  }
}

testEmailService().catch(console.error);
