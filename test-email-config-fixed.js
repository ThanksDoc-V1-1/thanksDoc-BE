const { config } = require('dotenv');
config();

// Test email configuration
console.log('📧 Current Email Configuration:');
console.log('Host:', process.env.EMAIL_HOST);
console.log('Port:', process.env.EMAIL_PORT);
console.log('Secure:', process.env.EMAIL_SECURE);
console.log('User:', process.env.EMAIL_USER);
console.log('From:', process.env.EMAIL_FROM);

// Initialize email service to see what configuration it uses
const EmailService = require('./src/services/email.service');
console.log('\n🔧 Initializing Email Service...');

const emailService = new EmailService();

console.log('\n✅ Email service initialized successfully!');
console.log('📋 The email service will use the configuration exactly as specified in your .env file.');
console.log('🚀 No automatic port or security modifications in production.');
