// Test new email configuration with abramgroup.org
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testNewEmailConfig() {
  console.log('🧪 Testing new email configuration...\n');
  
  try {
    console.log('📧 New email configuration:');
    console.log('   Host:', process.env.EMAIL_HOST);
    console.log('   Port:', process.env.EMAIL_PORT);
    console.log('   Secure:', process.env.EMAIL_SECURE);
    console.log('   User:', process.env.EMAIL_USER);
    console.log('   From:', process.env.EMAIL_FROM);
    console.log('');
    
    // Create transporter with new settings
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful with abramgroup.org!');
    
    // Test sending a simple email
    console.log('\n📤 Sending test email...');
    const testResult = await transporter.sendMail({
      from: {
        name: 'ThanksDoc Platform',
        address: process.env.EMAIL_FROM
      },
      to: 'arafats144@gmail.com',
      subject: '🧪 New Email Server Test - AbramGroup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>✅ Email Server Test Successful!</h2>
          <p>This email was sent using the new <strong>abramgroup.org</strong> email server configuration.</p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📧 Server Details:</h3>
            <p><strong>Host:</strong> mail.abramgroup.org</p>
            <p><strong>From:</strong> noreply@abramgroup.org</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>If you received this email, the new email configuration is working correctly!</p>
          <p>This should improve email delivery for the professional reference system.</p>
          <hr>
          <p><small>ThanksDoc Professional Reference System</small></p>
        </div>
      `,
      text: `
        Email Server Test Successful!
        
        This email was sent using the new abramgroup.org email server configuration.
        
        Server Details:
        Host: mail.abramgroup.org
        From: noreply@abramgroup.org
        Time: ${new Date().toLocaleString()}
        
        If you received this email, the new email configuration is working correctly!
        
        ThanksDoc Professional Reference System
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', testResult.messageId);
    console.log('📩 Check arafats144@gmail.com for the test email');
    
    console.log('\n🎉 AbramGroup email server is working!');
    console.log('💡 This should improve email delivery for:');
    console.log('   - Professional reference requests');
    console.log('   - Email verification messages');
    console.log('   - Password reset emails');
    
  } catch (error) {
    console.error('❌ New email configuration failed:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('💡 Suggestion: The email server might be unreachable');
    } else if (error.code === 'EAUTH') {
      console.log('💡 Suggestion: Check the email credentials for abramgroup.org');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Suggestion: Check if mail.abramgroup.org is the correct host');
    }
  }
}

testNewEmailConfig();
