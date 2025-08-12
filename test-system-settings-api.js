const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:1337/api';

async function testSystemSettingsEndpoints() {
  console.log('🧪 Testing system settings endpoints...');
  console.log('📡 API Base URL:', API_BASE_URL);
  
  try {
    // Test public endpoint
    console.log('\n1️⃣ Testing public endpoint...');
    const publicResponse = await axios.get(`${API_BASE_URL}/system-settings/public`);
    console.log('✅ Public endpoint response:', {
      status: publicResponse.status,
      data: publicResponse.data
    });
    
    // Test authenticated endpoint (without auth - should fail or require permissions)
    console.log('\n2️⃣ Testing authenticated endpoint (without auth)...');
    try {
      const authResponse = await axios.get(`${API_BASE_URL}/system-settings`);
      console.log('⚠️  Authenticated endpoint response (no auth):', {
        status: authResponse.status,
        dataCount: Array.isArray(authResponse.data?.data) ? authResponse.data.data.length : 'not array',
        fullData: authResponse.data
      });
    } catch (authError) {
      console.log('❌ Expected error on authenticated endpoint without auth:', {
        status: authError.response?.status,
        message: authError.message,
        data: authError.response?.data
      });
    }
    
    // Test individual setting by key (public access)
    console.log('\n3️⃣ Testing individual setting by key...');
    try {
      const keyResponse = await axios.get(`${API_BASE_URL}/system-settings/key/booking_fee`);
      console.log('✅ Setting by key response:', {
        status: keyResponse.status,
        data: keyResponse.data
      });
    } catch (keyError) {
      console.log('❌ Error getting setting by key:', {
        status: keyError.response?.status,
        message: keyError.message,
        data: keyError.response?.data
      });
    }

  } catch (error) {
    console.error('💥 Fatal error during testing:', error.message);
  }
}

// Run the test
testSystemSettingsEndpoints()
  .then(() => {
    console.log('\n🎉 API testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 API testing failed:', error.message);
    process.exit(1);
  });
