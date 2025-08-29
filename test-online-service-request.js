const axios = require('axios');

async function testOnlineServiceRequest() {
  try {
    console.log('🧪 Testing online service request...');
    
    // Create a test online consultation request with service ID 20 (which we know exists)
    const requestData = {
      businessId: 1, // Assuming business ID 1 exists
      serviceId: 20, // Service ID for online consultation
      urgencyLevel: 'normal',
      serviceType: 'online',
      description: 'Test online consultation request - should go to ALL doctors who offer this service regardless of location',
      estimatedDuration: 30,
      requestedServiceDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      patientFirstName: 'Test',
      patientLastName: 'Patient',
      patientPhone: '+1234567890',
      patientEmail: 'test@example.com',
      latitude: 40.7128, // NYC coordinates - should not matter for online service
      longitude: -74.0060
    };
    
    console.log('📤 Creating online service request with service ID 20...');
    const response = await axios.post('http://localhost:1337/api/service-requests/create', requestData);
    
    if (response.data.success) {
      console.log('✅ Online service request created successfully!');
      console.log('📋 Request ID:', response.data.data.id);
      console.log('🎯 Should be sent to ALL doctors who offer service ID 20 regardless of location');
    } else {
      console.log('❌ Failed to create request:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing online service request:', error.response?.data || error.message);
  }
}

testOnlineServiceRequest();
}

testOnlineServiceRequest();
