const axios = require('axios');

const BASE_URL = 'https://thanksdoc-be-production.up.railway.app';

async function testWhatsAppWithDistance() {
  try {
    console.log('📱 Testing WhatsApp Notification Distance Calculation');
    
    // Use the test WhatsApp endpoint that we know exists
    const testData = {
      doctorId: 4, // Arafat's ID
      testMessage: 'Testing distance calculation fix - should show distance between KIHIHI and Arafat'
    };
    
    console.log('📋 Test data:', testData);
    
    // Call the test WhatsApp endpoint
    const response = await axios.post(`${BASE_URL}/api/service-requests/test-whatsapp`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ WhatsApp test completed');
    console.log('📊 Response:', response.data);
    
    console.log('\n🎯 Expected: Should show distance calculation in WhatsApp message');
    console.log('💡 Check the WhatsApp message for distance information');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWhatsAppWithDistance();
