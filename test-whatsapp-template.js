const WhatsAppService = require('./src/services/whatsapp');

async function testTemplate() {
  try {
    const whatsappService = new WhatsAppService();
    console.log(`🧪 Testing WhatsApp Template: ${whatsappService.templateName}`);
    
    // Create mock data for testing
    const mockServiceRequest = {
      id: 'test-123',
      serviceType: 'General Consultation',
      requestedServiceDateTime: new Date().toISOString(),
      estimatedDuration: 30,
      serviceCost: 50
    };

    const mockBusiness = {
      name: 'Test Medical Center',
      businessName: 'Test Medical Center',
      address: '123 Test Street, Test City'
    };

    const mockDoctor = {
      firstName: 'Dr. Test',
      lastName: 'Doctor',
      id: 'doctor-test-123'
    };

    // Test phone number - YOUR WHATSAPP NUMBER
    const testPhoneNumber = '+256784528444'; // Your actual WhatsApp number

    // Generate test URLs
    const acceptUrl = `${process.env.BASE_URL}/api/service-request/accept-via-whatsapp/test-token-accept`;
    const rejectUrl = `${process.env.BASE_URL}/api/service-request/reject-via-whatsapp/test-token-reject`;
    
    // Build the template payload
    const templateMessage = whatsappService.buildDoctorAcceptRequestTemplate(
      testPhoneNumber,
      mockServiceRequest,
      mockBusiness,
      acceptUrl,
      rejectUrl,
      mockDoctor
    );

    console.log('📱 Generated Template Payload:');
    console.log(JSON.stringify(templateMessage, null, 2));
    
    console.log('\n🔍 Template Details:');
    console.log('Template Name:', templateMessage.template.name);
    console.log('Language:', templateMessage.template.language.code);
    console.log('Parameters Count:', templateMessage.template.components[0].parameters.length);
    
    console.log('\n📋 Parameter Values:');
    templateMessage.template.components[0].parameters.forEach((param, index) => {
      console.log(`{{${index + 1}}}: ${param.text}`);
    });

    // Actually send the test message
    console.log('\n📤 Sending test message to WhatsApp...');
    const result = await whatsappService.sendWhatsAppMessage(templateMessage);
    console.log('✅ Message sent successfully:', result);
    
    console.log('\n✅ Template structure validated and message sent successfully!');
    console.log('🔧 Sending actual test message to +256784528444...');
    
  } catch (error) {
    console.error('❌ Error testing template:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTemplate();
