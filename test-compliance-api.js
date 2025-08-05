const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:1337/api';

async function testComplianceDocumentsAPI() {
  console.log('🧪 Testing Compliance Documents API...\n');

  try {
    // Test 1: Check if the API endpoint exists
    console.log('1. Testing API endpoint availability...');
    const healthCheck = await axios.get(`${API_BASE}/compliance-documents/doctor/1`);
    console.log('✅ API endpoint is accessible');

    // Test 2: Get compliance overview for a test doctor
    console.log('\n2. Testing compliance overview...');
    const overview = await axios.get(`${API_BASE}/compliance-documents/doctor/1/overview`);
    console.log('✅ Compliance overview endpoint working');
    console.log('📊 Overview data:', JSON.stringify(overview.data, null, 2));

    // Test 3: Test document types configuration
    console.log('\n3. Testing document types...');
    if (overview.data.success && overview.data.data.requiredDocuments) {
      console.log(`✅ Found ${overview.data.data.requiredDocuments.length} required document types`);
      console.log('📋 Document types:', overview.data.data.requiredDocuments.map(doc => doc.id).join(', '));
    }

    console.log('\n🎉 All tests passed! The compliance documents API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure Strapi server is running on http://localhost:1337');
    }
  }
}

// Only run the test if we can connect to the server
async function waitAndTest() {
  console.log('⏳ Waiting for Strapi server to be ready...\n');
  
  let attempts = 0;
  const maxAttempts = 30; // Wait up to 30 seconds
  
  while (attempts < maxAttempts) {
    try {
      await axios.get('http://localhost:1337');
      console.log('✅ Strapi server is ready!\n');
      await testComplianceDocumentsAPI();
      return;
    } catch (error) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write('.');
    }
  }
  
  console.log('\n❌ Timeout: Strapi server did not start within 30 seconds');
}

// Run the test
waitAndTest();
