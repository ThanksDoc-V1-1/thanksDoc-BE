#!/usr/bin/env node

/**
 * Script to help identify correct WhatsApp Business API credentials
 * Run this to get the right Business Account ID and Phone Number ID
 */

console.log('🔍 WhatsApp Business API Credentials Helper');
console.log('==========================================\n');

console.log('📋 STEPS TO GET CORRECT CREDENTIALS:\n');

console.log('1️⃣ GET BUSINESS ACCOUNT ID:');
console.log('   - Go to: https://business.facebook.com/settings/whatsapp-business-accounts');
console.log('   - Find your WhatsApp Business Account');
console.log('   - The Business Account ID is the long number in the URL or account details\n');

console.log('2️⃣ GET PHONE NUMBER ID:');
console.log('   - Go to: https://business.facebook.com/latest/whatsapp_manager/phone_numbers/');
console.log('   - Click on your phone number');
console.log('   - Look for "Phone number ID" in the details\n');

console.log('3️⃣ GET ACCESS TOKEN:');
console.log('   - Go to: https://developers.facebook.com/apps/');
console.log('   - Select your app (ID: 1172016124113202)');
console.log('   - Go to WhatsApp > API Setup');
console.log('   - Generate a permanent access token\n');

console.log('4️⃣ WEBHOOK VERIFY TOKEN:');
console.log('   - This can be any custom string you choose');
console.log('   - Current: thanksDoc_webhook_verify_123');
console.log('   - Keep this the same or create a new one\n');

console.log('🔧 CURRENT CONFIGURATION ANALYSIS:');
console.log('==================================');

// Check current environment
require('dotenv').config();

console.log(`Business Account ID: ${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'NOT SET'}`);
console.log(`Phone Number ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID || 'NOT SET'}`);
console.log(`Access Token: ${process.env.WHATSAPP_ACCESS_TOKEN ? 'SET (length: ' + process.env.WHATSAPP_ACCESS_TOKEN.length + ')' : 'NOT SET'}`);
console.log(`Webhook Token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'NOT SET'}`);

console.log('\n📱 NEXT STEPS:');
console.log('=============');
console.log('1. Follow the steps above to get the correct IDs');
console.log('2. Update your .env file with the new credentials');
console.log('3. Make sure your app is connected to the right Business Account');
console.log('4. Test again with the updated credentials\n');

console.log('💡 TIP: The Business Account ID from business.facebook.com should match');
console.log('   the one in your app settings at developers.facebook.com\n');
