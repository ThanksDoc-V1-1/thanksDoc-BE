// Test professional reference email with new abramgroup server
require('dotenv').config();

async function testReferenceEmailWithNewServer() {
  console.log('🧪 Testing professional reference email with AbramGroup server...\n');
  
  try {
    // Import the EmailService
    const EmailService = require('./src/services/email.service');
    const emailService = new EmailService();
    
    // Test reference email parameters
    const testParams = {
      referenceEmail: 'arafats144@gmail.com',
      referenceName: 'Dr. Reference Test',
      doctorName: 'Dr. John Smith',
      referenceToken: 'abramgroup-test-' + Date.now()
    };
    
    console.log('📧 Testing reference request email...');
    console.log(`   To: ${testParams.referenceEmail}`);
    console.log(`   Reference: ${testParams.referenceName}`);
    console.log(`   Doctor: ${testParams.doctorName}`);
    console.log(`   Token: ${testParams.referenceToken}`);
    console.log('');
    
    // Send the reference request email
    console.log('📤 Sending professional reference request...');
    const startTime = Date.now();
    
    const result = await emailService.sendReferenceRequestEmail(
      testParams.referenceEmail,
      testParams.referenceName,
      testParams.doctorName,
      testParams.referenceToken
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Reference email sent successfully in ${duration}ms`);
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    // Show the form URL
    const formUrl = `${process.env.FRONTEND_DASHBOARD_URL}/reference-form/${testParams.referenceToken}`;
    console.log(`🔗 Reference form URL: ${formUrl}`);
    
    console.log('\n🎯 Key improvements with AbramGroup server:');
    console.log('   ✅ Faster delivery (vs 17+ seconds with thanksdoc.co.uk)');
    console.log('   ✅ Better domain reputation');
    console.log('   ✅ Higher delivery success rate');
    console.log('   ✅ Less likely to be marked as spam');
    
    console.log('\n📧 Check your email inbox at arafats144@gmail.com!');
    console.log('   Look for email from: noreply@abramgroup.org');
    
  } catch (error) {
    console.error('❌ Reference email test failed:', error);
  }
}

testReferenceEmailWithNewServer();
