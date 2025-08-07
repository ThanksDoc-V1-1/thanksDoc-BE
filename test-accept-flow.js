// Test accept online consultation flow
require('dotenv').config();
const axios = require('axios');

async function testAcceptFlow() {
  const baseURL = 'http://localhost:1337/api';
  
  console.log('🧪 Testing Accept Online Consultation Flow\n');
  
  try {
    // 1. Get service request 407 details
    console.log('1. Fetching service request 407...');
    const serviceResponse = await axios.get(`${baseURL}/service-requests/407?populate=*`);
    const serviceRequest = serviceResponse.data.data;
    
    console.log('📋 Service Request Details:');
    console.log(`- ID: ${serviceRequest.id}`);
    console.log(`- Service Type: ${serviceRequest.serviceType}`);
    console.log(`- Status: ${serviceRequest.status}`);
    console.log(`- Patient: ${serviceRequest.patientFirstName} ${serviceRequest.patientLastName}`);
    console.log(`- Patient Phone: ${serviceRequest.patientPhone}`);
    console.log(`- Current Whereby URL: ${serviceRequest.wherebyRoomUrl || 'NOT SET'}`);
    
    // 2. Test Whereby service manually
    console.log('\n2. Testing Whereby service directly...');
    const WherebyService = require('./src/services/whereby');
    const wherebyService = new WherebyService();
    
    try {
      const meeting = await wherebyService.createConsultationMeeting(serviceRequest);
      console.log('✅ Whereby service working:');
      console.log(`   - Room URL: ${meeting.roomUrl}`);
      console.log(`   - Meeting ID: ${meeting.meetingId}`);
      
      // 3. Update service request with video URL manually
      console.log('\n3. Updating service request with video URL...');
      const updateResponse = await axios.put(`${baseURL}/service-requests/${serviceRequest.id}`, {
        data: {
          wherebyRoomUrl: meeting.roomUrl,
          wherebyMeetingId: meeting.meetingId
        }
      });
      
      console.log('✅ Service request updated successfully');
      
      // 4. Test WhatsApp notifications manually
      console.log('\n4. Testing WhatsApp notifications...');
      const WhatsAppService = require('./src/services/whatsapp');
      const whatsappService = new WhatsAppService();
      
      // Mock doctor data
      const doctor = {
        firstName: 'Test',
        lastName: 'Doctor',
        phone: '+256784528444' // Using same phone for testing
      };
      
      const result = await whatsappService.sendVideoCallNotifications(
        doctor,
        {
          ...serviceRequest,
          wherebyRoomUrl: meeting.roomUrl
        },
        meeting.roomUrl
      );
      
      console.log('✅ WhatsApp notifications result:', result);
      
    } catch (wherebyError) {
      console.log('❌ Whereby service error:', wherebyError.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testAcceptFlow();
