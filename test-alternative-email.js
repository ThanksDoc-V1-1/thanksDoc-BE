// Test email with different sender approach
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testAlternativeEmail() {
  console.log('🧪 Testing alternative email approach...\n');
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Test with different sender name and simpler content
    const testEmail = {
      from: {
        name: 'ThanksDoc Support',
        address: process.env.EMAIL_FROM
      },
      to: 'arafats144@gmail.com',
      subject: 'Test Email - Can you see this?',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Test</h2>
          <p>This is a simple test email to see if Gmail is receiving our messages.</p>
          <p>If you can see this email, the system is working correctly.</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
          <p>From: ThanksDoc Email System</p>
        </div>
      `,
      text: `
        Email Test
        
        This is a simple test email to see if Gmail is receiving our messages.
        If you can see this email, the system is working correctly.
        
        Time sent: ${new Date().toLocaleString()}
        From: ThanksDoc Email System
      `
    };

    console.log('📤 Sending simple test email...');
    const result = await transporter.sendMail(testEmail);
    
    console.log('✅ Simple test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📩 Check arafats144@gmail.com RIGHT NOW for this simple test email');
    
    // Wait 5 seconds then send the reference email
    console.log('\n⏳ Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Now send the actual reference email
    const referenceEmail = {
      from: {
        name: 'ThanksDoc Support',
        address: process.env.EMAIL_FROM
      },
      to: 'arafats144@gmail.com',
      subject: 'Professional Reference Request - IMMEDIATE TEST',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🏥 Professional Reference Request</h2>
          <p><strong>This is an immediate test of the reference system.</strong></p>
          <p>Dr. Test Doctor has listed you as a professional reference.</p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Click here to complete the reference form:</strong></p>
            <a href="http://localhost:3000/reference-form/test-123" 
               style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Complete Reference Form
            </a>
          </div>
          <p>Time: ${new Date().toLocaleString()}</p>
          <p>If you can see this, the reference email system is working!</p>
        </div>
      `,
      text: `
        Professional Reference Request - IMMEDIATE TEST
        
        This is an immediate test of the reference system.
        Dr. Test Doctor has listed you as a professional reference.
        
        Click here to complete: http://localhost:3000/reference-form/test-123
        
        Time: ${new Date().toLocaleString()}
        If you can see this, the reference email system is working!
      `
    };

    console.log('📤 Sending reference email test...');
    const refResult = await transporter.sendMail(referenceEmail);
    
    console.log('✅ Reference test email sent successfully!');
    console.log('📧 Message ID:', refResult.messageId);
    console.log('📩 Check arafats144@gmail.com for BOTH emails now!');
    
  } catch (error) {
    console.error('❌ Alternative email test failed:', error);
  }
}

testAlternativeEmail();
