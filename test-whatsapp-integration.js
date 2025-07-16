#!/usr/bin/env node

/**
 * ThanksDoc WhatsApp Integration Test Script
 * 
 * This script tests the complete WhatsApp workflow:
 * 1. Creates a test service request
 * 2. Sends WhatsApp notifications to nearby doctors
 * 3. Simulates doctor acceptance
 * 4. Checks notification delivery
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'http://localhost:1337/api';

class WhatsAppTester {
  constructor() {
    this.serviceRequestId = null;
    this.testDoctorId = null;
  }

  getDoctorDisplayName(doctor) {
    if (doctor.name && doctor.name !== 'null' && doctor.name.trim() !== '' && doctor.name.toLowerCase() !== 'null') {
      return doctor.name;
    }
    
    // Fallback to firstName + lastName
    const firstName = doctor.firstName || '';
    const lastName = doctor.lastName || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return 'Unknown Doctor';
  }

  async runTests() {
    console.log('🏥 ThanksDoc WhatsApp Integration Test');
    console.log('=====================================\n');

    try {
      await this.checkEnvironment();
      await this.loadTestData();
      await this.createTestServiceRequest();
      await this.testWhatsAppNotifications();
      await this.cleanup();
      
      console.log('\n✅ All tests completed successfully!');
      console.log('📱 Check your WhatsApp for test messages.');
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log('🔍 Checking environment configuration...');
    
    const requiredVars = [
      'WHATSAPP_ACCESS_TOKEN', 
      'WHATSAPP_PHONE_NUMBER_ID', 
      'WHATSAPP_BUSINESS_ACCOUNT_ID'
    ];
    const missing = requiredVars.filter(var_name => !process.env[var_name]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    console.log('✅ WhatsApp Business API environment variables configured');
  }

  async loadTestData() {
    console.log('\n📋 Loading test data...');
    
    try {
      // Get doctors
      const doctorsResponse = await axios.get(`${API_BASE}/doctors`);
      const doctors = doctorsResponse.data.data;
      
      if (doctors.length === 0) {
        throw new Error('No doctors found. Please add at least one doctor to test.');
      }
      
      // Find a doctor with a phone number
      const doctorWithPhone = doctors.find(d => d.phone);
      if (!doctorWithPhone) {
        throw new Error('No doctors with phone numbers found. Please add phone numbers to doctor profiles.');
      }
      
      this.testDoctorId = doctorWithPhone.id;
      console.log(`✅ Found test doctor: Dr. ${this.getDoctorDisplayName(doctorWithPhone)} (${doctorWithPhone.phone})`);
      
      // Get businesses
      const businessesResponse = await axios.get(`${API_BASE}/businesses`);
      const businesses = businessesResponse.data.data;
      
      if (businesses.length === 0) {
        throw new Error('No businesses found. Please add at least one business to test.');
      }
      
      this.testBusinessId = businesses[0].id;
      console.log(`✅ Found test business: ${businesses[0].name}`);
      
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
      }
      throw error;
    }
  }

  async createTestServiceRequest() {
    console.log('\n🆕 Creating test service request...');
    
    try {
      const requestData = {
        businessId: this.testBusinessId,
        urgencyLevel: 'medium',
        serviceType: 'consultation',
        description: 'WhatsApp integration test - please ignore',
        estimatedDuration: 1,
        scheduledAt: new Date().toISOString()
      };
      
      const response = await axios.post(`${API_BASE}/service-requests/create`, requestData);
      this.serviceRequestId = response.data.serviceRequest.id;
      
      console.log(`✅ Service request created: ID ${this.serviceRequestId}`);
      console.log(`📊 Notifications sent to ${response.data.notifiedDoctors} doctors`);
      console.log(`📱 WhatsApp notifications: ${response.data.whatsappNotificationsSent}`);
      
    } catch (error) {
      if (error.response) {
        console.error('Response data:', error.response.data);
        throw new Error(`Failed to create service request: ${error.response.data.error?.message || error.response.statusText}`);
      }
      throw error;
    }
  }

  async testWhatsAppNotifications() {
    console.log('\n📱 Testing WhatsApp notifications...');
    
    try {
      const response = await axios.post(`${API_BASE}/service-requests/test-whatsapp`, {
        doctorId: this.testDoctorId,
        testMessage: 'This is a test message from the WhatsApp integration test script.'
      });
      
      if (response.data.success) {
        console.log(`✅ Test WhatsApp notification sent successfully`);
        console.log(`📱 WhatsApp Message ID: ${response.data.messageId || 'N/A'}`);
        console.log(`👨‍⚕️ Sent to: Dr. ${this.getDoctorDisplayName(response.data.doctor)} (${response.data.doctor.phone})`);
      } else {
        throw new Error(`WhatsApp test failed: ${response.data.message}`);
      }
      
    } catch (error) {
      if (error.response) {
        throw new Error(`WhatsApp test failed: ${error.response.data.message || error.response.statusText}`);
      }
      throw error;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    if (this.serviceRequestId) {
      try {
        await axios.put(`${API_BASE}/service-requests/${this.serviceRequestId}/cancel`, {
          reason: 'Test cleanup'
        });
        console.log('✅ Test service request cancelled');
      } catch (error) {
        console.warn('⚠️  Could not cancel test service request:', error.message);
      }
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new WhatsAppTester();
  tester.runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = WhatsAppTester;
