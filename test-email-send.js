const nodemailer = require('nodemailer');

/**
 * Test email sending to specific address using current environment variables
 */

async function testEmailToSpecificAddress() {
  console.log('🧪 Testing Email Send to arafats144@gmail.com');
  console.log('=' .repeat(60));

  // Use current environment variables (same as in your .env)
  const config = {
    host: process.env.EMAIL_HOST || "mail.abramgroup.org",
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true' || true,
    user: process.env.EMAIL_USER || "noreply@abramgroup.org",
    pass: process.env.EMAIL_PASS || "Arafat@2025",
    from: process.env.EMAIL_FROM || "noreply@abramgroup.org"
  };

  console.log('📧 Email Configuration (from .env):');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   User: ${config.user}`);
  console.log(`   From: ${config.from}`);
  console.log('');

  // Create transporter with timeout configurations
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Add timeout configurations to prevent hanging
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 15000, // 15 seconds
  });

  try {
    console.log('🔍 Testing SMTP connection...');
    
    // Test connection first
    const connectionTest = await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
      )
    ]);

    if (connectionTest) {
      console.log('✅ SMTP connection verified successfully!');
      
      // Prepare test email
      const testEmail = {
        from: config.from,
        to: "arafats144@gmail.com",
        subject: "ThanksDoc Email Test - " + new Date().toISOString(),
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ThanksDoc Email Test</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px 20px; background: #f9fafb; }
              .success { background: #10b981; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🩺 ThanksDoc Email Test</h1>
              </div>
              <div class="content">
                <div class="success">
                  <h2>✅ Email Configuration Working!</h2>
                </div>
                <h2>Email Test Results</h2>
                <p><strong>Configuration Details:</strong></p>
                <ul>
                  <li><strong>Host:</strong> ${config.host}</li>
                  <li><strong>Port:</strong> ${config.port}</li>
                  <li><strong>Security:</strong> ${config.secure ? 'SSL/TLS' : 'Plain'}</li>
                  <li><strong>From:</strong> ${config.from}</li>
                </ul>
                
                <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                
                <p>This email confirms that your ThanksDoc backend email service is working correctly with the current configuration.</p>
                
                <p>If you receive this email, it means:</p>
                <ul>
                  <li>✅ SMTP credentials are valid</li>
                  <li>✅ Email server is reachable</li>
                  <li>✅ Email service configuration is correct</li>
                  <li>✅ No firewall blocking the connection</li>
                </ul>
                
                <p><strong>Next Steps:</strong></p>
                <p>Since this email arrived successfully, the issue you experienced in production might be related to:</p>
                <ol>
                  <li>Network differences between local and Railway environment</li>
                  <li>Railway-specific firewall or connection limits</li>
                  <li>Environment variable differences in production</li>
                  <li>Production server timeout settings</li>
                </ol>
                
                <p>Best regards,<br>The ThanksDoc Development Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ThanksDoc - Email Configuration Test</p>
                <p>This is an automated test email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      console.log('📧 Sending test email to arafats144@gmail.com...');
      console.log('   Subject:', testEmail.subject);
      
      const emailResult = await Promise.race([
        transporter.sendMail(testEmail),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
        )
      ]);
      
      console.log('✅ TEST EMAIL SENT SUCCESSFULLY!');
      console.log('📧 Message ID:', emailResult.messageId);
      console.log('📊 Server Response:', emailResult.response);
      console.log('');
      console.log('🎉 SUCCESS! Check arafats144@gmail.com for the test email.');
      console.log('');
      console.log('📝 CONCLUSION:');
      console.log('Since this email was sent successfully from your local environment,');
      console.log('the issue is likely specific to the production environment (Railway).');
      console.log('');
      console.log('🔧 PRODUCTION TROUBLESHOOTING:');
      console.log('1. Verify Railway environment variables are set correctly');
      console.log('2. Check if Railway blocks SMTP connections');
      console.log('3. Consider using Railway\'s environment-specific email service');
      console.log('4. The timeout fixes I implemented should prevent hanging regardless');
      
    } else {
      console.log('❌ Connection test returned false');
    }
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    // Provide specific troubleshooting advice
    if (error.code === 'EAUTH') {
      console.error('🔍 Authentication failed - check credentials');
    } else if (error.message.includes('timeout')) {
      console.error('🔍 Timeout - server not responding (this is what was causing production hanging)');
      console.error('✅ The timeout fixes I implemented should prevent this in production');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Connection refused - check host and port');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 Host not found - check email server address');
    }
  } finally {
    transporter.close();
    console.log('');
    console.log('🔚 Email test completed.');
  }
}

// Load environment variables if .env file exists
if (require('fs').existsSync('.env')) {
  require('dotenv').config();
  console.log('📂 Loaded environment variables from .env file');
} else {
  console.log('⚠️  No .env file found, using default values');
}

// Run the test
testEmailToSpecificAddress()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
