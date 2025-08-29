const axios = require('axios');

async function testOnlineConsultation() {
  try {
    console.log('🧪 Testing online consultation request (service ID 80)...');
    
    // Create an online consultation request
    const requestData = {
      businessId: 1,
      serviceId: 80, // Online Consultation
      urgencyLevel: 'medium',
      serviceType: 'online',
      description: 'Test online consultation request',
      estimatedDuration: 30,
      patientFirstName: 'Test',
      patientLastName: 'Patient',
      patientPhone: '+1234567890',
      patientEmail: 'test@example.com'
    };

    console.log('📝 Creating online consultation request...');
    const response = await axios.post('http://localhost:1337/api/service-requests/create', requestData);
    
    console.log('✅ Request created successfully!');
    console.log('📋 Response:', response.data);
    
    // Wait a moment for notifications to be sent
    console.log('⏳ Waiting for notifications to be sent...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Test completed! Check the backend logs to see which doctors received notifications.');
    
  } catch (error) {
    console.error('❌ Error testing online consultation:', error.response?.data || error.message);
  }
}

testOnlineConsultation();
