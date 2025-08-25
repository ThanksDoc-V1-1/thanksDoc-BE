require('dotenv').config();
const WhatsAppService = require('./src/services/whatsapp');

async function testStringCoordinates() {
  try {
    console.log('🧪 Testing String Coordinates Issue');
    
    const whatsappService = new WhatsAppService();
    
    // Test with coordinates as STRINGS (like in the database)
    const mockDoctor = {
      id: 123,
      firstName: 'Dr. Mr',
      lastName: 'Ar',
      phone: '+256784528444',
      latitude: "0.3476", // STRING instead of number
      longitude: "32.5825" // STRING instead of number
    };
    
    const mockServiceRequest = {
      id: 'test-string-coords-123',
      serviceType: 'Cardiology',
      requestedServiceDateTime: new Date().toISOString(),
      estimatedDuration: 45,
      serviceCost: 63,
      description: 'Testing string coordinates',
      status: 'pending'
    };
    
    const mockBusiness = {
      id: 456,
      name: 'Mulago Pharmacy',
      businessName: 'Mulago Pharmacy',
      address: 'King streety',
      phone: '+256700000000',
      latitude: "0.3136", // STRING instead of number
      longitude: "32.4415" // STRING instead of number
    };
    
    console.log('🔍 Testing with STRING coordinates:');
    console.log('Business coords:', { lat: mockBusiness.latitude, lng: mockBusiness.longitude, types: { lat: typeof mockBusiness.latitude, lng: typeof mockBusiness.longitude } });
    console.log('Doctor coords:', { lat: mockDoctor.latitude, lng: mockDoctor.longitude, types: { lat: typeof mockDoctor.latitude, lng: typeof mockDoctor.longitude } });
    
    console.log('📞 Calling sendServiceRequestNotification with string coordinates...');
    
    const result = await whatsappService.sendServiceRequestNotification(
      mockDoctor, 
      mockServiceRequest, 
      mockBusiness
    );
    
    console.log('✅ Service request notification completed with string coordinates!');
    console.log('📱 Result:', result);
    
  } catch (error) {
    console.error('❌ Error with string coordinates:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testStringCoordinates();
