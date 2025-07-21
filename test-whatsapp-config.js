const axios = require('axios');
require('dotenv').config();

async function testWhatsAppConfig() {
  console.log('🔍 Testing WhatsApp Configuration...\n');
  
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  
  console.log('📋 Current Configuration:');
  console.log(`Business Account ID: ${businessAccountId}`);
  console.log(`Phone Number ID: ${phoneNumberId}`);
  console.log(`Access Token: ${accessToken ? accessToken.substring(0, 20) + '...' : 'NOT SET'}\n`);
  
  if (!accessToken || !phoneNumberId) {
    console.log('❌ Missing required configuration');
    return;
  }
  
  try {
    // Test 1: Verify Phone Number ID exists
    console.log('🧪 Test 1: Verifying Phone Number ID...');
    const phoneResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    console.log('✅ Phone Number ID is valid!');
    console.log(`📱 Phone Number: ${phoneResponse.data.display_phone_number}`);
    console.log(`🔗 Status: ${phoneResponse.data.verified_name}\n`);
    
    // Test 2: Verify Business Account
    console.log('🧪 Test 2: Verifying Business Account...');
    const businessResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${businessAccountId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    console.log('✅ Business Account ID is valid!');
    console.log(`🏢 Business Name: ${businessResponse.data.name}`);
    console.log(`🆔 Account ID: ${businessResponse.data.id}\n`);
    
    console.log('🎉 All configurations are correct! Your WhatsApp setup is ready for sending messages.');
    
  } catch (error) {
    console.log('❌ Configuration Error:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 400) {
        console.log('\n💡 This usually means the Phone Number ID is incorrect.');
        console.log('Please check your Meta Developer Console for the correct Phone Number ID.');
      }
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
}

testWhatsAppConfig();
