require('dotenv').config();
const WhatsAppService = require('./src/services/whatsapp');

async function testPhoneNumberIssue() {
  try {
    console.log('🧪 Testing Phone Number Issue');
    
    const whatsappService = new WhatsAppService();
    
    // Test with your phone number
    const yourPhoneNumber = '+256784528444'; // Your number
    const testPhoneNumber = '+256700000000'; // Test number that works
    
    console.log('📱 Testing your phone number:', yourPhoneNumber);
    console.log('📱 Testing working phone number:', testPhoneNumber);
    
    // Mock service request
    const mockServiceRequest = {
      id: 'test-phone-123',
      serviceType: 'Phone Number Test',
      requestedServiceDateTime: new Date().toISOString(),
      estimatedDuration: 30,
      serviceCost: 50,
      description: 'Testing phone number issue',
      status: 'pending'
    };
    
    // Mock business
    const mockBusiness = {
      id: 456,
      name: 'Test Clinic',
      businessName: 'Test Clinic',
      address: 'Test Address',
      phone: '+256700000000',
      latitude: 0.3476,
      longitude: 32.5825
    };
    
    // Test both phone numbers
    const phoneNumbers = [
      { number: yourPhoneNumber, label: 'Your Phone' },
      { number: testPhoneNumber, label: 'Test Phone' }
    ];
    
    for (const phoneTest of phoneNumbers) {
      console.log(`\n🔍 Testing ${phoneTest.label}: ${phoneTest.number}`);
      
      const mockDoctor = {
        id: 123,
        firstName: 'Dr. Test',
        lastName: 'Doctor',
        phone: phoneTest.number,
        latitude: 0.3136,
        longitude: 32.4415
      };
      
      try {
        const result = await whatsappService.sendServiceRequestNotification(
          mockDoctor, 
          mockServiceRequest, 
          mockBusiness
        );
        
        console.log(`✅ ${phoneTest.label} SUCCESS:`, {
          messageId: result.messages?.[0]?.id,
          status: result.messages?.[0]?.message_status
        });
        
      } catch (error) {
        console.error(`❌ ${phoneTest.label} FAILED:`, {
          message: error.message,
          responseData: error.response?.data
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPhoneNumberIssue();
