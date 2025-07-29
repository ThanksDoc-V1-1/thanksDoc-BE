const axios = require('axios');

async function checkServices() {
  let authToken = null;
  
  try {
    // Step 1: Login as admin to get JWT token
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:1337/api/auth/local', {
      identifier: 'admin@gmail.com',
      password: '12345678'
    });
    
    authToken = loginResponse.data.jwt;
    console.log('✅ Admin login successful, token received');
    
    // Step 2: Check existing services
    console.log('\n🔍 Checking existing services...');
    const response = await axios.get('http://localhost:1337/api/services?populate=*');
    console.log('✅ Services found:', response.data.data?.length || 0);
    
    if (response.data.data) {
      response.data.data.forEach(service => {
        console.log(`- ID: ${service.id}, Name: ${service.name}, DocumentID: ${service.documentId}`);
      });
    }
    
    // Step 3: Test updating service using documentId (Strapi v5 approach)
    console.log('\n🧪 Testing update service using documentId (Strapi v5)...');
    try {
      const updateResponse = await axios.put('http://localhost:1337/api/services/tbw8r0yw5afxodfmfayi5kjr', {
        data: {
          name: 'Private Prescriptions Updated',
          description: 'Updated description',
          category: 'in-person',
          isActive: true,
          displayOrder: 1
        }
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Update with documentId successful:', updateResponse.status);
      console.log('✅ Updated service:', updateResponse.data.data);
    } catch (updateError) {
      console.error('❌ Update with documentId failed:', updateError.response?.status);
      console.error('❌ Update error details:', updateError.response?.data);
    }
    
    // Step 4: Test creating a new service
    console.log('\n🧪 Testing create new service...');
    try {
      const createResponse = await axios.post('http://localhost:1337/api/services', {
        data: {
          name: 'Test Service Created',
          description: 'This is a test service',
          category: 'online',
          isActive: true,
          displayOrder: 99
        }
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Create successful:', createResponse.status);
      console.log('✅ Created service:', createResponse.data.data);
    } catch (createError) {
      console.error('❌ Create failed:', createError.response?.status);
      console.error('❌ Create error details:', createError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

checkServices();
