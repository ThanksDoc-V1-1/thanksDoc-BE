require('dotenv').config();
const WhatsAppService = require('./src/services/whatsapp');

async function testRealCoordinatesFromDB() {
  try {
    console.log('🧪 Testing Real Coordinates Issue from Database');
    
    const whatsappService = new WhatsAppService();
    
    // Use the exact data structure from your screenshot
    const realBusiness = {
      id: 456,
      name: 'Mulago Pharmacy Limited', // Updated name
      businessName: 'Mulago Pharmacy Limited',
      address: 'King street',
      phone: '+256700000000',
      latitude: '51.5061', // Updated coordinates as strings (London coordinates)
      longitude: '-0.0182'
    };
    
    const realDoctor = {
      id: 123,
      firstName: 'Dr. Mr',
      lastName: 'Ar',
      phone: '+256784528444',
      latitude: '0.3476', // Original coordinates as strings (Uganda coordinates)
      longitude: '32.5825'
    };
    
    const realServiceRequest = {
      id: 'real-test-123',
      serviceType: 'Cardiology',
      requestedServiceDateTime: new Date('2025-08-29T11:11:00').toISOString(),
      estimatedDuration: 45,
      serviceCost: 70, // £70 * 0.9 = £63.00
      description: 'Real data test from database',
      status: 'pending'
    };
    
    console.log('📍 Business coordinates:', realBusiness.latitude, realBusiness.longitude);
    console.log('📍 Doctor coordinates:', realDoctor.latitude, realDoctor.longitude);
    console.log('📞 Calling sendServiceRequestNotification with real data...');
    
    const result = await whatsappService.sendServiceRequestNotification(
      realDoctor, 
      realServiceRequest, 
      realBusiness
    );
    
    console.log('✅ Service request notification completed with real data!');
    console.log('📱 Result:', result);
    
  } catch (error) {
    console.error('❌ Error with real coordinates:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testRealCoordinatesFromDB();
