// Simple test to check service API response structure
const axios = require('axios');

const API_URL = 'http://localhost:1337/api';

async function testServiceAPI() {
  try {
    console.log('Testing service API...');
    
    const response = await axios.get(`${API_URL}/services?filters[category][$eq]=in-person&sort=displayOrder:asc`);
    
    console.log('Response status:', response.status);
    console.log('Response data structure:');
    console.log('- response.data:', typeof response.data);
    console.log('- response.data.data:', typeof response.data.data);
    console.log('- response.data.data length:', response.data.data?.length);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\nFirst service:');
      console.log('- ID:', response.data.data[0].id);
      console.log('- Name:', response.data.data[0].name);
      console.log('- Category:', response.data.data[0].category);
    }
    
    console.log('\nFull response.data structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testServiceAPI();
