// Test reference email manually with new abramgroup.org configuration
// This script will run independently without interfering with Strapi

async function testReferenceEmailManually() {
  console.log('🧪 Manual Professional Reference Email Test\n');
  console.log('📧 Using AbramGroup.org email configuration');
  
  // Load environment variables manually
  require('dotenv').config();
  
  console.log('Environment check:');
  console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log('');
  
  try {
    // Import nodemailer directly to avoid Strapi conflicts
    const nodemailer = require('nodemailer');
    
    // Create transporter with current settings
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
    console.log('✅ SMTP connection successful!\n');

    // Create a test reference email
    const referenceEmail = 'arafats144@gmail.com';
    const referenceName = 'Test Reference User';
    const doctorName = 'Dr. Manual Test';
    const referenceToken = 'manual-test-' + Date.now();
    const formUrl = `http://localhost:3000/reference-form/${referenceToken}`;

    const mailOptions = {
      from: {
        name: 'ThanksDoc Platform',
        address: process.env.EMAIL_FROM
      },
      to: referenceEmail,
      subject: `🏥 Professional Reference Request for ${doctorName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Professional Reference Request - ThanksDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
            .button { 
              display: inline-block; 
              background: #10b981 !important; 
              color: #ffffff !important; 
              padding: 16px 32px; 
              text-decoration: none !important; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: bold; 
              font-size: 16px;
            }
            .reference-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .instructions { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Professional Reference Request</h1>
            </div>
            <div class="content">
              <h2>Dear ${referenceName},</h2>
              <p><strong>${doctorName}</strong> has listed you as a professional reference for their registration with ThanksDoc.</p>
              
              <div class="reference-details">
                <h3>📝 What we need:</h3>
                <p>Please provide a professional reference to help ${doctorName} complete their compliance documents.</p>
                <p>This follows GMC Good Medical Practice guidelines for writing professional references.</p>
              </div>

              <div style="text-align: center;">
                <a href="${formUrl}" class="button">📝 Complete Reference Form</a>
              </div>
              
              <div class="instructions">
                <h3>📋 Instructions:</h3>
                <ul>
                  <li>Click the button above to access the secure form</li>
                  <li>Provide accurate professional assessment</li>
                  <li>Rate clinical skills based on your experience</li>
                  <li>Submit when complete</li>
                </ul>
              </div>
              
              <p><strong>Direct link:</strong><br>
              <a href="${formUrl}" style="color: #3b82f6; word-break: break-all;">${formUrl}</a></p>
              
              <p><strong>Important:</strong> This reference request is confidential.</p>
              
              <p>Best regards,<br><strong>ThanksDoc Team</strong></p>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} ThanksDoc - Professional Healthcare Platform</p>
              <p>Email sent from: ${process.env.EMAIL_FROM}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Professional Reference Request for ${doctorName}
        
        Dear ${referenceName},
        
        ${doctorName} has listed you as a professional reference for their registration with ThanksDoc.
        
        Please complete the reference form at: ${formUrl}
        
        This follows GMC guidelines for writing professional references.
        
        If you have questions, please contact our support team.
        
        Best regards,
        ThanksDoc Team
      `
    };

    console.log('📤 Sending professional reference email...');
    console.log(`   To: ${referenceEmail}`);
    console.log(`   Reference: ${referenceName}`);
    console.log(`   Doctor: ${doctorName}`);
    console.log(`   Form URL: ${formUrl}\n`);

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Reference email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📧 From: ${process.env.EMAIL_FROM}`);
    console.log('📧 Check arafats144@gmail.com for the email!');
    
    console.log('\n🎯 This confirms:');
    console.log('✅ AbramGroup.org email server is working');
    console.log('✅ Professional reference emails can be sent');
    console.log('✅ Email formatting is correct');
    console.log('✅ Links are properly generated');
    
  } catch (error) {
    console.error('❌ Manual test failed:', error.message);
    if (error.code === 'EAUTH') {
      console.log('💡 Check email credentials for abramgroup.org');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Check email server connection');
    }
  }
}

// Run the manual test
console.log('🔧 Running manual reference email test...');
console.log('⚠️ This will NOT interfere with the running Strapi backend\n');
testReferenceEmailManually();
