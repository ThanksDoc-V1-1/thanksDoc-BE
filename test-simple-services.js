// Simple test with services and better error handling
const axios = require('axios');

async function testWithServices() {
  console.log('🧪 Testing doctor registration with services (simplified)...\n');

  const testData = {
    type: 'doctor',
    firstName: 'John',
    lastName: 'Serviceman',
    email: 'serviceman-' + Date.now() + '@example.com',
    password: 'password123',
    phone: '+447123456789',
    licenseNumber: 'SVC-' + Date.now(),
    address: '123 Service Street',
    city: 'London',
    state: 'Greater London',
    zipCode: 'SW1A 1AA',
    latitude: 51.5074,
    longitude: -0.1278,
    selectedServices: [2, 4] // Valid service IDs
  };

  console.log('📤 Sending data with selectedServices:', testData.selectedServices);

  try {
    const response = await axios.post('http://localhost:1337/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Registration successful!');
    console.log('📊 Doctor ID:', response.data.user.id);
    
    // Check the backend logs for service connection messages
    console.log('\n💡 Check the Strapi backend logs for:');
    console.log('   - "🔍 Validating services:"');
    console.log('   - "✅ Valid services found:"');
    console.log('   - "🔗 Connecting services to doctor:"');
    console.log('   - "✅ Services connected successfully"');

  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('❌ Cannot connect to backend. Is Strapi running on port 1337?');
    } else if (error.response) {
      console.error('❌ Registration failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

testWithServices();
