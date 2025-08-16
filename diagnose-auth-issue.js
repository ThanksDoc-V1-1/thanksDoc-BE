const axios = require('axios');

const PRODUCTION_URL = 'https://thanksdoc-be-production.up.railway.app';

async function diagnoseAuthenticationIssue() {
  console.log('🔍 Diagnosing Authentication Issue');
  console.log('🎯 Target:', PRODUCTION_URL);
  console.log('=' .repeat(60));

  // Test different endpoints without authentication
  const endpoints = [
    '/api/doctors',
    '/api/businesses', 
    '/api/services',
    '/api/business-types',
    '/api/system-settings',
    '/api/system-settings/public',
    '/api/compliance-document-types'
  ];

  console.log('\n📊 Testing endpoints WITHOUT authentication:');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${PRODUCTION_URL}${endpoint}`);
      const count = response.data?.data?.length || 0;
      console.log(`✅ ${endpoint}: ${response.status} (${count} records)`);
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      console.log(`❌ ${endpoint}: ${status} (${error.response?.data?.error?.message || error.message})`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Test the specific system-settings issue
  console.log('\n🔍 Specific System Settings Analysis:');
  
  try {
    // Try the public endpoint (should work)
    const publicResponse = await axios.get(`${PRODUCTION_URL}/api/system-settings/public`);
    console.log(`✅ Public system settings: ${publicResponse.status} (${publicResponse.data?.length || 0} settings)`);
    
    // Try the main endpoint (failing with 401)
    const mainResponse = await axios.get(`${PRODUCTION_URL}/api/system-settings`);
    console.log(`✅ Main system settings: ${mainResponse.status} (${mainResponse.data?.data?.length || 0} settings)`);
    
  } catch (error) {
    console.log(`❌ Main system settings: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
  }

  console.log('\n💡 Diagnosis:');
  console.log('The issue is that /api/system-settings requires authentication');
  console.log('while the admin dashboard expects it to work without auth.');
  console.log('');
  console.log('🔧 Solution options:');
  console.log('1. Add auth: false to system-settings routes');
  console.log('2. Fix admin dashboard to send proper auth headers');
  console.log('3. Create an admin user in the new database');
}

diagnoseAuthenticationIssue().catch(console.error);
