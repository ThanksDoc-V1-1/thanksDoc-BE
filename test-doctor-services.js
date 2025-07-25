const axios = require('axios');

async function testDoctorAPI() {
  try {
    console.log('Testing doctor API with services population...');
    
    const response = await axios.get('http://localhost:1337/api/doctors/1?populate=services');
    
    console.log('Status:', response.status);
    console.log('Response structure:');
    console.log('- data:', typeof response.data);
    console.log('- data.data:', typeof response.data.data);
    
    const doctor = response.data.data;
    console.log('\nDoctor data:');
    console.log('- ID:', doctor.id);
    console.log('- Email:', doctor.email);
    console.log('- Services:', doctor.services);
    console.log('- Services type:', typeof doctor.services);
    console.log('- Services length:', doctor.services?.length);
    
    console.log('\nFull response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDoctorAPI();
