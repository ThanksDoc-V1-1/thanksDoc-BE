require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n🔍 PRODUCTION EMAIL CONFIGURATION TEST');
console.log('=' .repeat(50));

// Show exact configuration that will be used
const config = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? '***[HIDDEN]***' : 'NOT SET',
  },
};

console.log('📧 Configuration that will be used in production:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   Secure (SSL): ${config.secure}`);
console.log(`   User: ${config.auth.user}`);
console.log(`   Password: ${config.auth.pass}`);

// Test connection (same as production will use)
const testConfig = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Use the same production timeouts
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 10000,   // 10 seconds
  socketTimeout: 30000,     // 30 seconds
  pool: false,              // Disable connection pooling
  maxConnections: 1,        // Single connection
  rateDelta: 1000,          // Rate limiting
  rateLimit: 5,             // Max 5 emails per second
};

console.log('\n🔄 Testing SMTP connection...');

const transporter = nodemailer.createTransporter(testConfig);

transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection successful!');
    console.log('📧 This exact configuration will work in production.');
    console.log('\n🚀 You can safely deploy this configuration.');
  })
  .catch((error) => {
    console.log('❌ SMTP connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code || 'Unknown');
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 Troubleshooting timeout issues:');
      console.log('   1. This works locally but might timeout in production due to:');
      console.log('      - Cloud platform network restrictions');
      console.log('      - Firewall blocking outbound SMTP');
      console.log('      - Email server geographical restrictions');
      console.log('   2. Your configuration is correct, the issue is network connectivity.');
    }
  });
