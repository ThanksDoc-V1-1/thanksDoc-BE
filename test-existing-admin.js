const axios = require('axios');

const PRODUCTION_URL = 'https://thanksdoc-be-production.up.railway.app';

// Admin credentials
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '12345678';

async function testExistingAdminLogin() {
  console.log('🔐 Testing Existing Admin Login');
  console.log('🎯 Target:', PRODUCTION_URL);
  console.log('👤 Email:', ADMIN_EMAIL);
  console.log('=' .repeat(60));

  try {
    // Step 1: Test admin login
    console.log('\n1️⃣ Testing admin login...');
    
    const loginResponse = await axios.post(`${PRODUCTION_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });

    if (loginResponse.data && (loginResponse.data.token || loginResponse.data.jwt)) {
      const token = loginResponse.data.token || loginResponse.data.jwt;
      console.log('✅ Admin login successful!');
      console.log('🎫 Token received:', token.substring(0, 20) + '...');
      
      // Step 2: Test authenticated API calls
      console.log('\n2️⃣ Testing authenticated API calls...');
      
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Test system-settings with authentication
      try {
        console.log('\n📊 Testing /api/system-settings with auth...');
        const systemSettingsResponse = await axios.get(`${PRODUCTION_URL}/api/system-settings`, {
          headers: authHeaders
        });
        
        console.log(`✅ System settings: ${systemSettingsResponse.status} - ${systemSettingsResponse.data?.data?.length || 0} records`);
      } catch (error) {
        console.log(`❌ System settings failed: ${error.response?.status || error.message}`);
      }

      // Test compliance document types with authentication
      try {
        console.log('\n📋 Testing /api/compliance-document-types with auth...');
        const complianceResponse = await axios.get(`${PRODUCTION_URL}/api/compliance-document-types`, {
          headers: authHeaders
        });
        
        console.log(`✅ Compliance types: ${complianceResponse.status} - ${complianceResponse.data?.data?.length || 0} records`);
      } catch (error) {
        console.log(`❌ Compliance types failed: ${error.response?.status || error.message}`);
      }

      // Test other endpoints with authentication
      const testEndpoints = [
        { name: 'Doctors', path: '/api/doctors' },
        { name: 'Businesses', path: '/api/businesses' },
        { name: 'Services', path: '/api/services' },
        { name: 'Business Types', path: '/api/business-types' }
      ];

      console.log('\n3️⃣ Testing other endpoints with auth...');
      for (const endpoint of testEndpoints) {
        try {
          const response = await axios.get(`${PRODUCTION_URL}${endpoint.path}`, {
            headers: authHeaders
          });
          
          const count = response.data?.data?.length || 0;
          console.log(`✅ ${endpoint.name}: ${response.status} - ${count} records`);
        } catch (error) {
          console.log(`❌ ${endpoint.name} failed: ${error.response?.status || error.message}`);
        }
      }

      // Step 3: Check token validity and user info
      console.log('\n4️⃣ Testing token validity...');
      try {
        const userResponse = await axios.get(`${PRODUCTION_URL}/api/auth/me`, {
          headers: authHeaders
        });
        
        console.log('✅ Token is valid!');
        console.log('👤 User info:', {
          id: userResponse.data?.id,
          email: userResponse.data?.email,
          role: userResponse.data?.role
        });
      } catch (error) {
        console.log(`❌ Token validation failed: ${error.response?.status || error.message}`);
      }

      console.log('\n🎉 Authentication Summary:');
      console.log('✅ Admin login working');
      console.log('🎫 JWT token generated successfully');
      console.log('💡 The issue might be with how the frontend stores/sends the token');
      
      console.log('\n🔧 Next Steps for Frontend:');
      console.log('1. Check if localStorage/sessionStorage has the token');
      console.log('2. Verify Authorization header is being sent');
      console.log('3. Check if token is being refreshed properly');
      console.log('4. Clear browser cache/localStorage and login again');

    } else {
      console.log('❌ Login failed - no token in response');
      console.log('📋 Response:', loginResponse.data);
    }

  } catch (error) {
    console.log('❌ Admin login failed!');
    console.log('📋 Status:', error.response?.status);
    console.log('📋 Error:', error.response?.data?.error?.message || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n🔍 Possible issues:');
      console.log('- Wrong email/password');
      console.log('- User needs email verification');
      console.log('- Account might be blocked');
      console.log('- Wrong API endpoint');
    }

    // Try alternative login endpoint
    console.log('\n🔄 Trying alternative admin login...');
    try {
      const altLoginResponse = await axios.post(`${PRODUCTION_URL}/admin/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      
      console.log('✅ Alternative admin login successful!');
      console.log('📋 Response:', altLoginResponse.data);
    } catch (altError) {
      console.log('❌ Alternative login also failed:', altError.response?.status || altError.message);
    }
  }
}

// Also test if we can create admin user
async function testAdminUserCreation() {
  console.log('\n' + '=' .repeat(60));
  console.log('🆕 Testing Admin User Creation (if needed)');
  
  try {
    const createResponse = await axios.post(`${PRODUCTION_URL}/api/auth/register`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      type: 'admin'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Response:', createResponse.data);
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('already exists')) {
      console.log('✅ Admin user already exists - this is good!');
    } else {
      console.log('❌ Admin user creation failed:', error.response?.data?.error?.message || error.message);
    }
  }
}

async function runAuthDiagnosis() {
  await testExistingAdminLogin();
  await testAdminUserCreation();
}

runAuthDiagnosis().catch(console.error);
