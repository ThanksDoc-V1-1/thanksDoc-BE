require('dotenv').config();
const WhatsAppService = require('./src/services/whatsapp');

async function testActualServiceRequestFlow() {
  try {
    console.log('🧪 Testing ACTUAL Service Request Flow (not just template)');
    
    const whatsappService = new WhatsAppService();
    
    // Mock data that mimics what comes from the actual service request creation
    const mockDoctor = {
      id: 123,
      firstName: 'Dr. Test',
      lastName: 'Doctor',
      phone: '+256784528444' // Your WhatsApp number
    };
    
    const mockServiceRequest = {
      id: 'test-actual-123',
      serviceType: 'Emergency Consultation',
      requestedServiceDateTime: new Date().toISOString(),
      estimatedDuration: 45,
      serviceCost: 75,
      description: 'Urgent medical consultation needed',
      status: 'pending'
    };
    
    const mockBusiness = {
      id: 456,
      name: 'Test Emergency Clinic',
      businessName: 'Test Emergency Clinic',
      address: '456 Emergency Street, Urgent City',
      phone: '+256700000000'
    };
    
    console.log('📞 Calling sendServiceRequestNotification...');
    
    // This is the EXACT same call that happens in the actual service request controller
    const result = await whatsappService.sendServiceRequestNotification(
      mockDoctor, 
      mockServiceRequest, 
      mockBusiness
    );
    
    console.log('✅ Service request notification completed!');
    console.log('📱 Result:', result);
    
  } catch (error) {
    console.error('❌ Error in actual service request flow:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testActualServiceRequestFlow();
