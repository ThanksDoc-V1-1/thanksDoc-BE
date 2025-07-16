#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function checkBusinessConnection() {
  console.log('🔍 Checking WhatsApp Business API Connection');
  console.log('===========================================\n');

  try {
    // Check phone number details
    const phoneResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );

    console.log('📱 PHONE NUMBER DETAILS:');
    console.log('========================');
    console.log('Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
    console.log('Display Phone:', phoneResponse.data.display_phone_number);
    console.log('Verified Name:', phoneResponse.data.verified_name);
    console.log('Status:', phoneResponse.data.status);
    console.log('Quality Rating:', phoneResponse.data.quality_rating);

    // Check which business account this phone belongs to
    const businessResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=whatsapp_business_account_id`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );

    console.log('\n🏢 BUSINESS ACCOUNT CONNECTION:');
    console.log('==============================');
    console.log('Phone belongs to Business Account:', businessResponse.data.whatsapp_business_account_id);
    console.log('Your configured Business Account:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
    
    const isMatching = businessResponse.data.whatsapp_business_account_id === process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    console.log('✅ Match:', isMatching ? 'YES' : '❌ NO - THIS IS THE PROBLEM!');

    if (!isMatching) {
      console.log('\n🚨 SOLUTION:');
      console.log('============');
      console.log('Update your .env file with the correct Business Account ID:');
      console.log(`WHATSAPP_BUSINESS_ACCOUNT_ID=${businessResponse.data.whatsapp_business_account_id}`);
    }

    // Check business account details
    try {
      const businessDetailsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${businessResponse.data.whatsapp_business_account_id}?fields=name,phone_numbers`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          }
        }
      );

      console.log('\n📋 BUSINESS ACCOUNT DETAILS:');
      console.log('============================');
      console.log('Name:', businessDetailsResponse.data.name);
      console.log('ID:', businessDetailsResponse.data.id);
      if (businessDetailsResponse.data.phone_numbers) {
        console.log('Phone Numbers:', businessDetailsResponse.data.phone_numbers.data.length);
      }
    } catch (error) {
      console.log('\n⚠️  Could not fetch business account details');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkBusinessConnection();
