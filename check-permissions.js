const axios = require('axios');

async function checkAndFixPermissions() {
  let authToken = null;
  
  try {
    // Step 1: Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:1337/api/auth/local', {
      identifier: 'admin@gmail.com',
      password: '12345678'
    });
    
    authToken = loginResponse.data.jwt;
    console.log('✅ Admin login successful');
    
    // Step 2: Check user role
    console.log('\n👤 Checking user role...');
    const userResponse = await axios.get('http://localhost:1337/api/users/me?populate=role', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('User role:', userResponse.data.role?.name || 'No role');
    console.log('User ID:', userResponse.data.id);
    
    // Step 3: Try to create service with more detailed error info
    console.log('\n🧪 Testing service creation with detailed logging...');
    try {
      const createResponse = await axios.post('http://localhost:1337/api/services', {
        data: {
          name: 'Test Service ' + Date.now(),
          description: 'Test description',
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
      console.log('✅ Service creation successful!');
      console.log('Created service:', createResponse.data.data);
    } catch (createError) {
      console.error('❌ Service creation failed');
      console.error('Status:', createError.response?.status);
      console.error('Error details:', createError.response?.data);
      
      if (createError.response?.status === 403) {
        console.log('\n🔧 This appears to be a permissions issue.');
        console.log('You need to configure permissions in the Strapi admin panel:');
        console.log('1. Go to http://localhost:1337/admin');
        console.log('2. Go to Settings > Users & Permissions Plugin > Roles');
        console.log('3. Edit the "Authenticated" role');
        console.log('4. Under "Service" permissions, enable:');
        console.log('   - find (to read services)');
        console.log('   - create (to create services)');
        console.log('   - update (to update services)');
        console.log('   - delete (to delete services)');
        console.log('5. Save the role');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

checkAndFixPermissions();
