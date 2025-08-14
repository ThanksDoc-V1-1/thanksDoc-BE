// Test SMTP connection
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTPConnection() {
  console.log('🧪 Testing SMTP connection...\n');
  
  try {
    console.log('📧 Email configuration:');
    console.log('   Host:', process.env.EMAIL_HOST);
    console.log('   Port:', process.env.EMAIL_PORT);
    console.log('   Secure:', process.env.EMAIL_SECURE);
    console.log('   User:', process.env.EMAIL_USER);
    console.log('   From:', process.env.EMAIL_FROM);
    console.log('');
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('🔍 Testing connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Test sending a simple email
    console.log('\n📤 Testing email sending...');
    const testResult = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'arafats144@gmail.com', // Change this to your email
      subject: '🧪 SMTP Test Email',
      html: `
        <h2>SMTP Test Successful!</h2>
        <p>This email was sent to test the SMTP configuration.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>If you received this, the email system is working correctly!</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', testResult.messageId);
    console.log('📩 Check your email inbox for the test message.');
    
  } catch (error) {
    console.error('❌ SMTP test failed:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('💡 Suggestion: The email server might be unreachable or blocking connections.');
    } else if (error.code === 'EAUTH') {
      console.log('💡 Suggestion: Check your email credentials (username/password).');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Suggestion: Check the email host configuration.');
    }
  }
}

testSMTPConnection();
