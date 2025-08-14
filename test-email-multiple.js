// Test multiple email sending (like the actual reference submission)
require('dotenv').config();

async function testMultipleEmails() {
  console.log('🧪 Testing multiple email sending simulation...\n');
  
  try {
    // Import EmailService
    const EmailService = require('./src/services/email.service');
    const emailService = new EmailService();
    
    // Simulate multiple references (like the real scenario)
    const references = [
      {
        email: 'arafats144@gmail.com',
        firstName: 'Reference',
        lastName: 'One',
        token: 'token-1-' + Date.now()
      },
      {
        email: 'arafats144@gmail.com', // Same email for testing
        firstName: 'Reference', 
        lastName: 'Two',
        token: 'token-2-' + Date.now()
      }
    ];
    
    const doctorName = 'Dr. Test Doctor';
    const results = [];
    
    console.log(`📤 Sending emails to ${references.length} references sequentially...\n`);
    
    // Process sequentially (like in the actual code)
    for (let i = 0; i < references.length; i++) {
      const reference = references[i];
      console.log(`📧 Sending email ${i + 1}/${references.length} to: ${reference.email}`);
      
      const startTime = Date.now();
      
      try {
        const emailResult = await emailService.sendReferenceRequestEmail(
          reference.email,
          reference.firstName + ' ' + reference.lastName,
          doctorName,
          reference.token
        );
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ Email ${i + 1} sent successfully (${duration}ms)`);
        console.log(`   Message ID: ${emailResult.messageId}`);
        
        results.push({
          email: reference.email,
          success: true,
          messageId: emailResult.messageId,
          duration: duration
        });
        
      } catch (emailError) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.error(`❌ Email ${i + 1} failed (${duration}ms):`, emailError.message);
        
        results.push({
          email: reference.email,
          success: false,
          error: emailError.message,
          duration: duration
        });
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📊 Email sending summary:');
    console.log(`   Total emails: ${results.length}`);
    console.log(`   Successful: ${results.filter(r => r.success).length}`);
    console.log(`   Failed: ${results.filter(r => !r.success).length}`);
    console.log(`   Average duration: ${Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms`);
    console.log(`   Total duration: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`);
    
    console.log('\n📧 Check your email inbox for the test messages!');
    
  } catch (error) {
    console.error('❌ Multiple email test failed:', error);
  }
}

testMultipleEmails();
