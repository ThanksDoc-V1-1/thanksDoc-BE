// Test doctor registration with detailed error logging
const axios = require('axios');

async function testDoctorRegistration() {
  console.log('🧪 Testing doctor registration...\n');

  const testData = {
    type: 'doctor',
    firstName: 'Test',
    lastName: 'Doctor',
    name: 'Test Doctor',
    email: 'test-doctor-' + Date.now() + '@example.com',
    password: 'password123',
    phone: '+447123456789',
    licenseNumber: 'TEST-LIC-' + Date.now(),
    address: '123 Test Street, Test Area',
    city: 'London',
    state: 'Greater London',
    zipCode: 'SW1A 1AA',
    latitude: 51.5074,
    longitude: -0.1278
  };

  console.log('📤 Sending registration data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');

  try {
    const response = await axios.post('http://localhost:1337/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Registration failed!');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
    
    if (error.response?.data?.error?.details) {
      console.error('Detailed errors:');
      console.error(JSON.stringify(error.response.data.error.details, null, 2));
    }
  }
}

testDoctorRegistration();
