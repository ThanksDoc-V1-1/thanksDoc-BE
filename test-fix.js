// Test script to verify services are loading after the fix
const fetch = require('node-fetch');

const API_URL = 'http://localhost:1337/api';

async function testDoctorServices() {
  try {
    console.log('🧪 Testing doctor services loading...\n');
    
    // Test getting doctor with services populated
    console.log('📋 1. Getting doctor with services populated:');
    const response = await fetch(`${API_URL}/doctors/1?populate=services`);
    const result = await response.json();
    
    if (result.data && result.data.services) {
      console.log(`✅ SUCCESS: Doctor has ${result.data.services.length} services`);
      console.log('📋 Services:', result.data.services.map(s => s.name).join(', '));
    } else {
      console.log('❌ FAILED: No services found');
      console.log('📋 Response:', JSON.stringify(result, null, 2));
    }
    
    console.log('\n📋 2. Testing service addition...');
    // First, let's add a service to make sure the fix works
    const updateResponse = await fetch(`${API_URL}/doctors/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          services: [1, 2, 3, 4] // Add some services
        }
      })
    });
    
    const updateResult = await updateResponse.json();
    console.log('✅ Update response received');
    
    // Now check if services are immediately available
    console.log('\n📋 3. Checking if services are immediately available:');
    const checkResponse = await fetch(`${API_URL}/doctors/1?populate=services`);
    const checkResult = await checkResponse.json();
    
    if (checkResult.data && checkResult.data.services) {
      console.log(`✅ SUCCESS: Doctor now has ${checkResult.data.services.length} services`);
      console.log('📋 Services:', checkResult.data.services.map(s => s.name).join(', '));
    } else {
      console.log('❌ FAILED: Services still not loading');
      console.log('📋 Response:', JSON.stringify(checkResult, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testDoctorServices();
