const nodemailer = require('nodemailer');

// Test the email configuration with the provided credentials
async function testEmailConfig() {
  console.log('🧪 Testing Email Configuration...');
  
  // Create transporter with your configuration
  const transporter = nodemailer.createTransport({
    host: "mail.abramgroup.org",
    port: 465,
    secure: true, // use SSL
    auth: {
      user: "noreply@abramgroup.org",
      pass: "Arafat@2025",
    },
    // Add timeout configurations
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 15000, // 15 seconds
  });

  try {
    console.log('🔍 Verifying SMTP connection...');
    
    // Test the connection with timeout
    const connectionTest = await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
      )
    ]);
    
    if (connectionTest) {
      console.log('✅ SMTP connection verified successfully!');
      
      // Test sending a simple email
      console.log('📧 Sending test email...');
      
      const testEmail = {
        from: "noreply@abramgroup.org",
        to: "noreply@abramgroup.org", // Send to self for testing
        subject: "ThanksDoc Email Configuration Test",
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify the ThanksDoc email configuration.</p>
          <p>If you receive this, the email service is working correctly.</p>
          <p>Test time: ${new Date().toISOString()}</p>
        `
      };
      
      const emailResult = await Promise.race([
        transporter.sendMail(testEmail),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
        )
      ]);
      
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', emailResult.messageId);
      console.log('📊 Response:', emailResult.response);
      
    }
  } catch (error) {
    console.error('❌ Email configuration test failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.errno) {
      console.error('Error number:', error.errno);
    }
    
    // Provide specific troubleshooting advice
    if (error.message.includes('timeout')) {
      console.error('🔍 This appears to be a timeout issue. The email server may be slow or unreachable.');
    } else if (error.message.includes('authentication') || error.message.includes('auth')) {
      console.error('🔍 This appears to be an authentication issue. Check your email credentials.');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('🔍 This appears to be a connection issue. Check your email host and network.');
    }
  } finally {
    // Close the transporter
    transporter.close();
  }
}

// Run the test
testEmailConfig().then(() => {
  console.log('🔚 Email configuration test completed.');
}).catch((error) => {
  console.error('💥 Unexpected error during email test:', error);
});
