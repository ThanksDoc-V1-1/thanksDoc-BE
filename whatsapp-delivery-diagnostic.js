const axios = require('axios');
require('dotenv').config();

/**
 * WhatsApp Delivery Diagnostic Tool
 * This will help identify why WhatsApp messages show as sent but aren't delivered
 */

async function diagnoseWhatsAppDelivery() {
  console.log('🔍 WhatsApp Delivery Diagnostic Tool');
  console.log('=' .repeat(60));

  const config = {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    testPhoneNumber: '+256784528444', // Your WhatsApp number from logs
    apiUrl: `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
  };

  console.log('📱 Configuration Check:');
  console.log(`   Access Token: ${config.accessToken?.substring(0, 20)}...`);
  console.log(`   Phone Number ID: ${config.phoneNumberId}`);
  console.log(`   Business Account ID: ${config.businessAccountId}`);
  console.log(`   API URL: ${config.apiUrl}`);
  console.log(`   Test Number: ${config.testPhoneNumber}`);
  console.log('');

  // Test 1: Check account information
  console.log('🧪 Test 1: Checking WhatsApp Business Account Info');
  console.log('-'.repeat(50));

  try {
    const accountInfoUrl = `https://graph.facebook.com/v20.0/${config.phoneNumberId}`;
    const accountResponse = await axios.get(accountInfoUrl, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
      timeout: 10000
    });

    console.log('✅ Account info retrieved:');
    console.log(`   Display Name: ${accountResponse.data.display_phone_number}`);
    console.log(`   Verified Name: ${accountResponse.data.verified_name}`);
    console.log(`   Status: ${accountResponse.data.account_mode || 'Unknown'}`);
    console.log(`   Quality Rating: ${accountResponse.data.quality_rating || 'Unknown'}`);
  } catch (error) {
    console.log('❌ Failed to get account info:', error.response?.data || error.message);
  }

  console.log('');

  // Test 2: Send simple text message
  console.log('🧪 Test 2: Sending Simple Text Message');
  console.log('-'.repeat(50));

  const testMessage = {
    messaging_product: "whatsapp",
    to: config.testPhoneNumber.replace('+', ''), // Remove + for API
    type: "text",
    text: {
      body: `🧪 WhatsApp Delivery Test - ${new Date().toISOString()}\n\nThis is a test message from ThanksDoc to verify WhatsApp delivery.\n\nIf you receive this, WhatsApp is working correctly.`
    }
  };

  try {
    console.log('📱 Sending test message...');
    console.log('   To:', testMessage.to);
    console.log('   Message:', testMessage.text.body.substring(0, 50) + '...');

    const messageResponse = await axios.post(config.apiUrl, testMessage, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log('✅ Message sent successfully!');
    console.log('📱 Message ID:', messageResponse.data.messages[0].id);
    console.log('📊 Response:', JSON.stringify(messageResponse.data, null, 2));
    
    // Check message status after a delay
    const messageId = messageResponse.data.messages[0].id;
    console.log('');
    console.log('⏳ Waiting 10 seconds to check delivery status...');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Try to get message status (this might not be available depending on your setup)
    try {
      const statusUrl = `https://graph.facebook.com/v20.0/${messageId}`;
      const statusResponse = await axios.get(statusUrl, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
        timeout: 5000
      });
      console.log('📊 Message Status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (statusError) {
      console.log('⚠️ Could not retrieve message status (this is normal for some setups)');
    }

  } catch (error) {
    console.log('❌ Message sending failed:');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.error) {
      const whatsappError = error.response.data.error;
      console.log('');
      console.log('🔍 Specific WhatsApp Error Analysis:');
      
      if (whatsappError.code === 131026) {
        console.log('❌ PHONE NUMBER NOT VERIFIED');
        console.log('💡 Solution: Go to Meta Business Manager and verify this phone number');
        console.log('📋 Steps:');
        console.log('   1. Go to business.facebook.com');
        console.log('   2. Navigate to WhatsApp Manager');
        console.log('   3. Add the recipient phone number to verified numbers');
      } else if (whatsappError.code === 131047) {
        console.log('❌ RATE LIMIT EXCEEDED');
        console.log('💡 Solution: Wait 24 hours or reduce message frequency');
      } else if (whatsappError.code === 100) {
        console.log('❌ INVALID PARAMETER');
        console.log('💡 Solution: Check phone number format and message content');
      } else if (whatsappError.code === 190) {
        console.log('❌ ACCESS TOKEN INVALID');
        console.log('💡 Solution: Generate a new access token');
      } else {
        console.log(`❌ Error Code: ${whatsappError.code}`);
        console.log(`❌ Error Message: ${whatsappError.message}`);
      }
    }
  }

  console.log('');

  // Test 3: Check webhook configuration (if applicable)
  console.log('🧪 Test 3: Webhook Configuration Check');
  console.log('-'.repeat(50));
  
  const webhookUrl = process.env.WEBHOOK_URL || `${process.env.BASE_URL}/api/service-requests/whatsapp-webhook`;
  console.log('📡 Webhook URL:', webhookUrl);
  console.log('🔑 Webhook Verify Token:', process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.substring(0, 10) + '...');

  console.log('');
  console.log('📋 RECOMMENDATIONS:');
  console.log('=' .repeat(60));
  console.log('');
  console.log('1. 🔐 VERIFY PHONE NUMBER PERMISSIONS:');
  console.log('   - Go to Meta Business Manager (business.facebook.com)');
  console.log('   - Navigate to WhatsApp > Phone Numbers');
  console.log('   - Ensure recipient numbers are verified or in test mode');
  console.log('');
  console.log('2. 📊 CHECK MESSAGE DELIVERY STATUS:');
  console.log('   - Set up webhooks to receive delivery status updates');
  console.log('   - Monitor message status in Meta Business Manager');
  console.log('');
  console.log('3. 🚦 RATE LIMITING:');
  console.log('   - WhatsApp has strict rate limits for unverified businesses');
  console.log('   - Consider upgrading to verified business account');
  console.log('');
  console.log('4. 📱 MESSAGE TEMPLATE APPROVAL:');
  console.log('   - Ensure your message templates are approved by Meta');
  console.log('   - Check template status in WhatsApp Manager');
  console.log('');
  console.log('5. 🔍 DEBUGGING TIPS:');
  console.log('   - Check if messages appear in WhatsApp Manager logs');
  console.log('   - Verify the recipient phone number is correct');
  console.log('   - Ensure WhatsApp is installed on the recipient device');
  
  console.log('');
  console.log('🔚 WhatsApp diagnostic completed.');
}

// Run the diagnostic
diagnoseWhatsAppDelivery()
  .then(() => {
    console.log('✅ Diagnostic completed successfully');
  })
  .catch((error) => {
    console.error('💥 Diagnostic failed:', error.message);
  });
