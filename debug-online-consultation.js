// Debug script for online consultation flow
'use strict';

// Load environment variables
require('dotenv').config();

const axios = require('axios');

async function debugOnlineConsultation() {
  const baseURL = 'http://localhost:1337/api';
  
  console.log('🔍 Debugging Online Consultation Flow\n');
  
  try {
    // 1. Check service requests with online consultation
    console.log('1. Checking for online consultation service requests...');
    const serviceRequests = await axios.get(`${baseURL}/service-requests?populate=*`);
    
    const onlineConsultations = serviceRequests.data.data.filter(req => 
      req.serviceType?.toLowerCase().includes('online consultation') ||
      req.service?.category === 'online'
    );
    
    console.log(`Found ${onlineConsultations.length} online consultation requests`);
    
    if (onlineConsultations.length > 0) {
      const latestRequest = onlineConsultations[0];
      console.log('\n📋 Latest online consultation request:');
      console.log(`- ID: ${latestRequest.id}`);
      console.log(`- Service Type: ${latestRequest.serviceType}`);
      console.log(`- Status: ${latestRequest.status}`);
      console.log(`- Patient Name: ${latestRequest.patientFirstName} ${latestRequest.patientLastName}`);
      console.log(`- Patient Phone: ${latestRequest.patientPhone}`);
      console.log(`- Patient Email: ${latestRequest.patientEmail}`);
      console.log(`- Whereby Room URL: ${latestRequest.wherebyRoomUrl || 'NOT SET'}`);
      console.log(`- Whereby Meeting ID: ${latestRequest.wherebyMeetingId || 'NOT SET'}`);
      
      // 2. Test Whereby service directly
      console.log('\n🎥 Testing Whereby service...');
      const WherebyService = require('./src/services/whereby');
      const wherebyService = new WherebyService();
      
      try {
        const testMeeting = await wherebyService.createConsultationMeeting({
          id: 'test-123',
          requestedServiceDateTime: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        });
        console.log('✅ Whereby service working:', testMeeting);
      } catch (wherebyError) {
        console.log('❌ Whereby service error:', wherebyError.message);
      }
      
      // 3. Test WhatsApp service directly
      console.log('\n📱 Testing WhatsApp service...');
      const WhatsAppService = require('./src/services/whatsapp');
      const whatsappService = new WhatsAppService();
      
      try {
        // Test doctor notification
        const testDoctor = {
          firstName: 'Test',
          lastName: 'Doctor',
          phone: '+447700900123' // Replace with actual test number
        };
        
        const testRequest = {
          patientFirstName: 'Test',
          patientLastName: 'Patient',
          patientPhone: '+447700900456', // Replace with actual test number
          serviceType: 'Online Consultation',
          requestedServiceDateTime: new Date()
        };
        
        const testVideoUrl = 'https://whereby.com/test-consultation';
        
        console.log('Sending test WhatsApp notifications...');
        await whatsappService.sendVideoCallNotifications(testDoctor, testRequest, testVideoUrl);
        console.log('✅ WhatsApp notifications sent successfully');
        
      } catch (whatsappError) {
        console.log('❌ WhatsApp service error:', whatsappError.message);
      }
    }
    
    // 4. Check environment variables
    console.log('\n⚙️ Environment Variables Check:');
    console.log(`- WHEREBY_API_KEY: ${process.env.WHEREBY_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`- WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`- WHATSAPP_TEMPLATE_DOCTOR_VIDEO_CALL: ${process.env.WHATSAPP_TEMPLATE_DOCTOR_VIDEO_CALL || 'NOT SET'}`);
    console.log(`- WHATSAPP_TEMPLATE_PATIENT_VIDEO_CALL: ${process.env.WHATSAPP_TEMPLATE_PATIENT_VIDEO_CALL || 'NOT SET'}`);
    
  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

// Run the debug script
debugOnlineConsultation();
