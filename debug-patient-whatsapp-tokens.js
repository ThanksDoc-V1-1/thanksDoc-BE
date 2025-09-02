const WhatsAppService = require('./src/services/whatsapp');

async function debugPatientWhatsAppTokens() {
  console.log('🔍 Debugging Patient WhatsApp Token Generation');
  console.log('=' .repeat(60));
  
  const whatsappService = new WhatsAppService();
  
  // Mock data
  const mockServiceRequest = {
    id: '123',
    serviceType: 'Face to Face consultation',
    isPatientRequest: true
  };
  
  const mockDoctor = {
    id: '1',
    firstName: 'Test',
    lastName: 'Doctor'
  };
  
  // Test business request (normal)
  console.log('📋 Testing Business Request Token Generation:');
  const businessToken = whatsappService.generateAcceptanceToken(mockServiceRequest.id, mockDoctor.id);
  console.log('Token:', businessToken);
  
  // Decode and examine the token
  try {
    const payload = JSON.parse(Buffer.from(businessToken, 'base64').toString());
    console.log('Token payload:', JSON.stringify(payload, null, 2));
    
    // Test token verification
    const verified = whatsappService.verifyAcceptanceToken(businessToken);
    console.log('Token verification result:', verified);
    
  } catch (error) {
    console.error('Token parsing error:', error.message);
  }
  
  console.log('\n🔍 Environment Variables:');
  console.log('BASE_URL:', process.env.BASE_URL);
  console.log('WHATSAPP_USE_TEMPLATE:', process.env.WHATSAPP_USE_TEMPLATE);
  console.log('WHATSAPP_TEMPLATE_NAME:', process.env.WHATSAPP_TEMPLATE_NAME);
  
  console.log('\n🔍 Template URL Construction:');
  const acceptUrl = businessToken; // This is what's passed to the template
  const urlParameter = acceptUrl.split('/').pop(); // This is what goes in the template
  console.log('Accept URL (full token):', acceptUrl);
  console.log('URL parameter (for template):', urlParameter);
  
  console.log('\n🔍 Expected WhatsApp Template URL:');
  console.log('The template should construct: [BASE_URL]/api/service-requests/whatsapp-accept/' + urlParameter);
  console.log('Expected full URL:', `https://thanksdoc-be-production.up.railway.app/api/service-requests/whatsapp-accept/${urlParameter}?confirm=yes`);
}

debugPatientWhatsAppTokens();
