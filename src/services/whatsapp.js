'use strict';

const axios = require('axios');
const crypto = require('crypto');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    this.baseUrl = process.env.BASE_URL;
    this.baseUrll = process.env.FRONTEND_DASHBOARD_URL;
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  /**
   * Verify webhook token for WhatsApp Business API
   */
  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      return challenge;
    }
    throw new Error('Webhook verification failed');
  }

  /**
   * Generate a secure token for service request acceptance
   */
  generateAcceptanceToken(serviceRequestId, doctorId) {
    const payload = {
      serviceRequestId,
      doctorId,
      timestamp: Date.now(),
      // Token expires in 24 hours
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };

    const secret = process.env.JWT_SECRET || 'default-secret';
    const token = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return Buffer.from(JSON.stringify({ ...payload, token })).toString('base64');
  }

  /**
   * Verify and decode acceptance token
   */
  verifyAcceptanceToken(encodedToken) {
    try {
      const payload = JSON.parse(Buffer.from(encodedToken, 'base64').toString());
      const { serviceRequestId, doctorId, timestamp, expiresAt, token } = payload;

      // Check if token has expired
      if (Date.now() > expiresAt) {
        throw new Error('Token has expired');
      }

      // Verify token signature
      const secret = process.env.JWT_SECRET || 'default-secret';
      const expectedToken = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify({ serviceRequestId, doctorId, timestamp, expiresAt }))
        .digest('hex');

      if (token !== expectedToken) {
        throw new Error('Invalid token signature');
      }

      return { serviceRequestId, doctorId };
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  /**
   * Get doctor display name
   */
  getDoctorDisplayName(doctor) {
    // Prioritize firstName and lastName over name field
    const firstName = doctor.firstName || '';
    const lastName = doctor.lastName || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    // Fallback to name field if firstName/lastName not available
    if (doctor.name && doctor.name !== 'null' && doctor.name.trim() !== '' && doctor.name.toLowerCase() !== 'null') {
      return doctor.name;
    }
    
    return 'Unknown Doctor';
  }

  /**
   * Send WhatsApp notification to doctor about new service request
   */
  async sendServiceRequestNotification(doctor, serviceRequest, business) {
    let doctorPhone = null;
    let messageData = null;
    
    try {
      const WhatsAppUtils = require('../utils/whatsapp-utils');
      
      // Validate and format doctor's phone number
      if (!WhatsAppUtils.isValidPhoneNumber(doctor.phone)) {
        throw new Error(`Invalid phone number for Dr. ${this.getDoctorDisplayName(doctor)}: ${doctor.phone}`);
      }

      const acceptanceToken = this.generateAcceptanceToken(serviceRequest.id, doctor.id);
      const acceptUrl = `${this.baseUrl}/api/service-requests/whatsapp-accept/${acceptanceToken}`;
      const rejectUrl = `${this.baseUrl}/api/service-requests/whatsapp-reject/${acceptanceToken}`;

      // Format doctor's phone number for WhatsApp (remove + and any formatting)
      doctorPhone = this.formatPhoneNumber(doctor.phone);

      // Create message with template or text
      messageData = await this.buildWhatsAppMessage(
        doctorPhone, 
        serviceRequest, 
        business, 
        acceptUrl, 
        rejectUrl,
        doctor
      );

      const response = await axios.post(this.apiUrl, messageData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`WhatsApp notification sent to Dr. ${this.getDoctorDisplayName(doctor)}: ${response.data.messages[0].id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to send WhatsApp notification to Dr. ${this.getDoctorDisplayName(doctor)}:`);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Phone number used:', doctorPhone);
      console.error('Message data:', JSON.stringify(messageData, null, 2));
      throw error;
    }
  }

  /**
   * Format phone number for WhatsApp Business API (no + prefix, numbers only)
   */
  formatPhoneNumber(phone) {
    const WhatsAppUtils = require('../utils/whatsapp-utils');
    return WhatsAppUtils.formatPhoneForAPI(phone);
  }

  /**
   * Build WhatsApp message payload for Business API
   */
  async buildWhatsAppMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    // Try to use template first, fall back to text message
    const useTemplate = process.env.WHATSAPP_USE_TEMPLATE === 'true';
    
    if (useTemplate && process.env.WHATSAPP_TEMPLATE_NAME) {
      return this.buildTemplateMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor);
    } else {
      return this.buildTextMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor);
    }
  }

  /**
   * Build template message (for approved templates)
   */
  buildTemplateMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    
    // Handle different template types
    if (templateName === 'hello_world') {
      return this.buildHelloWorldTemplate(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor);
    }
    
    // Default template structure for custom ThanksDoc templates
    return {
      messaging_product: "whatsapp",
      to: doctorPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en_US"
        },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "text",
                text: "🏥 NEW SERVICE REQUEST"
              }
            ]
          },
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: business.name
              },
              {
                type: "text", 
                text: serviceRequest.serviceType
              },
              {
                type: "text",
                text: business.address
              },
              {
                type: "text",
                text: serviceRequest.estimatedDuration.toString()
              },
              {
                type: "text",
                text: serviceRequest.description || 'No additional details'
              }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: acceptUrl.split('/').pop() // Get the token part for the URL
              }
            ]
          },
          {
            type: "button",
            sub_type: "url", 
            index: "1",
            parameters: [
              {
                type: "text",
                text: rejectUrl.split('/').pop() // Get the token part for the URL
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Build Hello World template message (for testing)
   */
  buildHelloWorldTemplate(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    const doctorName = doctor ? this.getDoctorDisplayName(doctor) : 'Doctor';
    
    return {
      messaging_product: "whatsapp",
      to: doctorPhone,
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US"
        }
      }
    };
  }

  /**
   * Build text message (fallback when no template is approved)
   */
  buildTextMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    const urgencyEmoji = this.getUrgencyEmoji(serviceRequest.urgencyLevel);
    const serviceEmoji = this.getServiceEmoji(serviceRequest.serviceType);
    const doctorName = doctor ? this.getDoctorDisplayName(doctor) : 'Doctor';

    // Handle both business requests and direct patient requests
    const isBusinessRequest = business && business.name;
    
    let messageText;
    
    if (isBusinessRequest) {
      // Business request message
      messageText = `🏥 *NEW SERVICE REQUEST* ${urgencyEmoji}

👨‍⚕️ *Hello Dr. ${doctorName}*

${serviceEmoji} *Service:* ${serviceRequest.serviceType}
🏢 *Business:* ${business.name}
📍 *Location:* ${business.address}
⏱️ *Duration:* ${serviceRequest.estimatedDuration || 1} hour(s)
${serviceRequest.urgencyLevel === 'emergency' ? '🚨 *EMERGENCY REQUEST*' : ''}

📝 *Details:* ${serviceRequest.description || 'No additional details'}

⚡ *Quick Actions:*
✅ Accept: ${acceptUrl}
❌ Decline: ${rejectUrl}

⏰ This request expires in 24 hours.
🔒 Secure links - only you can use these.`;
    } else {
      // Direct patient request message
      messageText = `🏥 *NEW PATIENT REQUEST* ${urgencyEmoji}

👨‍⚕️ *Hello Dr. ${doctorName}*

${serviceEmoji} *Service:* ${serviceRequest.serviceType}
👤 *Patient:* ${serviceRequest.patientName || 'Not specified'}
📞 *Contact:* ${serviceRequest.patientPhone || 'Not provided'}
${serviceRequest.urgencyLevel === 'emergency' ? '🚨 *EMERGENCY REQUEST*' : ''}

📝 *Symptoms:* ${serviceRequest.description || 'Not specified'}
📋 *Notes:* ${serviceRequest.notes || 'None'}

⚡ *Quick Actions:*
✅ Accept: ${acceptUrl}
❌ Decline: ${rejectUrl}

⏰ This request expires in 24 hours.
🔒 Secure links - only you can use these.`;
    }

    return {
      messaging_product: "whatsapp",
      to: doctorPhone,
      type: "text",
      text: {
        body: messageText
      }
    };
  }

  /**
   * Build the WhatsApp message for service request notification
   */
  buildServiceRequestMessage(serviceRequest, business, acceptUrl, rejectUrl) {
    const urgencyEmoji = this.getUrgencyEmoji(serviceRequest.urgencyLevel);
    const serviceEmoji = this.getServiceEmoji(serviceRequest.serviceType);

    return `🏥 *NEW SERVICE REQUEST* ${urgencyEmoji}

${serviceEmoji} *Service:* ${serviceRequest.serviceType}
🏢 *Business:* ${business.name}
📍 *Location:* ${business.address}
⏱️ *Duration:* ${serviceRequest.estimatedDuration} hour(s)
${serviceRequest.urgencyLevel === 'emergency' ? '🚨 *EMERGENCY REQUEST*' : ''}

📝 *Details:* ${serviceRequest.description || 'No additional details'}

💰 *Estimated Payment:* Contact business for details

⚡ *Quick Actions:*
✅ Accept: ${acceptUrl}
❌ Decline: ${rejectUrl}

📱 Or reply with:
• "ACCEPT" to accept this request
• "DECLINE" to decline this request

⏰ This request expires in 24 hours.
🔒 Secure links - only you can use these.`;
  }

  /**
   * Get emoji for urgency level
   */
  getUrgencyEmoji(urgencyLevel) {
    const emojis = {
      'low': '🟢',
      'medium': '🟡', 
      'high': '🟠',
      'emergency': '🔴'
    };
    return emojis[urgencyLevel] || '⚪';
  }

  /**
   * Get emoji for service type
   */
  getServiceEmoji(serviceType) {
    const emojis = {
      'consultation': '👨‍⚕️',
      'emergency': '🚑',
      'checkup': '🩺',
      'vaccination': '💉',
      'prescription': '💊',
      'surgery': '🏥',
      'therapy': '🧘‍♀️'
    };
    return emojis[serviceType] || '⚕️';
  }

  /**
   * Send confirmation message after doctor accepts/rejects
   */
  async sendConfirmationMessage(doctorPhone, action, serviceRequest, business) {
    try {
      const formattedPhone = this.formatPhoneNumber(doctorPhone);
      
      let messageText;
      if (action === 'accept') {
        messageText = `✅ *REQUEST ACCEPTED*

Thank you for accepting the service request!

🏢 *Business:* ${business.name}
📞 *Contact:* ${business.phone}
📍 *Address:* ${business.address}

💼 *Next Steps:*
1. Contact the business directly
2. Coordinate arrival time
3. Update status in your dashboard

📱 *Dashboard:* ${this.baseUrll}/doctor/dashboard

Good luck with your service! 👨‍⚕️`;
      } else {
        messageText = `❌ *REQUEST DECLINED*

You have declined the service request.

🏢 *Business:* ${business.name}
⏱️ *Duration:* ${serviceRequest.estimatedDuration} hour(s)

The request will be offered to other available doctors.

📱 *Dashboard:* ${this.baseUrll}/doctor/dashboard

Thank you for your response! 👨‍⚕️`;
      }

      const messageData = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: messageText
        }
      };

      await axios.post(this.apiUrl, messageData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Confirmation message sent to doctor for ${action} action`);
    } catch (error) {
      console.error(`Failed to send confirmation message:`, error.response?.data || error.message);
    }
  }

  /**
   * Send notification to business about doctor acceptance
   */
  async sendBusinessNotification(businessPhone, doctor, serviceRequest) {
    try {
      if (!businessPhone) return;

      const formattedPhone = this.formatPhoneNumber(businessPhone);
      
      const messageText = `🎉 *DOCTOR ASSIGNED*

Great news! A doctor has accepted your service request.

👨‍⚕️ *Doctor:* Dr. ${doctor.name}
🏥 *Specialization:* ${doctor.specialization}
⭐ *Experience:* ${doctor.yearsOfExperience} years
📞 *Phone:* ${doctor.phone}

⏱️ *Service:* ${serviceRequest.serviceType}
🕐 *Duration:* ${serviceRequest.estimatedDuration} hour(s)

📱 *Track Progress:* ${this.baseUrll}/business/dashboard

The doctor will contact you shortly to coordinate the visit.`;

      const messageData = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: messageText
        }
      };

      await axios.post(this.apiUrl, messageData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Business notification sent for accepted service request`);
    } catch (error) {
      console.error(`Failed to send business notification:`, error.response?.data || error.message);
    }
  }

  /**
   * Handle incoming WhatsApp webhook messages
   */
  async handleIncomingMessage(webhookData) {
    try {
      const { entry } = webhookData;
      
      for (const entryItem of entry) {
        const { changes } = entryItem;
        
        for (const change of changes) {
          if (change.field === 'messages') {
            const { messages } = change.value;
            
            for (const message of messages || []) {
              if (message.type === 'text') {
                await this.processTextMessage(message);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling incoming WhatsApp message:', error);
    }
  }

  /**
   * Process incoming text messages for ACCEPT/DECLINE responses
   */
  async processTextMessage(message) {
    try {
      const { from, text } = message;
      const messageText = text.body.toLowerCase().trim();
      
      if (messageText === 'accept' || messageText === 'decline') {
        // Find doctor by phone number
        const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
          filters: {
            phone: {
              $containsi: from // Flexible phone matching
            }
          }
        });

        if (doctors.length === 0) {
          console.log(`No doctor found with phone: ${from}`);
          return;
        }

        const doctor = doctors[0];

        // Find the most recent pending service request
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const pendingRequests = await strapi.entityService.findMany('api::service-request.service-request', {
          filters: {
            status: 'pending',
            requestedAt: {
              $gte: oneDayAgo
            }
          },
          populate: ['business'],
          sort: { requestedAt: 'desc' },
          pagination: { limit: 1 }
        });

        if (pendingRequests.length === 0) {
          console.log(`No pending requests found for doctor: ${doctor.id}`);
          return;
        }

        const serviceRequest = pendingRequests[0];

        if (messageText === 'accept') {
          // Accept the service request
          await this.acceptServiceRequest(serviceRequest.id, doctor.id);
          await this.sendConfirmationMessage(doctor.phone, 'accept', serviceRequest, serviceRequest.business);
          await this.sendBusinessNotification(serviceRequest.business.phone, doctor, serviceRequest);
        } else if (messageText === 'decline') {
          await this.sendConfirmationMessage(doctor.phone, 'reject', serviceRequest, serviceRequest.business);
        }
      }
    } catch (error) {
      console.error('Error processing text message:', error);
    }
  }

  /**
   * Accept service request (extracted for reuse)
   */
  async acceptServiceRequest(serviceRequestId, doctorId) {
    // Update the service request
    await strapi.entityService.update('api::service-request.service-request', serviceRequestId, {
      data: {
        doctor: doctorId,
        status: 'accepted',
        acceptedAt: new Date(),
      }
    });

    // Set doctor as temporarily unavailable
    await strapi.entityService.update('api::doctor.doctor', doctorId, {
      data: {
        isAvailable: false,
      },
    });
  }
}

module.exports = WhatsAppService;
