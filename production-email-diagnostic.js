const nodemailer = require('nodemailer');
const { promisify } = require('util');
const dns = require('dns');

/**
 * Production Environment Email Diagnostic Tool
 * Specifically designed to diagnose Railway deployment issues
 */

async function productionEmailDiagnostic() {
  console.log('🚀 Production Environment Email Diagnostic');
  console.log('🔍 Designed for Railway/Production deployment issues');
  console.log('=' .repeat(60));
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  const emailVars = {
    'EMAIL_HOST': process.env.EMAIL_HOST,
    'EMAIL_PORT': process.env.EMAIL_PORT,
    'EMAIL_SECURE': process.env.EMAIL_SECURE,
    'EMAIL_USER': process.env.EMAIL_USER,
    'EMAIL_PASS': process.env.EMAIL_PASS ? '***HIDDEN***' : 'NOT SET',
    'EMAIL_FROM': process.env.EMAIL_FROM,
    'NODE_ENV': process.env.NODE_ENV,
    'RAILWAY_ENVIRONMENT': process.env.RAILWAY_ENVIRONMENT,
    'PORT': process.env.PORT
  };
  
  for (const [key, value] of Object.entries(emailVars)) {
    console.log(`   ${key}: ${value || 'NOT SET'}`);
  }
  console.log('');

  // DNS Resolution Test
  console.log('🌐 DNS Resolution Test:');
  try {
    const lookupAsync = promisify(dns.lookup);
    const result = await lookupAsync(process.env.EMAIL_HOST);
    console.log(`   ✅ ${process.env.EMAIL_HOST} resolves to: ${result.address}`);
  } catch (dnsError) {
    console.log(`   ❌ DNS resolution failed: ${dnsError.message}`);
    return;
  }
  console.log('');

  // Network connectivity test
  console.log('🔌 Network Connectivity Test:');
  const net = require('net');
  
  const testConnection = (host, port, timeout = 10000) => {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      
      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`Connection timeout to ${host}:${port}`));
      });
      
      socket.on('error', (error) => {
        socket.destroy();
        reject(error);
      });
      
      socket.connect(port, host);
    });
  };

  // Test different ports
  const portsToTest = [25, 465, 587];
  for (const port of portsToTest) {
    try {
      await testConnection(process.env.EMAIL_HOST, port, 5000);
      console.log(`   ✅ Port ${port}: Connection successful`);
    } catch (error) {
      console.log(`   ❌ Port ${port}: ${error.message}`);
    }
  }
  console.log('');

  // SMTP Configuration Tests
  console.log('📧 SMTP Configuration Tests:');
  
  // Test current configuration with enhanced logging
  const currentConfig = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Production-specific settings
    connectionTimeout: 30000, // 30 seconds for production
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 30000,     // 30 seconds
    logger: true,             // Enable logging
    debug: true,              // Enable debug output
    // Railway/Production specific settings
    pool: false,              // Disable connection pooling
    maxConnections: 1,        // Single connection
    rateDelta: 1000,          // Rate limiting
    rateLimit: 5,             // Max 5 emails per rateDelta
  };

  console.log(`   Testing configuration: ${currentConfig.host}:${currentConfig.port} (secure: ${currentConfig.secure})`);
  
  const transporter = nodemailer.createTransport(currentConfig);

  try {
    console.log('   🔍 Verifying SMTP connection...');
    
    // Connection test with detailed timeout
    const verifyResult = await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SMTP verification timeout after 30 seconds')), 30000)
      )
    ]);

    if (verifyResult) {
      console.log('   ✅ SMTP connection verified!');
      
      // Test actual email sending
      console.log('   📨 Testing email send...');
      
      const testEmail = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_FROM, // Send to self
        subject: `Production Email Test - ${new Date().toISOString()}`,
        html: `
          <h2>🚀 Production Email Test Successful</h2>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'unknown'}</p>
          <p><strong>Railway Environment:</strong> ${process.env.RAILWAY_ENVIRONMENT || 'unknown'}</p>
          <p><strong>Host:</strong> ${process.env.EMAIL_HOST}</p>
          <p><strong>Port:</strong> ${process.env.EMAIL_PORT}</p>
          <p><strong>Secure:</strong> ${process.env.EMAIL_SECURE}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>This email was sent successfully from the production environment!</p>
        `
      };

      const emailResult = await Promise.race([
        transporter.sendMail(testEmail),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout after 45 seconds')), 45000)
        )
      ]);

      console.log('   ✅ Email sent successfully!');
      console.log(`   📧 Message ID: ${emailResult.messageId}`);
      console.log(`   📊 Response: ${emailResult.response}`);
      console.log('   🎉 EMAIL SERVICE IS WORKING IN PRODUCTION!');
      
    }
  } catch (error) {
    console.log('   ❌ SMTP test failed:');
    console.log(`   Error Type: ${error.constructor.name}`);
    console.log(`   Error Code: ${error.code || 'N/A'}`);
    console.log(`   Error Message: ${error.message}`);
    
    // Production-specific error analysis
    if (error.code === 'ECONNREFUSED') {
      console.log('   🔍 Analysis: Railway may be blocking SMTP connections');
      console.log('   💡 Solution: Consider using Railway\'s recommended email services');
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.log('   🔍 Analysis: Network timeout - Railway networking issue');
      console.log('   💡 Solution: Increase timeouts or use alternative email service');
    } else if (error.code === 'EAUTH') {
      console.log('   🔍 Analysis: Authentication failed - environment variable issue');
      console.log('   💡 Solution: Verify Railway environment variables match local');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   🔍 Analysis: DNS resolution failed');
      console.log('   💡 Solution: Check if Railway has DNS restrictions');
    }
  } finally {
    transporter.close();
  }
  
  console.log('');
  console.log('🔧 Production-Specific Recommendations:');
  console.log('1. Railway Networking:');
  console.log('   - Railway may block certain SMTP ports (25, 465)');
  console.log('   - Try using port 587 with STARTTLS instead of SSL');
  console.log('   - Consider Railway-recommended email services');
  console.log('');
  console.log('2. Environment Variables:');
  console.log('   - Verify Railway environment variables exactly match local');
  console.log('   - Check for hidden characters or encoding issues');
  console.log('   - Use Railway CLI to verify: railway variables');
  console.log('');
  console.log('3. Alternative Solutions:');
  console.log('   - SendGrid (Railway Partner)');
  console.log('   - Mailgun');
  console.log('   - AWS SES');
  console.log('   - Postmark');
}

// Show Railway-specific configuration
function showRailwayEmailSolutions() {
  console.log('\n🚀 RAILWAY-OPTIMIZED EMAIL CONFIGURATIONS:');
  console.log('=' .repeat(60));
  
  console.log('\n🌟 SendGrid (Railway Partner - Recommended):');
  console.log('1. Add SendGrid service in Railway dashboard');
  console.log('2. Use these environment variables:');
  console.log('   EMAIL_HOST=smtp.sendgrid.net');
  console.log('   EMAIL_PORT=587');
  console.log('   EMAIL_SECURE=false');
  console.log('   EMAIL_USER=apikey');
  console.log('   EMAIL_PASS=${{SENDGRID_API_KEY}}'); // Railway variable syntax
  console.log('   EMAIL_FROM=noreply@yourdomain.com');
  
  console.log('\n📧 Alternative: Gmail with App Password:');
  console.log('   EMAIL_HOST=smtp.gmail.com');
  console.log('   EMAIL_PORT=587');
  console.log('   EMAIL_SECURE=false');
  console.log('   EMAIL_REQUIRE_TLS=true');
  console.log('   EMAIL_USER=your-gmail@gmail.com');
  console.log('   EMAIL_PASS=your-16-char-app-password');
  console.log('   EMAIL_FROM=your-gmail@gmail.com');
  
  console.log('\n🔧 Current Config with TLS (Try this first):');
  console.log('   EMAIL_HOST=mail.abramgroup.org');
  console.log('   EMAIL_PORT=587');
  console.log('   EMAIL_SECURE=false');
  console.log('   EMAIL_REQUIRE_TLS=true');
  console.log('   EMAIL_USER=noreply@abramgroup.org');
  console.log('   EMAIL_PASS=Arafat@2025');
  console.log('   EMAIL_FROM=noreply@abramgroup.org');
}

// Run the diagnostic
console.log('Starting production email diagnostic...\n');
productionEmailDiagnostic()
  .then(() => {
    showRailwayEmailSolutions();
    console.log('\n🔚 Production email diagnostic completed.');
  })
  .catch((error) => {
    console.error('💥 Diagnostic error:', error);
    showRailwayEmailSolutions();
  });
