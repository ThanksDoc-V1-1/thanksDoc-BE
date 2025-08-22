const WhatsAppService = require('./src/services/whatsapp');

async function testConnectivityAndTemplate() {
  try {
    console.log('🧪 Testing WhatsApp Connectivity and Template Status');
    
    const testPhoneNumber = '+256784528444';
    const whatsappService = new WhatsAppService();
    
    console.log('\n📱 Step 1: Testing basic connectivity with simple text message...');
    
    // Test basic connectivity first
    const simpleMessage = {
      messaging_product: "whatsapp",
      to: testPhoneNumber,
      type: "text",
      text: {
        body: "🧪 WhatsApp connectivity test from ThanksDoc - Template testing"
      }
    };

    try {
      const connectivityResult = await whatsappService.sendWhatsAppMessage(simpleMessage);
      console.log('✅ Connectivity test successful:', connectivityResult);
    } catch (connectivityError) {
      console.error('❌ Connectivity test failed:', connectivityError.message);
      if (connectivityError.response?.data) {
        console.error('Error details:', JSON.stringify(connectivityError.response.data, null, 2));
      }
      return; // Stop here if basic connectivity fails
    }

    console.log('\n📋 Step 2: Testing template (new_doctor_accept_request)...');
    
    // Now test the template
    const mockServiceRequest = {
      id: 'test-123',
      serviceType: 'Cardiology',
      requestedServiceDateTime: new Date().toISOString(),
      estimatedDuration: 45,
      serviceCost: 70, // £70 service cost
      servicePrice: 70 // £70 service price (same as serviceCost for testing)
    };

    const mockBusiness = {
      name: 'Mulago Pharmacy',
      businessName: 'Mulago Pharmacy',
      address: 'King streety'
    };

    const mockDoctor = {
      firstName: 'Dr. Test',
      lastName: 'Doctor',
      id: 'doctor-test-123'
    };

    const acceptUrl = `${process.env.BASE_URL}/api/service-request/accept-via-whatsapp/test-token-accept`;
    const rejectUrl = `${process.env.BASE_URL}/api/service-request/reject-via-whatsapp/test-token-reject`;

    const templateMessage = whatsappService.buildDoctorAcceptRequestTemplate(
      testPhoneNumber,
      mockServiceRequest,
      mockBusiness,
      acceptUrl,
      rejectUrl,
      mockDoctor
    );

    console.log('Sending template message...');
    
    try {
      const templateResult = await whatsappService.sendWhatsAppMessage(templateMessage);
      console.log('✅ Template test successful:', templateResult);
    } catch (templateError) {
      console.error('❌ Template test failed:', templateError.message);
      if (templateError.response?.data) {
        console.error('Template error details:', JSON.stringify(templateError.response.data, null, 2));
        
        // Check for specific template-related errors
        const errorData = templateError.response.data;
        if (errorData.error) {
          if (errorData.error.message?.includes('template')) {
            console.log('\n🔍 Template Error Analysis:');
            console.log('- This looks like a template-related error');
            console.log('- Template might not be approved yet');
            console.log('- Check Facebook Business Manager for template status');
          }
          if (errorData.error.code === 131026) {
            console.log('- Error Code 131026: Template not found or not approved');
          }
          if (errorData.error.code === 131047) {
            console.log('- Error Code 131047: Re-engagement message outside 24hr window');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnectivityAndTemplate();
