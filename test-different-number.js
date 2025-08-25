require('dotenv').config();
const WhatsAppService = require('./src/services/whatsapp');

async function testDifferentPhoneNumber() {
  try {
    console.log('🧪 Testing with Different Phone Number');
    
    const whatsappService = new WhatsAppService();
    
    // Use a completely different number (not yours)
    const differentPhoneNumber = '+256700123456'; // Different test number
    
    // Mock service request with real-looking data
    const mockServiceRequest = {
      id: 'real-test-456',
      serviceType: 'General Consultation',
      requestedServiceDateTime: new Date().toISOString(),
      estimatedDuration: 30,
      serviceCost: 45,
      description: 'Real medical consultation request',
      status: 'pending'
    };
    
    // Mock business with string coordinates (like real data)
    const mockBusiness = {
      id: 789,
      name: 'Mulago Pharmacy',
      businessName: 'Mulago Pharmacy',
      address: 'King street',
      phone: '+256700000000',
      latitude: "0.33658900", // String coordinates like real data
      longitude: "32.57285600"
    };
    
    // Mock doctor with string coordinates
    const mockDoctor = {
      id: 456,
      firstName: 'Dr. Alternative',
      lastName: 'Test',
      phone: differentPhoneNumber,
      latitude: "0.31364000", // String coordinates like real data
      longitude: "32.44150000"
    };
    
    console.log('📱 Sending to different number:', differentPhoneNumber);
    console.log('📍 Testing with string coordinates (like real data)');
    
    const result = await whatsappService.sendServiceRequestNotification(
      mockDoctor, 
      mockServiceRequest, 
      mockBusiness
    );
    
    console.log('✅ Message sent successfully to different number!');
    console.log('📱 Result:', {
      messageId: result.messages?.[0]?.id,
      status: result.messages?.[0]?.message_status,
      contactWaId: result.contacts?.[0]?.wa_id
    });
    
  } catch (error) {
    console.error('❌ Error sending to different number:', {
      message: error.message,
      responseData: error.response?.data
    });
  }
}

// Run the test
testDifferentPhoneNumber();
