// Create and test new online consultation
require('dotenv').config();
const axios = require('axios');

async function createAndTestOnlineConsultation() {
  const baseURL = 'http://localhost:1337/api';
  
  console.log('🆕 Creating and Testing New Online Consultation\n');
  
  try {
    // 1. Create a new online consultation request
    console.log('1. Creating new online consultation request...');
    
    const serviceRequestData = {
      businessId: 11, // Use existing business ID
      serviceType: 'Online Consultation',
      patientFirstName: 'John',
      patientLastName: 'Doe',
      patientPhone: '+256784528444',
      patientEmail: 'john.doe@example.com',
      description: 'Test online consultation for video integration',
      requestedServiceDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      estimatedDuration: 1,
      urgencyLevel: 'medium'
    };
    
    const createResponse = await axios.post(`${baseURL}/service-requests/create`, serviceRequestData);
    const newRequest = createResponse.data.serviceRequest;
    
    console.log('Raw response:', JSON.stringify(createResponse.data, null, 2));
    
    console.log('✅ Created service request:');
    console.log(`   - ID: ${newRequest.id}`);
    console.log(`   - Patient: ${newRequest.patientFirstName} ${newRequest.patientLastName}`);
    console.log(`   - Phone: ${newRequest.patientPhone}`);
    console.log(`   - Status: ${newRequest.status}`);
    
    // 2. Accept the request with a doctor
    console.log('\n2. Accepting request with doctor...');
    
    const acceptData = {
      doctorId: 1 // Use valid doctor ID
    };
    
    const acceptResponse = await axios.post(`${baseURL}/service-requests/${newRequest.id}/accept`, acceptData);
    const acceptedRequest = acceptResponse.data;
    
    console.log('✅ Request accepted:');
    console.log(`   - Status: ${acceptedRequest.status}`);
    console.log(`   - Whereby URL: ${acceptedRequest.wherebyRoomUrl || 'NOT SET'}`);
    console.log(`   - Whereby Meeting ID: ${acceptedRequest.wherebyMeetingId || 'NOT SET'}`);
    
    if (acceptedRequest.wherebyRoomUrl) {
      console.log('\n🎉 SUCCESS: Video call URL was created and saved!');
    } else {
      console.log('\n❌ ISSUE: Video call URL was not created');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createAndTestOnlineConsultation();
