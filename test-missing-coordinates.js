require('dotenv').config();
const WhatsAppService = require('./src/services/whatsapp');

async function testMissingCoordinates() {
  try {
    console.log('🧪 Testing Service Request with Missing Coordinates');
    
    const whatsappService = new WhatsAppService();
    
    // Mock doctor WITHOUT coordinates
    const mockDoctor = {
      id: 123,
      firstName: 'Dr. Test',
      lastName: 'Doctor',
      phone: '+256784528444'
      // NO latitude/longitude
    };
    
    // Mock service request
    const mockServiceRequest = {
      id: 'test-no-coords-123',
      serviceType: 'Emergency Consultation',
      requestedServiceDateTime: new Date().toISOString(),
      estimatedDuration: 45,
      serviceCost: 75,
      description: 'Test request with missing coordinates',
      status: 'pending'
    };
    
    // Mock business WITHOUT coordinates
    const mockBusiness = {
      id: 456,
      name: 'Test Emergency Clinic',
      businessName: 'Test Emergency Clinic',
      address: '456 Emergency Street, Urgent City',
      phone: '+256700000000'
      // NO latitude/longitude
    };
    
    console.log('📞 Calling sendServiceRequestNotification with missing coordinates...');
    
    const result = await whatsappService.sendServiceRequestNotification(
      mockDoctor, 
      mockServiceRequest, 
      mockBusiness
    );
    
    console.log('✅ Service request notification completed with missing coordinates!');
    console.log('📱 Result:', result);
    
  } catch (error) {
    console.error('❌ Error with missing coordinates:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testMissingCoordinates();
