const axios = require('axios');

const DESTINATION_URL = 'https://thanksdoc-be-production.up.railway.app/api';

async function examineDestinationEndpoints() {
  console.log('🔍 Examining destination backend endpoints...');
  
  const endpoints = ['doctors', 'businesses', 'users'];
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing ${endpoint} endpoint:`);
    
    try {
      // Try to get existing data
      const response = await axios.get(`${DESTINATION_URL}/${endpoint}?pagination[pageSize]=1`);
      console.log(`✅ ${endpoint} endpoint exists`);
      console.log(`   Records found: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log(`   Sample structure:`, Object.keys(response.data.data[0]));
      }
      
      // Check if we can get the schema/structure info
      if (response.data.meta) {
        console.log(`   Meta info:`, response.data.meta);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} endpoint error:`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

async function checkStrapiInfo() {
  console.log('\n🔍 Checking Strapi content types...');
  
  try {
    // Try to get content-types info (sometimes available in Strapi)
    const response = await axios.get(`${DESTINATION_URL.replace('/api', '')}/api`);
    console.log('✅ Basic API info:', response.data);
  } catch (error) {
    console.log('❌ Cannot get API info:', error.response?.status);
  }
  
  // Try to get users endpoint as it usually exists
  try {
    const response = await axios.get(`${DESTINATION_URL}/users/me`);
    console.log('✅ Users endpoint accessible');
  } catch (error) {
    console.log('❌ Users endpoint not accessible:', error.response?.status);
  }
}

async function testExistingDataCreation() {
  console.log('\n🧪 Testing data creation on working endpoints...');
  
  // Test creating a system setting (we know this works)
  try {
    const testSetting = {
      key: 'test_migration_key',
      value: 'test_value',
      dataType: 'string',
      description: 'Test migration setting',
      category: 'test',
      isPublic: false
    };
    
    const response = await axios.post(`${DESTINATION_URL}/system-settings`, {
      data: testSetting
    });
    
    console.log('✅ System settings creation works');
    
    // Clean up - delete the test setting
    try {
      await axios.delete(`${DESTINATION_URL}/system-settings/${response.data.data.id}`);
      console.log('✅ Test setting cleaned up');
    } catch (cleanupError) {
      console.log('⚠️  Could not clean up test setting');
    }
    
  } catch (error) {
    console.log('❌ System settings creation failed:', error.response?.data);
  }
}

async function runDiagnostics() {
  await examineDestinationEndpoints();
  await checkStrapiInfo();
  await testExistingDataCreation();
}

runDiagnostics();
