'use strict';

const WhatsAppService = require('../../../services/whatsapp');

/**
 * WhatsApp controller
 */

module.exports = {
  /**
   * Test the doctor accept request template
   */
  async testDoctorAcceptTemplate(ctx) {
    try {
      const { phoneNumber } = ctx.request.body;
      
      if (!phoneNumber) {
        return ctx.badRequest('Phone number is required');
      }

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
        firstName: 'Test',
        lastName: 'Doctor',
        id: 'doctor-test-123'
      };

      // Generate test URLs
      const acceptUrl = `${process.env.BASE_URL}/api/service-request/accept-via-whatsapp/test-token-accept`;
      const rejectUrl = `${process.env.BASE_URL}/api/service-request/reject-via-whatsapp/test-token-reject`;

      const whatsappService = new WhatsAppService();
      
      // Build and send the template
      const templateMessage = whatsappService.buildDoctorAcceptRequestTemplate(
        phoneNumber,
        mockServiceRequest,
        mockBusiness,
        acceptUrl,
        rejectUrl,
        mockDoctor
      );

      console.log('🧪 Testing template with payload:', JSON.stringify(templateMessage, null, 2));

      const result = await whatsappService.sendWhatsAppMessage(templateMessage);

      ctx.send({
        success: true,
        message: 'Test template sent successfully',
        templatePayload: templateMessage,
        result: result
      });

    } catch (error) {
      console.error('❌ Error testing WhatsApp template:', error);
      ctx.send({
        success: false,
        message: 'Failed to send test template',
        error: error.message,
        details: error.response?.data || error.stack
      });
    }
  },

  /**
   * Test connectivity and phone number verification
   */
  async testConnectivity(ctx) {
    try {
      const { phoneNumber } = ctx.request.body;
      
      if (!phoneNumber) {
        return ctx.badRequest('Phone number is required');
      }

      const whatsappService = new WhatsAppService();
      
      // Send a simple test message
      const testMessage = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: {
          body: "🧪 WhatsApp connectivity test from ThanksDoc. Template testing in progress."
        }
      };

      console.log('🧪 Testing connectivity with payload:', JSON.stringify(testMessage, null, 2));

      const result = await whatsappService.sendWhatsAppMessage(testMessage);

      ctx.send({
        success: true,
        message: 'Test connectivity message sent successfully',
        result: result
      });

    } catch (error) {
      console.error('❌ Error testing WhatsApp connectivity:', error);
      ctx.send({
        success: false,
        message: 'Failed to send test connectivity message',
        error: error.message,
        details: error.response?.data || error.stack
      });
    }
  }
};
