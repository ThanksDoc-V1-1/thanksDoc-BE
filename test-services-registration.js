// Test doctor registration with services
const axios = require('axios');

async function testDoctorRegistrationWithServices() {
  console.log('🧪 Testing doctor registration with services...\n');

  const testData = {
    type: 'doctor',
    firstName: 'ServiceTest',
    lastName: 'Doctor',
    name: 'ServiceTest Doctor',
    email: 'servicetest-doctor-' + Date.now() + '@example.com',
    password: 'password123',
    phone: '+447123456789',
    licenseNumber: 'TEST-SVC-' + Date.now(),
    address: '123 Service Street, Test Area',
    city: 'London',
    state: 'Greater London',
    zipCode: 'SW1A 1AA',
    latitude: 51.5074,
    longitude: -0.1278,
    services: [2, 4, 6], // Valid service IDs from our previous check
    selectedServices: [2, 4, 6] // Frontend sends both
  };

  console.log('📤 Sending registration data with services:');
  console.log('Services to connect:', testData.services);
  console.log('');

  try {
    const response = await axios.post('http://localhost:1337/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    // Now let's verify the doctor has the services connected
    const doctorId = response.data.user.id;
    console.log('\n🔍 Verifying services are connected to doctor...');
    
    try {
      // Check if we can fetch the doctor with services
      const doctorCheck = await axios.get(`http://localhost:1337/api/doctors/${doctorId}?populate=services`);
      
      if (doctorCheck.data.data.services && doctorCheck.data.data.services.length > 0) {
        console.log('✅ Services successfully connected!');
        console.log('Connected services:', doctorCheck.data.data.services.map(s => `ID: ${s.id}, Name: ${s.name}`));
      } else {
        console.log('❌ No services found connected to doctor');
      }
    } catch (verifyError) {
      console.log('❌ Could not verify services connection:', verifyError.message);
    }

  } catch (error) {
    console.error('❌ Registration failed!');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testDoctorRegistrationWithServices();
