// Debug frontend-backend communication
const axios = require('axios');

async function debugRegistrationFlow() {
  console.log('🔍 Debugging doctor registration flow...\n');
  
  // Test 1: Check if backend is accessible
  console.log('1️⃣ Testing backend connectivity...');
  try {
    const healthCheck = await axios.get('http://localhost:1337/api/doctors', {
      timeout: 5000
    });
    console.log('✅ Backend is accessible');
  } catch (error) {
    console.log('❌ Backend connectivity issue:', error.message);
    return;
  }

  // Test 2: Simulate frontend registration data
  console.log('\n2️⃣ Testing with realistic frontend data...');
  
  const frontendLikeData = {
    type: 'doctor',
    firstName: 'John',
    lastName: 'Smith', 
    name: 'John Smith',
    email: 'john.smith.test' + Date.now() + '@example.com',
    password: 'password123',
    phone: '+447123456789',
    licenseNumber: 'GMC-12345-' + Date.now(),
    bio: 'Experienced doctor',
    languages: ['English'],
    certifications: [],
    // Address data as sent from frontend
    address: '123 High Street, Central Area',
    city: 'London',
    state: 'Greater London',
    zipCode: 'SW1A 1AA',
    latitude: 51.5074,
    longitude: -0.1278,
    // Services array as sent from frontend
    services: [1, 2, 3], // Example service IDs
    selectedServices: [1, 2, 3] // This might be what frontend sends
  };

  console.log('📤 Frontend-like registration data:');
  console.log(JSON.stringify(frontendLikeData, null, 2));
  console.log('');

  try {
    const response = await axios.post('http://localhost:1337/api/auth/register', frontendLikeData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Registration successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Registration failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
  }

  // Test 3: Check what the actual error was from browser
  console.log('\n3️⃣ To debug the browser error:');
  console.log('1. Open browser developer console');
  console.log('2. Go to Network tab');
  console.log('3. Try to register a doctor');
  console.log('4. Look at the failed request details');
  console.log('5. Check the request payload and response');
  console.log('\n💡 Common issues:');
  console.log('- Missing required fields');
  console.log('- Invalid data types (string vs number)');
  console.log('- CORS issues');
  console.log('- Network connectivity problems');
}

debugRegistrationFlow();
