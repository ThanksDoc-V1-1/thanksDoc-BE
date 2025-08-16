const axios = require('axios');

const PRODUCTION_URL = 'https://thanksdoc-be-production.up.railway.app/api';

const services = [
  // In-person services
  { name: 'Private Prescriptions', category: 'in-person', isActive: true, displayOrder: 1, duration: 30, price: 25.00 },
  { name: 'Phlebotomy', category: 'in-person', isActive: true, displayOrder: 2, duration: 20, price: 35.00 }
];

async function testServiceCreation() {
  console.log('🧪 Testing service creation...');
  
  const service = services[0]; // Test with first service
  
  try {
    console.log('Attempting to create:', JSON.stringify(service, null, 2));
    
    const response = await axios.post(`${PRODUCTION_URL}/services`, {
      data: service
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success!', response.data);
  } catch (error) {
    console.error('❌ Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Headers:', error.response?.headers);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full error:', error.message);
  }
}

testServiceCreation();
