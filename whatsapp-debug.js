#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

class WhatsAppDebugger {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    this.testPhoneNumber = '+256784528444';
  }

  async runDiagnostics() {
    console.log('🔍 WhatsApp Business API Diagnostics');
    console.log('=====================================\n');

    try {
      await this.checkPhoneNumberInfo();
      await this.checkBusinessAccount();
      await this.checkMessageTemplates();
      await this.sendTestMessage();
      console.log('\n✅ Diagnostics completed!');
    } catch (error) {
      console.error('\n❌ Diagnostics failed:', error.message);
    }
  }

  async checkPhoneNumberInfo() {
    console.log('📱 Checking Phone Number Configuration...');
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${this.phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      console.log('✅ Phone Number Info:');
      console.log(`   - Display Name: ${response.data.display_phone_number}`);
      console.log(`   - Verified Name: ${response.data.verified_name}`);
      console.log(`   - Status: ${response.data.code_verification_status || 'N/A'}`);
      console.log(`   - Quality Rating: ${response.data.quality_rating || 'N/A'}`);
      
    } catch (error) {
      console.error('❌ Phone Number Check Failed:', error.response?.data || error.message);
    }
  }

  async checkBusinessAccount() {
    console.log('\n🏢 Checking Business Account...');
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${this.businessAccountId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      console.log('✅ Business Account Info:');
      console.log(`   - Name: ${response.data.name}`);
      console.log(`   - Status: ${response.data.account_review_status || 'N/A'}`);
      
    } catch (error) {
      console.error('❌ Business Account Check Failed:', error.response?.data || error.message);
    }
  }

  async checkMessageTemplates() {
    console.log('\n📋 Checking Message Templates...');
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${this.businessAccountId}/message_templates`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      console.log('✅ Available Templates:');
      if (response.data.data.length === 0) {
        console.log('   - No approved templates found');
        console.log('   - ⚠️  You can only send template messages or messages to opted-in users');
      } else {
        response.data.data.forEach(template => {
          console.log(`   - ${template.name} (${template.status})`);
        });
      }
      
    } catch (error) {
      console.error('❌ Template Check Failed:', error.response?.data || error.message);
    }
  }

  async sendTestMessage() {
    console.log('\n💬 Sending Test Message...');
    try {
      const messageData = {
        messaging_product: "whatsapp",
        to: this.testPhoneNumber.replace('+', ''),
        type: "text",
        text: {
          body: "🧪 Test message from ThanksDoc WhatsApp Integration. If you receive this, the API is working correctly!"
        }
      };

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Test Message Sent Successfully!');
      console.log(`   - Message ID: ${response.data.messages[0].id}`);
      console.log(`   - To: ${this.testPhoneNumber}`);
      console.log('\n📱 Check your WhatsApp for the test message.');
      
      // Additional troubleshooting info
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('   1. Make sure your phone number is opted-in to receive messages');
      console.log('   2. Check if your WhatsApp Business account is approved');
      console.log('   3. Verify your phone number is registered correctly');
      console.log('   4. Check your Facebook Business Manager for any restrictions');
      
    } catch (error) {
      console.error('❌ Test Message Failed:', error.response?.data || error.message);
      
      if (error.response?.data?.error) {
        const errorCode = error.response.data.error.code;
        const errorType = error.response.data.error.type;
        
        console.log('\n🔧 Error Analysis:');
        console.log(`   - Error Code: ${errorCode}`);
        console.log(`   - Error Type: ${errorType}`);
        
        if (errorCode === 131056) {
          console.log('   - This means: No valid phone number detected');
          console.log('   - Solution: Make sure +256784528444 is a valid WhatsApp number');
        } else if (errorCode === 131047) {
          console.log('   - This means: Re-engagement message to a user');
          console.log('   - Solution: The user needs to message your business first');
        } else if (errorCode === 131021) {
          console.log('   - This means: Recipient not available on WhatsApp');
          console.log('   - Solution: Verify the phone number is registered on WhatsApp');
        }
      }
    }
  }
}

// Run diagnostics
const whatsappDebugger = new WhatsAppDebugger();
whatsappDebugger.runDiagnostics();
