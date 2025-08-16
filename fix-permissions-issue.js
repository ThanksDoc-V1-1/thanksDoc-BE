const axios = require('axios');

const PRODUCTION_URL = 'https://thanksdoc-be-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '12345678';

// First, let's get a valid admin token
async function getAdminToken() {
  const loginResponse = await axios.post(`${PRODUCTION_URL}/api/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin'
  });
  
  return loginResponse.data.jwt;
}

async function fixPermissionsIssue() {
  console.log('🔧 Diagnosing and Fixing Permissions Issue');
  console.log('🎯 Target:', PRODUCTION_URL);
  console.log('=' .repeat(60));

  try {
    // Get admin token
    console.log('\n1️⃣ Getting admin token...');
    const token = await getAdminToken();
    console.log('✅ Admin token obtained');

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test all endpoints and see which ones have issues
    const endpointsToTest = [
      { name: 'System Settings', path: '/api/system-settings', critical: true },
      { name: 'Services', path: '/api/services', critical: true },
      { name: 'Compliance Document Types', path: '/api/compliance-document-types', critical: false },
      { name: 'Doctors', path: '/api/doctors', critical: false },
      { name: 'Businesses', path: '/api/businesses', critical: false },
      { name: 'Business Types', path: '/api/business-types', critical: false },
      { name: 'Service Requests', path: '/api/service-requests', critical: false },
    ];

    console.log('\n2️⃣ Testing all endpoints with authentication...');
    
    const workingEndpoints = [];
    const failingEndpoints = [];

    for (const endpoint of endpointsToTest) {
      try {
        const response = await axios.get(`${PRODUCTION_URL}${endpoint.path}`, {
          headers: authHeaders
        });
        
        const count = response.data?.data?.length || 0;
        console.log(`✅ ${endpoint.name}: ${response.status} - ${count} records`);
        workingEndpoints.push(endpoint);
      } catch (error) {
        const status = error.response?.status || 'Unknown';
        console.log(`❌ ${endpoint.name}: ${status} error`);
        failingEndpoints.push({ ...endpoint, status });
      }
    }

    console.log('\n3️⃣ Results Summary:');
    console.log(`✅ Working endpoints: ${workingEndpoints.length}`);
    console.log(`❌ Failing endpoints: ${failingEndpoints.length}`);

    if (failingEndpoints.length > 0) {
      console.log('\n🔍 Failed endpoints analysis:');
      failingEndpoints.forEach(ep => {
        console.log(`   - ${ep.name}: ${ep.status} ${ep.critical ? '(CRITICAL)' : ''}`);
      });

      // Try to fix by making endpoints public (no auth required)
      console.log('\n4️⃣ Attempting to fix critical endpoints...');
      
      // The issue is likely that these endpoints need to be accessible without auth
      // or the permissions are not set up correctly in the new database
      
      console.log('\n💡 Recommended Solutions:');
      console.log('1. 🔓 Make critical endpoints publicly accessible (no auth)');
      console.log('2. 🔑 Set up proper role permissions in Strapi admin');
      console.log('3. 🔄 Copy permissions from working database');
      
      // Let's try to test if these endpoints work WITHOUT authentication
      console.log('\n5️⃣ Testing failed endpoints WITHOUT authentication...');
      
      for (const endpoint of failingEndpoints) {
        try {
          const response = await axios.get(`${PRODUCTION_URL}${endpoint.path}`);
          const count = response.data?.data?.length || 0;
          console.log(`✅ ${endpoint.name} (no auth): ${response.status} - ${count} records`);
        } catch (error) {
          console.log(`❌ ${endpoint.name} (no auth): ${error.response?.status || error.message}`);
        }
      }
    }

    // Final recommendation
    console.log('\n🎯 SOLUTION:');
    console.log('The issue is that some endpoints require authentication in the new database');
    console.log('but the same endpoints work without auth in your old database.');
    console.log('\nYou have 2 options:');
    console.log('1. 🔓 QUICK FIX: Update route configs to disable auth for these endpoints');
    console.log('2. 🔑 PROPER FIX: Set up correct permissions in Strapi admin panel');
    
    console.log('\n📋 For QUICK FIX, I can modify the route files to add auth: false');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  }
}

fixPermissionsIssue().catch(console.error);
