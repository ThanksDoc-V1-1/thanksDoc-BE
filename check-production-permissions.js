const axios = require('axios');

async function checkPermissions() {
  const productionUrl = 'https://king-prawn-app-mokx8.ondigitalocean.app';
  
  console.log('🔍 Checking production API permissions...');
  
  // Login first
  const loginResponse = await axios.post(`${productionUrl}/api/auth/local`, {
    identifier: 'admin@gmail.com',
    password: '12345678'
  });
  
  const token = loginResponse.data.jwt;
  const headers = { 'Authorization': `Bearer ${token}` };
  
  console.log('✅ Authentication successful');
  console.log('🎫 Token:', token.substring(0, 50) + '...');
  
  // Test each API endpoint
  const endpoints = [
    'business-types',
    'compliance-document-types', 
    'system-settings',
    'services'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📊 Testing ${endpoint}:`);
      
      // Test GET (read)
      try {
        const getResponse = await axios.get(`${productionUrl}/api/${endpoint}`, { headers });
        console.log(`   ✅ GET: ${getResponse.data.data.length} items found`);
      } catch (getError) {
        console.log(`   ❌ GET: ${getError.response?.status} - ${getError.response?.data?.error?.message || getError.message}`);
      }
      
      // Test POST (create) with minimal data
      try {
        const testData = {
          data: {
            name: 'Test Item ' + Date.now(),
            description: 'Test description',
            ...(endpoint === 'system-settings' && { key: 'test_key_' + Date.now(), value: 'test' }),
            ...(endpoint === 'services' && { category: 'test' })
          }
        };
        
        const postResponse = await axios.post(`${productionUrl}/api/${endpoint}`, testData, { headers });
        console.log(`   ✅ POST: Test item created (ID: ${postResponse.data.data.id})`);
        
        // Clean up - delete the test item
        try {
          await axios.delete(`${productionUrl}/api/${endpoint}/${postResponse.data.data.id}`, { headers });
          console.log(`   🧹 Test item deleted`);
        } catch (deleteError) {
          console.log(`   ⚠️ Could not delete test item: ${deleteError.response?.data?.error?.message}`);
        }
        
      } catch (postError) {
        console.log(`   ❌ POST: ${postError.response?.status} - ${postError.response?.data?.error?.message || postError.message}`);
      }
    } catch (error) {
      console.log(`   💥 Error testing ${endpoint}:`, error.message);
    }
  }
  
  console.log('\n💡 To fix permissions, go to:');
  console.log('🌐 ' + productionUrl + '/admin');
  console.log('📋 Settings → Users & Permissions Plugin → Roles → Authenticated');
  console.log('✅ Enable CREATE, READ, UPDATE, DELETE for each content type');
}

checkPermissions().catch(console.error);
