const axios = require('axios');

const BASE_URL = 'https://thanksdoc-be-production.up.railway.app';

async function testDoctorDataAccess() {
  try {
    console.log('🔍 Testing Doctor Data Access with Coordinates');
    
    // Test the API endpoint that fetches doctor details like the controller would
    const response = await axios.get(`${BASE_URL}/api/doctors/4`);
    
    console.log('📊 Doctor API Response:');
    console.log('Doctor ID:', response.data.data.id);
    console.log('Name:', response.data.data.name);
    console.log('Email:', response.data.data.email);
    console.log('Phone:', response.data.data.phone);
    console.log('Latitude:', response.data.data.latitude);
    console.log('Longitude:', response.data.data.longitude);
    console.log('Address:', response.data.data.address);
    
    console.log('\n✅ Doctor data access test completed');
    
    // Also test business data
    console.log('\n🏢 Testing Business Data Access:');
    const businessResponse = await axios.get(`${BASE_URL}/api/businesses/6`);
    
    console.log('Business ID:', businessResponse.data.data.id);
    console.log('Name:', businessResponse.data.data.businessName);
    console.log('Email:', businessResponse.data.data.email);
    console.log('Latitude:', businessResponse.data.data.latitude);
    console.log('Longitude:', businessResponse.data.data.longitude);
    console.log('Address:', businessResponse.data.data.address);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDoctorDataAccess();
