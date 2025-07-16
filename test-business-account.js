#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function findCorrectBusinessAccount() {
  console.log('🔍 Finding Correct WhatsApp Business Account');
  console.log('===========================================\n');

  try {
    // Get phone number info
    console.log('📱 CHECKING PHONE NUMBER INFO:');
    const phoneResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );

    console.log('Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
    console.log('Display Phone:', phoneResponse.data.display_phone_number);
    console.log('Verified Name:', phoneResponse.data.verified_name);
    console.log('Status:', phoneResponse.data.status || 'VERIFIED');

    // Try to get accessible business accounts
    console.log('\n🏢 CHECKING ACCESSIBLE BUSINESS ACCOUNTS:');
    try {
      const businessAccountsResponse = await axios.get(
        'https://graph.facebook.com/v18.0/me/businesses',
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          }
        }
      );

      if (businessAccountsResponse.data.data && businessAccountsResponse.data.data.length > 0) {
        console.log('Found business accounts:');
        businessAccountsResponse.data.data.forEach((business, index) => {
          console.log(`${index + 1}. ${business.name} (ID: ${business.id})`);
        });
      }
    } catch (error) {
      console.log('Could not access business accounts via this token');
    }

    // Check current business account
    console.log('\n📋 TESTING CURRENT BUSINESS ACCOUNT:');
    try {
      const currentBusinessResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          }
        }
      );

      console.log('✅ Current Business Account is accessible');
      console.log('Name:', currentBusinessResponse.data.name);
      console.log('ID:', currentBusinessResponse.data.id);
    } catch (error) {
      console.log('❌ Current Business Account is NOT accessible with this token');
      console.log('Error:', error.response?.data?.error?.message || error.message);
    }

    // Test sending a message to see if it works
    console.log('\n🧪 TESTING MESSAGE SENDING:');
    const testPayload = {
      messaging_product: "whatsapp",
      to: "256784528444", // Your personal number without +
      type: "text",
      text: {
        body: "🏥 Test message from ThanksDoc - If you receive this, the WhatsApp API is working!"
      }
    };

    try {
      const testResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        testPayload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Test message sent successfully!');
      console.log('Message ID:', testResponse.data.messages[0].id);
      console.log('📱 Check your WhatsApp (+256784528444) for the test message');
      
    } catch (error) {
      console.log('❌ Test message failed:');
      console.log('Error:', error.response?.data || error.message);
      
      if (error.response?.data?.error?.code === 131049) {
        console.log('\n💡 SOLUTION: Your phone number needs to be verified or added to the Business Account');
      }
    }

  } catch (error) {
    console.error('❌ General Error:', error.response?.data || error.message);
  }
}

findCorrectBusinessAccount();
