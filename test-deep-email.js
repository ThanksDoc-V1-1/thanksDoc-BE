// Deep dive email testing with full error logging
require('dotenv').config();

async function deepTestEmailSending() {
  console.log('🔍 Deep testing email sending process...\n');
  
  try {
    // Import the exact same EmailService used by the system
    const EmailService = require('./src/services/email.service');
    
    console.log('📧 Testing with exact EmailService used by the system...');
    
    // Create new instance (same as in professional-reference-submission service)
    const emailService = new EmailService();
    
    // Test parameters matching your test case
    const testParams = {
      referenceEmail: 'arafats144@gmail.com',
      referenceName: 'TRY AGAIN',
      doctorName: 'Dr. Test',
      referenceToken: 'test-token-' + Date.now()
    };
    
    console.log('🧪 Test parameters:');
    console.log(`   Reference Email: ${testParams.referenceEmail}`);
    console.log(`   Reference Name: ${testParams.referenceName}`);
    console.log(`   Doctor Name: ${testParams.doctorName}`);
    console.log(`   Token: ${testParams.referenceToken}`);
    console.log('');
    
    // Check environment variables
    console.log('🌐 Environment check:');
    console.log(`   FRONTEND_DASHBOARD_URL: ${process.env.FRONTEND_DASHBOARD_URL}`);
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    console.log('');
    
    // Send email using the exact same method
    console.log('📤 Calling sendReferenceRequestEmail method...');
    const startTime = Date.now();
    
    try {
      const result = await emailService.sendReferenceRequestEmail(
        testParams.referenceEmail,
        testParams.referenceName,
        testParams.doctorName,
        testParams.referenceToken
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Email sending completed in ${duration}ms`);
      console.log('📊 Result:', JSON.stringify(result, null, 2));
      
      // Verify the email content URL
      const expectedUrl = `${process.env.FRONTEND_DASHBOARD_URL}/reference-form/${testParams.referenceToken}`;
      console.log(`🔗 Reference form URL: ${expectedUrl}`);
      
      console.log('\n📧 Email should arrive at arafats144@gmail.com');
      console.log('   Check your inbox and spam folder!');
      
    } catch (emailError) {
      console.error('❌ Email sending failed!');
      console.error('   Error message:', emailError.message);
      console.error('   Error code:', emailError.code);
      console.error('   Error stack:', emailError.stack);
      
      // Check specific error types
      if (emailError.message.includes('ETIMEDOUT')) {
        console.log('💡 Network timeout - check internet connection');
      } else if (emailError.message.includes('EAUTH')) {
        console.log('💡 Authentication error - check email credentials');
      } else if (emailError.message.includes('ENOTFOUND')) {
        console.log('💡 Host not found - check email server settings');
      }
    }
    
  } catch (setupError) {
    console.error('❌ Setup error:', setupError);
    console.error('   Stack:', setupError.stack);
  }
}

deepTestEmailSending();
