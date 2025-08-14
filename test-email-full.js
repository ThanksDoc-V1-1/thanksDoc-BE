// Detailed email sending test - trace the full process
require('dotenv').config();

async function testFullEmailProcess() {
  const strapi = require('./src/index');
  
  console.log('🧪 Testing full email process with detailed logging...\n');
  
  try {
    // Import EmailService
    const EmailService = require('./src/services/email.service');
    const emailService = new EmailService();
    
    console.log('📧 Email service initialized');
    
    // Test email parameters
    const testParams = {
      referenceEmail: 'arafats144@gmail.com', // Change to your email
      referenceName: 'Test Reference',
      doctorName: 'Dr. Test Doctor',
      referenceToken: 'test-token-' + Date.now()
    };
    
    console.log('🔍 Test parameters:');
    console.log('   Reference email:', testParams.referenceEmail);
    console.log('   Reference name:', testParams.referenceName);
    console.log('   Doctor name:', testParams.doctorName);
    console.log('   Token:', testParams.referenceToken);
    console.log('');
    
    // Test the email sending directly
    console.log('📤 Sending test email...');
    const emailStart = Date.now();
    
    try {
      const result = await emailService.sendReferenceRequestEmail(
        testParams.referenceEmail,
        testParams.referenceName,
        testParams.doctorName,
        testParams.referenceToken
      );
      
      const emailEnd = Date.now();
      console.log(`✅ Email sent successfully in ${emailEnd - emailStart}ms`);
      console.log('📧 Email result:', result);
      
      // Check if the email content looks correct
      const expectedUrl = `${process.env.FRONTEND_DASHBOARD_URL}/reference-form/${testParams.referenceToken}`;
      console.log('🔗 Expected form URL:', expectedUrl);
      
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('❌ Error details:', emailError.message);
      console.error('❌ Stack trace:', emailError.stack);
    }
    
    console.log('\n🔍 Environment variables check:');
    console.log('   EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('   EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('   EMAIL_SECURE:', process.env.EMAIL_SECURE);
    console.log('   EMAIL_USER:', process.env.EMAIL_USER);
    console.log('   EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('   FRONTEND_DASHBOARD_URL:', process.env.FRONTEND_DASHBOARD_URL);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('❌ Error stack:', error.stack);
  }
}

// Run the test
testFullEmailProcess();
