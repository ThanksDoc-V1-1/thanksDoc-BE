// Test WhatsApp notifications for existing video consultation
require('dotenv').config();
const WhatsAppService = require('./src/services/whatsapp');

async function testVideoNotifications() {
  console.log('📱 Testing WhatsApp Video Call Notifications\n');
  
  try {
    const whatsappService = new WhatsAppService();
    
    // Mock data from the successful test
    const doctor = {
      firstName: 'Dr. John',
      lastName: 'Smith',
      phone: '+256784528444' // Test phone number
    };
    
    const serviceRequest = {
      id: 417,
      patientFirstName: 'John',
      patientLastName: 'Doe',
      patientPhone: '+256784528444',
      serviceType: 'Online Consultation',
      requestedServiceDateTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      wherebyRoomUrl: 'https://mobiklinic.whereby.com/consultation-416-1754559884512c073a504-252d-43ea-a290-43e2ee7028a4'
    };
    
    console.log('🎥 Sending video call notifications...');
    console.log(`Doctor: ${doctor.firstName} ${doctor.lastName} (${doctor.phone})`);
    console.log(`Patient: ${serviceRequest.patientFirstName} ${serviceRequest.patientLastName} (${serviceRequest.patientPhone})`);
    console.log(`Video URL: ${serviceRequest.wherebyRoomUrl}`);
    
    const result = await whatsappService.sendVideoCallNotifications(
      doctor,
      serviceRequest,
      serviceRequest.wherebyRoomUrl
    );
    
    console.log('\n📊 Notification Results:');
    result.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.type}: ${notification.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!notification.success) {
        console.log(`   Error: ${notification.error}`);
      }
    });
    
    if (result.every(n => n.success)) {
      console.log('\n🎉 All WhatsApp notifications sent successfully!');
    } else {
      console.log('\n⚠️ Some notifications failed - check WhatsApp API credentials');
    }
    
  } catch (error) {
    console.error('❌ Error testing notifications:', error.message);
  }
}

testVideoNotifications();
