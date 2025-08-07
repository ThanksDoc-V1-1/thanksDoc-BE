require('dotenv').config();

console.log('🔧 Environment Variables Check:');
console.log('FRONTEND_VIDEO_URL:', process.env.FRONTEND_VIDEO_URL);
console.log('FRONTEND_DASHBOARD_URL:', process.env.FRONTEND_DASHBOARD_URL);
console.log('BASE_URLL:', process.env.BASE_URLL);

// Test WhatsApp service constructor
const WhatsAppService = require('./src/services/whatsapp');
const whatsappService = new WhatsAppService();

console.log('\n📱 WhatsApp Service Configuration:');
console.log('frontendVideoUrl:', whatsappService.frontendVideoUrl);
console.log('baseUrll:', whatsappService.baseUrll);

// Test URL generation
const testServiceRequest = { id: 123 };
const testVideoCallUrl = 'https://mobiklinic.whereby.com/test-room';

const doctorUrl = `${whatsappService.frontendVideoUrl}/consultation/${testServiceRequest.id}?type=doctor&roomUrl=${encodeURIComponent(testVideoCallUrl)}`;
const patientUrl = `${whatsappService.frontendVideoUrl}/consultation/${testServiceRequest.id}?type=patient&roomUrl=${encodeURIComponent(testVideoCallUrl)}`;

console.log('\n🎯 Generated URLs:');
console.log('Doctor URL:', doctorUrl);
console.log('Patient URL:', patientUrl);
