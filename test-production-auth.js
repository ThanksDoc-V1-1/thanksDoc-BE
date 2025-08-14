const axios = require('axios');

async function testLogin() {
  const productionUrl = 'https://king-prawn-app-mokx8.ondigitalocean.app';
  
  console.log('🔐 Testing login methods for production...');
  console.log('🌐 URL:', productionUrl);
  
  // Test custom auth endpoint
  try {
    console.log('\n1. Testing custom auth endpoint (/api/auth/login)...');
    const customAuth = await axios.post(`${productionUrl}/api/auth/login`, {
      email: 'admin@gmail.com',
      password: '12345678'
    });
    console.log('✅ Custom auth successful');
    console.log('User:', customAuth.data.user);
    console.log('Token:', customAuth.data.jwt.substring(0, 50) + '...');
    return { method: 'custom', token: customAuth.data.jwt };
  } catch (error) {
    console.log('❌ Custom auth failed:', error.response?.data?.error?.message || error.message);
  }
  
  // Test Strapi auth endpoint
  try {
    console.log('\n2. Testing Strapi auth endpoint (/api/auth/local)...');
    const strapiAuth = await axios.post(`${productionUrl}/api/auth/local`, {
      identifier: 'admin@gmail.com',
      password: '12345678'
    });
    console.log('✅ Strapi auth successful');
    console.log('User:', strapiAuth.data.user);
    console.log('Token:', strapiAuth.data.jwt.substring(0, 50) + '...');
    return { method: 'strapi', token: strapiAuth.data.jwt };
  } catch (error) {
    console.log('❌ Strapi auth failed:', error.response?.data?.error?.message || error.message);
  }
  
  // Test admin login
  try {
    console.log('\n3. Testing admin login endpoint (/admin/login)...');
    const adminAuth = await axios.post(`${productionUrl}/admin/login`, {
      email: 'admin@gmail.com',
      password: '12345678'
    });
    console.log('✅ Admin auth successful');
    console.log('Data:', adminAuth.data.data);
    console.log('Token:', adminAuth.data.data.token.substring(0, 50) + '...');
    return { method: 'admin', token: adminAuth.data.data.token };
  } catch (error) {
    console.log('❌ Admin auth failed:', error.response?.data?.error?.message || error.message);
  }

  throw new Error('All authentication methods failed');
}

async function testAPI(authResult) {
  const productionUrl = 'https://king-prawn-app-mokx8.ondigitalocean.app';
  
  console.log(`\n🧪 Testing API access with ${authResult.method} token...`);
  
  const headers = {
    'Authorization': `Bearer ${authResult.token}`,
    'Content-Type': 'application/json'
  };

  // Test business types API
  try {
    const response = await axios.get(`${productionUrl}/api/business-types`, { headers });
    console.log('✅ Business Types API works - Found', response.data.data.length, 'items');
  } catch (error) {
    console.log('❌ Business Types API failed:', error.response?.status, error.response?.data?.error?.message);
  }
}

async function createAdminUser() {
  const productionUrl = 'https://king-prawn-app-mokx8.ondigitalocean.app';
  
  console.log('🔧 Attempting to create admin user on production...');
  
  // Try custom auth register
  try {
    console.log('\n1. Trying custom auth register (/api/auth/register)...');
    const response = await axios.post(`${productionUrl}/api/auth/register`, {
      type: 'admin',
      email: 'admin@gmail.com',
      password: '12345678',
      name: 'Admin User'
    });
    console.log('✅ Admin user created via custom auth');
    console.log('User:', response.data.user);
    return response.data;
  } catch (error) {
    console.log('❌ Custom register failed:', error.response?.data?.error?.message || error.message);
  }
  
  // Try Strapi auth register
  try {
    console.log('\n2. Trying Strapi auth register (/api/auth/local/register)...');
    const response = await axios.post(`${productionUrl}/api/auth/local/register`, {
      username: 'admin',
      email: 'admin@gmail.com',
      password: '12345678'
    });
    console.log('✅ Admin user created via Strapi auth');
    console.log('User:', response.data.user);
    return response.data;
  } catch (error) {
    console.log('❌ Strapi register failed:', error.response?.data?.error?.message || error.message);
  }
  
  // Try admin register
  try {
    console.log('\n3. Trying admin register (/admin/register)...');
    const response = await axios.post(`${productionUrl}/admin/register`, {
      email: 'admin@gmail.com',
      password: '12345678',
      firstname: 'Admin',
      lastname: 'User'
    });
    console.log('✅ Admin user created via admin register');
    console.log('User:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Admin register failed:', error.response?.data?.error?.message || error.message);
  }
  
  throw new Error('Could not create admin user');
}

async function main() {
  try {
    // First try to login
    let authResult;
    try {
      authResult = await testLogin();
    } catch (error) {
      console.log('\n🔧 Login failed, trying to create admin user first...');
      await createAdminUser();
      console.log('\n🔄 Retrying login after user creation...');
      authResult = await testLogin();
    }
    
    await testAPI(authResult);
  } catch (error) {
    console.error('\n💥 All tests failed:', error.message);
  }
}

main();
