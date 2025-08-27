const nodemailer = require('nodemailer');

/**
 * Comprehensive email debugging and testing tool
 * This will help identify and fix email configuration issues
 */

async function testEmailConfiguration() {
  console.log('🔍 ThanksDoc Email Configuration Diagnostic Tool');
  console.log('=' .repeat(60));

  const config = {
    host: "mail.abramgroup.org",
    port: 465,
    secure: true,
    user: "noreply@abramgroup.org",
    pass: "Arafat@2025",
    from: "noreply@abramgroup.org"
  };

  console.log('📧 Current Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   User: ${config.user}`);
  console.log(`   From: ${config.from}`);
  console.log('');

  // Test different configurations
  const configurations = [
    {
      name: "Current Configuration (SSL on 465)",
      config: {
        host: config.host,
        port: 465,
        secure: true,
        auth: { user: config.user, pass: config.pass },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000,
      }
    },
    {
      name: "Alternative Configuration (TLS on 587)",
      config: {
        host: config.host,
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: config.user, pass: config.pass },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000,
      }
    },
    {
      name: "Legacy Configuration (TLS on 25)",
      config: {
        host: config.host,
        port: 25,
        secure: false,
        auth: { user: config.user, pass: config.pass },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000,
      }
    }
  ];

  for (const { name, config: testConfig } of configurations) {
    console.log(`🧪 Testing: ${name}`);
    console.log('-'.repeat(40));

    const transporter = nodemailer.createTransport(testConfig);

    try {
      // Test connection
      console.log('   🔍 Testing SMTP connection...');
      const connectionTest = await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ]);

      if (connectionTest) {
        console.log('   ✅ Connection successful!');
        
        // Test sending email
        console.log('   📧 Testing email send...');
        const testEmail = {
          from: config.from,
          to: config.from, // Send to self
          subject: `ThanksDoc Test - ${name} - ${new Date().toISOString()}`,
          html: `
            <h3>Email Test Successful</h3>
            <p>Configuration: ${name}</p>
            <p>Host: ${testConfig.host}:${testConfig.port}</p>
            <p>Time: ${new Date().toLocaleString()}</p>
            <p>This email was sent successfully from ThanksDoc backend.</p>
          `
        };

        const emailResult = await Promise.race([
          transporter.sendMail(testEmail),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Send timeout')), 30000)
          )
        ]);

        console.log('   ✅ Email sent successfully!');
        console.log(`   📧 Message ID: ${emailResult.messageId}`);
        console.log(`   📊 Response: ${emailResult.response}`);
        console.log('   🎉 THIS CONFIGURATION WORKS!');
        console.log('');
        
        // Close transporter
        transporter.close();
        
        // If we found a working configuration, show how to update the code
        if (testConfig.port !== 465 || testConfig.secure !== true) {
          console.log('🔧 RECOMMENDED CONFIGURATION UPDATE:');
          console.log('Update your .env file with these values:');
          console.log(`EMAIL_HOST=${testConfig.host}`);
          console.log(`EMAIL_PORT=${testConfig.port}`);
          console.log(`EMAIL_SECURE=${testConfig.secure ? 'true' : 'false'}`);
          if (testConfig.requireTLS) {
            console.log('EMAIL_REQUIRE_TLS=true');
          }
          console.log(`EMAIL_USER=${config.user}`);
          console.log(`EMAIL_PASS=${config.pass}`);
          console.log(`EMAIL_FROM=${config.from}`);
        }
        
        return; // Exit on first successful configuration
      }
    } catch (error) {
      console.log('   ❌ Configuration failed:');
      console.log(`   Error: ${error.message}`);
      
      if (error.code) {
        console.log(`   Code: ${error.code}`);
      }
      
      // Provide specific troubleshooting
      if (error.code === 'EAUTH') {
        console.log('   🔍 Authentication failed - credentials are incorrect');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   🔍 Connection refused - port may be blocked or incorrect');
      } else if (error.code === 'ENOTFOUND') {
        console.log('   🔍 Host not found - check the email server address');
      } else if (error.message.includes('timeout')) {
        console.log('   🔍 Timeout - server is not responding or is too slow');
      }
    }
    
    transporter.close();
    console.log('');
  }
  
  console.log('❌ All configurations failed. Recommendations:');
  console.log('1. Contact mail.abramgroup.org administrator to verify:');
  console.log('   - SMTP service is running');
  console.log('   - Account credentials are correct');
  console.log('   - External connections are allowed');
  console.log('2. Check if your server/Railway deployment allows SMTP connections');
  console.log('3. Consider using alternative email services like:');
  console.log('   - SendGrid');
  console.log('   - Mailgun');
  console.log('   - AWS SES');
  console.log('   - Gmail SMTP (with app passwords)');
}

// Alternative email service configurations
function showAlternativeConfigurations() {
  console.log('\n📋 ALTERNATIVE EMAIL SERVICE CONFIGURATIONS:');
  console.log('=' .repeat(60));
  
  console.log('\n🌟 Gmail (recommended for testing):');
  console.log('EMAIL_HOST=smtp.gmail.com');
  console.log('EMAIL_PORT=587');
  console.log('EMAIL_SECURE=false');
  console.log('EMAIL_USER=your-gmail@gmail.com');
  console.log('EMAIL_PASS=your-app-password');
  console.log('EMAIL_FROM=your-gmail@gmail.com');
  
  console.log('\n📧 SendGrid:');
  console.log('EMAIL_HOST=smtp.sendgrid.net');
  console.log('EMAIL_PORT=587');
  console.log('EMAIL_SECURE=false');
  console.log('EMAIL_USER=apikey');
  console.log('EMAIL_PASS=your-sendgrid-api-key');
  console.log('EMAIL_FROM=verified-sender@yourdomain.com');
  
  console.log('\n📬 Mailgun:');
  console.log('EMAIL_HOST=smtp.mailgun.org');
  console.log('EMAIL_PORT=587');
  console.log('EMAIL_SECURE=false');
  console.log('EMAIL_USER=postmaster@mg.yourdomain.com');
  console.log('EMAIL_PASS=your-mailgun-password');
  console.log('EMAIL_FROM=noreply@yourdomain.com');
}

// Run the test
console.log('Starting email configuration test...\n');
testEmailConfiguration()
  .then(() => {
    showAlternativeConfigurations();
    console.log('\n🔚 Email diagnostic completed.');
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    showAlternativeConfigurations();
  });
