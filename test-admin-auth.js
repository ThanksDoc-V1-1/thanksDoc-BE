// Test script to check admin authentication and permissions

const axios = require('axios');

async function testAdminAuth() {
  try {
    // First, try to login as admin
    console.log('🔑 Attempting admin login...');
    const loginResponse = await axios.post('http://localhost:1337/api/auth/login', {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    
    console.log('✅ Admin login successful!');
    console.log('🔑 JWT Token:', loginResponse.data.jwt.substring(0, 50) + '...');
    console.log('👤 User:', loginResponse.data.user);
    
    const jwt = loginResponse.data.jwt;
    
    // Test getting services with admin token
    console.log('\n📦 Testing service GET with admin token...');
    const getResponse = await axios.get('http://localhost:1337/api/services', {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    console.log('✅ GET services successful:', getResponse.data.data?.length, 'services found');
    
    // Test updating a service with admin token
    console.log('\n📝 Testing service UPDATE with admin token...');
    const updateResponse = await axios.put('http://localhost:1337/api/services/2', {
      data: {
        name: 'Test Update via Admin',
        description: 'Test description',
        category: 'in-person',
        isActive: true,
        displayOrder: 1
      }
    }, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    console.log('✅ UPDATE service successful:', updateResponse.status);
    
    // Test creating a service with admin token
    console.log('\n🆕 Testing service CREATE with admin token...');
    const createResponse = await axios.post('http://localhost:1337/api/services', {
      data: {
        name: 'Test New Service',
        description: 'Test new service description',
        category: 'online',
        isActive: true,
        displayOrder: 99
      }
    }, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    console.log('✅ CREATE service successful:', createResponse.status);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAdminAuth();
