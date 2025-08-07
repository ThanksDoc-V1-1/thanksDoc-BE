// Test updated WhatsApp templates with business name
require('dotenv').config();
const WhatsAppService = require('./src/services/whatsapp');

async function testUpdatedTemplates() {
  console.log('📱 Testing Updated WhatsApp Templates with Business Name\n');
  
  try {
    const whatsappService = new WhatsAppService();
    
    // Mock data with business information
    const doctor = {
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      phone: '+256784528444'
    };
    
    const serviceRequest = {
      id: 418,
      patientFirstName: 'Alice',
      patientLastName: 'Smith',
      patientPhone: '+256784528444',
      serviceType: 'Online Consultation',
      requestedServiceDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      wherebyRoomUrl: 'https://mobiklinic.whereby.com/consultation-test-12345',
      business: {
        businessName: 'KIHIHI COMPANY',
        name: 'KIHIHI COMPANY'
      }
    };
    
    console.log('🎥 Testing with business information:');
    console.log(`Business: ${serviceRequest.business.businessName}`);
    console.log(`Doctor: ${doctor.firstName} ${doctor.lastName}`);
    console.log(`Patient: ${serviceRequest.patientFirstName} ${serviceRequest.patientLastName}`);
    console.log(`Service: ${serviceRequest.serviceType}`);
    console.log();
    
    // Test doctor notification
    console.log('📞 Testing Doctor Notification...');
    try {
      await whatsappService.sendVideoCallLinkToDoctor(doctor, serviceRequest, serviceRequest.wherebyRoomUrl);
      console.log('✅ Doctor notification sent successfully');
    } catch (doctorError) {
      console.log('❌ Doctor notification failed:', doctorError.message);
    }
    
    console.log();
    
    // Test patient notification  
    console.log('👤 Testing Patient Notification...');
    try {
      await whatsappService.sendVideoCallLinkToPatient(serviceRequest, doctor, serviceRequest.wherebyRoomUrl);
      console.log('✅ Patient notification sent successfully');
    } catch (patientError) {
      console.log('❌ Patient notification failed:', patientError.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing templates:', error.message);
  }
}

testUpdatedTemplates();
