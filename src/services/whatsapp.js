'use strict';

// Load environment variables
require('dotenv').config();

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
    this.frontendVideoUrl = process.env.FRONTEND_VIDEO_URL || process.env.FRONTEND_DASHBOARD_URL || 'http://localhost:3000';
    this.apiUrl = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
    
    // Template configurations
    this.useTemplate = process.env.WHATSAPP_USE_TEMPLATE === 'true';
    this.templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'doctor_accept_request';
    this.doctorConfirmationTemplate = process.env.WHATSAPP_TEMPLATE_DOCTOR_CONFIRMATION || 'doctor_confirmation';
    this.businessNotificationTemplate = process.env.WHATSAPP_TEMPLATE_BUSINESS_NOTIFICATION || 'doctor_assigned';
    this.passwordResetTemplate = process.env.WHATSAPP_TEMPLATE_PASSWORD_RESET || 'password_reset_doc';
    this.doctorVideoCallTemplate = process.env.WHATSAPP_TEMPLATE_DOCTOR_VIDEO_CALL || 'doctor_video_call_link';
    this.patientVideoCallTemplate = process.env.WHATSAPP_TEMPLATE_PATIENT_VIDEO_CALL || 'patient_video_call_link';
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
    
    console.log('🔍 WhatsApp sendServiceRequestNotification called with serviceRequest:', {
      id: serviceRequest.id,
      serviceDateTime: serviceRequest.serviceDateTime,
      requestedServiceDateTime: serviceRequest.requestedServiceDateTime,
      keys: Object.keys(serviceRequest)
    });
    
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

      // Use the new diagnostic send method
      const response = await this.sendWhatsAppMessage(messageData);

      console.log(`WhatsApp notification sent to Dr. ${this.getDoctorDisplayName(doctor)}: ${response.messages[0].id}`);
      return response;
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
    } else if (templateName === 'sample_issue_resolution') {
      return this.buildIssueResolutionTemplate(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor);
    } else if (templateName === 'doctor_accept_request') {
      return this.buildDoctorAcceptRequestTemplate(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor);
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
   * Build Issue Resolution template message
   */
  buildIssueResolutionTemplate(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    const doctorName = doctor ? this.getDoctorDisplayName(doctor) : 'Doctor';
    
    return {
      messaging_product: "whatsapp",
      to: doctorPhone,
      type: "template",
      template: {
        name: "sample_issue_resolution",
        language: {
          code: "en_US"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: doctorName
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Build Doctor Accept Request template message
   */
  buildDoctorAcceptRequestTemplate(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    const doctorName = doctor ? this.getDoctorDisplayName(doctor) : 'Doctor';
    
    // Format service date and time for display
    const formatServiceDateTime = (dateTimeString) => {
      console.log('🔍 formatServiceDateTime called with:', dateTimeString, 'Type:', typeof dateTimeString);
      
      if (!dateTimeString) {
        console.log('🔍 formatServiceDateTime: No dateTimeString provided');
        return 'Not specified';
      }
      
      try {
        console.log('🔍 formatServiceDateTime: Creating date from:', dateTimeString);
        const date = new Date(dateTimeString);
        console.log('🔍 Date object created:', date);
        console.log('🔍 Date.getTime():', date.getTime());
        
        if (isNaN(date.getTime())) {
          console.log('🔍 formatServiceDateTime: Invalid date');
          return 'Not specified';
        }
        
        const formatted = date.toLocaleString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Africa/Nairobi' // East Africa Time
        });
        
        console.log('🔍 formatServiceDateTime formatted output:', formatted);
        return formatted; // Don't add "Scheduled for" here as it's already in the Facebook template
      } catch (error) {
        console.error('❌ formatServiceDateTime error:', error);
        return 'Not specified';
      }
    };
    
    const serviceDateTime = formatServiceDateTime(serviceRequest.requestedServiceDateTime);
    
    return {
      messaging_product: "whatsapp",
      to: doctorPhone,
      type: "template",
      template: {
        name: "doctor_accept_request",
        language: {
          code: "en_GB" // UK English
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: doctorName // {{1}} Doctor name
              },
              {
                type: "text",
                text: serviceRequest.serviceType || "Medical service" // {{2}} Service type
              },
              {
                type: "text",
                text: business.name || business.businessName || "Healthcare provider" // {{3}} Business name
              },
              {
                type: "text",
                text: business.address || "Location not specified" // {{4}} Address
              },
              {
                type: "text",
                text: serviceRequest.estimatedDuration?.toString() || "Not specified" // {{5}} Duration
              },
              {
                type: "text",
                text: serviceRequest.description || "No additional details" // {{6}} Description
              },
              {
                type: "text",
                text: serviceDateTime // {{7}} Service date/time
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
                text: acceptUrl // {{8}} Dynamic URL for Accept button
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
                text: rejectUrl // {{9}} Dynamic URL for Decline button
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Build doctor confirmation template message (when doctor accepts a request)
   */
  buildDoctorConfirmationTemplate(doctorPhone, serviceRequest, business) {
    const dashboardUrl = `${this.baseUrll}/doctor/dashboard`;
    
    return {
      messaging_product: "whatsapp",
      to: doctorPhone,
      type: "template",
      template: {
        name: this.doctorConfirmationTemplate,
        language: {
          code: "en_GB"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: business.name || business.businessName // {{1}} Business
              },
              {
                type: "text", 
                text: business.address // {{2}} Address
              },
              {
                type: "text",
                text: dashboardUrl // {{3}} Dashboard
              },
              {
                type: "text",
                text: business.phone // {{4}} Contact
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Build business notification template message (when doctor is assigned)
   */
  buildBusinessNotificationTemplate(businessPhone, doctor, serviceRequest) {
    const dashboardUrl = `${this.baseUrll}/business/dashboard`;
    
    return {
      messaging_product: "whatsapp",
      to: businessPhone,
      type: "template", 
      template: {
        name: this.businessNotificationTemplate,
        language: {
          code: "en_GB"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: doctor.name || doctor.firstName + ' ' + doctor.lastName || "Doctor" // {{1}} Doctor
              },
              {
                type: "text",
                text: doctor.specialization || "General Practice" // {{2}} Specialisation
              },
              {
                type: "text",
                text: (doctor.yearsOfExperience || 0).toString() // {{3}} Experience
              },
              {
                type: "text",
                text: doctor.phone || "N/A" // {{4}} Phone
              },
              {
                type: "text",
                text: serviceRequest.serviceType // {{5}} Service
              },
              {
                type: "text",
                text: serviceRequest.estimatedDuration.toString() // {{6}} Duration
              },
              {
                type: "text",
                text: dashboardUrl // {{7}} Track Progress
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Build text message (fallback when no template is approved)
   */
  buildTextMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    // Check if interactive messages are enabled
    const useInteractiveButtons = process.env.WHATSAPP_USE_INTERACTIVE_BUTTONS === 'true';
    
    if (useInteractiveButtons) {
      return this.buildInteractiveMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor);
    }
    
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
⏱️ *Duration:* ${serviceRequest.estimatedDuration || 20} minute(s)
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
   * Build interactive message with clickable buttons
   */
  buildInteractiveMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    const urgencyEmoji = this.getUrgencyEmoji(serviceRequest.urgencyLevel);
    const serviceEmoji = this.getServiceEmoji(serviceRequest.serviceType);
    const doctorName = doctor ? this.getDoctorDisplayName(doctor) : 'Doctor';

    // Handle both business requests and direct patient requests
    const isBusinessRequest = business && business.name;
    
    let messageText;
    
    if (isBusinessRequest) {
      // Business request message without links (buttons will handle actions)
      messageText = `🏥 *NEW SERVICE REQUEST* ${urgencyEmoji}

👨‍⚕️ *Hello Dr. ${doctorName}*

${serviceEmoji} *Service:* ${serviceRequest.serviceType}
🏢 *Business:* ${business.name}
📍 *Location:* ${business.address}
⏱️ *Duration:* ${serviceRequest.estimatedDuration || 20} minute(s)
${serviceRequest.urgencyLevel === 'emergency' ? '🚨 *EMERGENCY REQUEST*' : ''}

📝 *Details:* ${serviceRequest.description || 'No additional details'}

⏰ This request expires in 24 hours.
👇 Please choose your action below:`;
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

⏰ This request expires in 24 hours.
👇 Please choose your action below:`;
    }

    // Generate acceptance token for payload
    const acceptanceToken = this.generateAcceptanceToken(serviceRequest.id, doctor.id);

    return {
      messaging_product: "whatsapp",
      to: doctorPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: messageText
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: `accept_${serviceRequest.id}_${doctor.id}`,
                title: "✅ Accept"
              }
            },
            {
              type: "reply",
              reply: {
                id: `decline_${serviceRequest.id}_${doctor.id}`,
                title: "❌ Decline"
              }
            }
          ]
        }
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
⏱️ *Duration:* ${serviceRequest.estimatedDuration} minute(s)
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
      
      if (action === 'accept' && this.useTemplate) {
        // Use template for doctor confirmation
        const templateMessage = this.buildDoctorConfirmationTemplate(
          formattedPhone, 
          serviceRequest, 
          business
        );
        
        console.log('📱 Sending doctor confirmation template message');
        console.log('📱 Full payload:', JSON.stringify(templateMessage, null, 2));
        
        const response = await axios.post(this.apiUrl, templateMessage, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Doctor confirmation template sent successfully');
        return;
      }
      
      // Fallback to text message
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
⏱️ *Duration:* ${serviceRequest.estimatedDuration} minute(s)

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
      
      if (this.useTemplate) {
        // Use template for business notification
        const templateMessage = this.buildBusinessNotificationTemplate(
          formattedPhone,
          doctor,
          serviceRequest
        );
        
        console.log('📱 Sending business notification template message');
        console.log('📱 Full payload:', JSON.stringify(templateMessage, null, 2));
        
        const response = await axios.post(this.apiUrl, templateMessage, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Business notification template sent successfully');
        return;
      }
      
      // Fallback to text message
      const messageText = `🎉 *DOCTOR ASSIGNED*

Great news! A doctor has accepted your service request.

👨‍⚕️ *Doctor:* Dr. ${doctor.name}
🏥 *Specialization:* ${doctor.specialization}
⭐ *Experience:* ${doctor.yearsOfExperience} years
📞 *Phone:* ${doctor.phone}

⏱️ *Service:* ${serviceRequest.serviceType}
🕐 *Duration:* ${serviceRequest.estimatedDuration} minute(s)

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
      console.log('📨 Received WhatsApp webhook data:', JSON.stringify(webhookData, null, 2));
      
      const { entry } = webhookData;
      
      for (const entryItem of entry) {
        const { changes } = entryItem;
        
        for (const change of changes) {
          if (change.field === 'messages') {
            const { messages } = change.value;
            
            for (const message of messages || []) {
              console.log('🔍 Processing message type:', message.type);
              console.log('📱 Message details:', JSON.stringify(message, null, 2));
              
              if (message.type === 'text') {
                await this.processTextMessage(message);
              } else if (message.type === 'interactive') {
                await this.processInteractiveMessage(message);
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
   * Process incoming interactive messages (Quick Reply buttons)
   */
  async processInteractiveMessage(message) {
    try {
      console.log('🔄 Processing interactive message:', JSON.stringify(message, null, 2));
      
      const { from, interactive } = message;
      
      // Handle Quick Reply button responses
      if (interactive.type === 'button_reply') {
        const buttonId = interactive.button_reply.id;
        const buttonTitle = interactive.button_reply.title;
        
        console.log(`🎯 Button clicked - ID: ${buttonId}, Title: ${buttonTitle}, From: ${from}`);
        
        // Parse button ID to extract action, service request ID, and doctor ID
        // Format: accept_123_456 or decline_123_456
        const buttonParts = buttonId.split('_');
        if (buttonParts.length === 3) {
          const action = buttonParts[0]; // 'accept' or 'decline'
          const serviceRequestId = parseInt(buttonParts[1]);
          const doctorId = parseInt(buttonParts[2]);
          
          console.log(`📋 Parsed button data - Action: ${action}, Service Request: ${serviceRequestId}, Doctor: ${doctorId}`);
          
          // Find doctor by phone number to verify
          const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
            filters: {
              phone: {
                $containsi: from // Flexible phone matching
              }
            }
          });

          if (doctors.length === 0) {
            console.log(`❌ No doctor found with phone: ${from}`);
            await this.sendSimpleMessage(from, "❌ Sorry, we couldn't verify your identity. Please contact support.");
            return;
          }

          const doctor = doctors[0];
          
          // Verify doctor ID matches
          if (doctor.id !== doctorId) {
            console.log(`❌ Doctor ID mismatch - Found: ${doctor.id}, Expected: ${doctorId}`);
            await this.sendSimpleMessage(from, "❌ Security verification failed. Please contact support.");
            return;
          }

          // Find the specific service request
          const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', serviceRequestId, {
            populate: ['business', 'doctor']
          });

          if (!serviceRequest) {
            console.log(`❌ Service request not found: ${serviceRequestId}`);
            await this.sendSimpleMessage(from, "❌ Service request not found or has expired.");
            return;
          }

          // Check if request is still pending
          if (serviceRequest.status !== 'pending') {
            console.log(`❌ Service request status is not pending: ${serviceRequest.status}`);
            await this.sendSimpleMessage(from, `❌ This request is no longer available (Status: ${serviceRequest.status.toUpperCase()}).`);
            return;
          }

          // Process the action
          if (action === 'accept') {
            console.log(`✅ Processing ACCEPT for request ${serviceRequestId} by doctor ${doctorId}`);
            await this.acceptServiceRequest(serviceRequestId, doctorId);
            await this.sendConfirmationMessage(doctor.phone, 'accept', serviceRequest, serviceRequest.business);
            
            // Send business notification if business phone is available
            if (serviceRequest.business?.phone) {
              await this.sendBusinessNotification(serviceRequest.business.phone, doctor, serviceRequest);
            }
          } else if (action === 'decline') {
            console.log(`❌ Processing DECLINE for request ${serviceRequestId} by doctor ${doctorId}`);
            await this.sendConfirmationMessage(doctor.phone, 'reject', serviceRequest, serviceRequest.business);
          }
          
          return;
        }
        
        // Fallback: Process as if it's a text message with the button title
        const simulatedTextMessage = {
          from: from,
          text: {
            body: buttonTitle.toLowerCase()
          }
        };
        
        await this.processTextMessage(simulatedTextMessage);
      }
    } catch (error) {
      console.error('Error processing interactive message:', error);
      
      // Send error message to user
      try {
        await this.sendSimpleMessage(message.from, "❌ Sorry, there was an error processing your request. Please try again or contact support.");
      } catch (sendError) {
        console.error('Failed to send error message:', sendError);
      }
    }
  }

  /**
   * Process incoming text messages for ACCEPT/DECLINE responses
   */
  async processTextMessage(message) {
    try {
      const { from, text } = message;
      const messageText = text.body.toLowerCase().trim();
      
      // Handle both old format and new template Quick Reply responses
      if (messageText === 'accept' || messageText === 'decline' || 
          messageText === 'accept request' || messageText === 'decline request') {
        
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

        if (messageText === 'accept' || messageText === 'accept request') {
          // Accept the service request
          await this.acceptServiceRequest(serviceRequest.id, doctor.id);
          await this.sendConfirmationMessage(doctor.phone, 'accept', serviceRequest, serviceRequest.business);
          await this.sendBusinessNotification(serviceRequest.business.phone, doctor, serviceRequest);
        } else if (messageText === 'decline' || messageText === 'decline request') {
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

  /**
   * Send WhatsApp message with detailed error logging for debugging
   */
  async sendWhatsAppMessage(payload) {
    try {
      console.log('📱 Sending WhatsApp message to:', payload.to);
      console.log('📱 Message type:', payload.type);
      console.log('📱 Full payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ WhatsApp API Response:', response.status, response.statusText);
      console.log('✅ Response data:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      // Enhanced error logging for debugging
      console.error('❌ WhatsApp API Error Details:');
      console.error('Phone number:', payload.to);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.statusText);
      console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
      
      // Check for specific WhatsApp API errors
      if (error.response?.data?.error) {
        const whatsappError = error.response.data.error;
        console.error('WhatsApp specific error:', whatsappError);
        
        // Common error codes and their meanings
        if (whatsappError.code === 131026) {
          console.error('🚫 PHONE NUMBER RESTRICTION: This number is not verified for your WhatsApp Business account');
          console.error('💡 Solution: Add this number to your verified numbers in Meta Business Manager');
        } else if (whatsappError.code === 131047) {
          console.error('🚫 RATE LIMIT: Too many messages sent recently');
          console.error('💡 Solution: Wait before sending more messages');
        } else if (whatsappError.code === 131051) {
          console.error('🚫 UNSUPPORTED MESSAGE TYPE: This message type is not supported');
        } else if (whatsappError.code === 100) {
          console.error('🚫 INVALID PARAMETER: Check your message format and phone number');
        }
      }
      
      throw error;
    }
  }

  /**
   * Send a simple text message
   */
  async sendSimpleMessage(phone, messageText) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: messageText
        }
      };
      
      return await this.sendWhatsAppMessage(payload);
    } catch (error) {
      console.error('Failed to send simple message:', error);
      throw error;
    }
  }

  /**
   * Check if a phone number is verified for your WhatsApp Business account
   */
  async checkPhoneVerificationStatus(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log(`🔍 Checking verification status for: ${formattedPhone}`);
      
      // Try sending a test message to see if the number is verified
      const testPayload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: "🔍 Test message - checking verification status"
        }
      };
      
      try {
        await this.sendWhatsAppMessage(testPayload);
        console.log(`✅ Phone number ${formattedPhone} is verified and can receive messages`);
        return { verified: true, phone: formattedPhone };
      } catch (error) {
        if (error.response?.data?.error?.code === 131026) {
          console.log(`❌ Phone number ${formattedPhone} is NOT verified for your WhatsApp Business account`);
          return { verified: false, phone: formattedPhone, reason: 'Not verified' };
        } else {
          console.log(`⚠️ Unable to determine verification status for ${formattedPhone}: ${error.message}`);
          return { verified: false, phone: formattedPhone, reason: error.message };
        }
      }
    } catch (error) {
      console.error(`Error checking phone verification:`, error);
      return { verified: false, phone: phoneNumber, reason: 'Format error' };
    }
  }

  /**
   * Get list of verified phone numbers from Meta Business Manager
   */
  async getVerifiedPhoneNumbers() {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.businessAccountId}/phone_numbers`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      
      console.log('📋 Verified phone numbers:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching verified phone numbers:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Send password reset token via WhatsApp using approved template
   */
  async sendPasswordResetToken(phoneNumber, resetToken, userName = 'User') {
    try {
      console.log(`📱 Sending password reset token to: ${phoneNumber}`);
      
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Always use the correct frontend URL for the reset link
      // Use FRONTEND_DASHBOARD_URL, fallback to BASE_URL if needed
      const frontendUrl = process.env.FRONTEND_DASHBOARD_URL || process.env.BASE_URL || 'http://localhost:3000';
      // Try to get the user's email from the context if available
      let email = '';
      if (typeof arguments[3] === 'string') {
        email = arguments[3];
      }
      // The reset link must always point to the frontend reset-password page
      const resetUrl = email
        ? `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
        : `${frontendUrl}/reset-password?token=${resetToken}`;

      // Use template if available, otherwise fall back to text message
      let messageData;

      if (this.useTemplate && this.passwordResetTemplate) {
        // Use approved WhatsApp template for password reset (2 parameters: name, link)
        messageData = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: this.passwordResetTemplate,
            language: {
              code: 'en_GB'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: userName
                  },
                  {
                    type: 'text',
                    text: resetUrl
                  }
                ]
              }
            ]
          }
        };
      } else {
        // Fallback to text message (may not work in production without prior conversation)
        const message = `🔐 ThanksDoc Password Reset\n\nHello ${userName},\n\nClick the link below to reset your password:\n\n${resetUrl}\n\nIf you didn't request this, please ignore this message.`;
        messageData = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message
          }
        };
      }
      
      const response = await this.sendWhatsAppMessage(messageData);
      console.log(`✅ Password reset token sent successfully to: ${phoneNumber}`);
      return response;
      
    } catch (error) {
      console.error(`❌ Failed to send password reset token to ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Send video call link to doctor for online consultation
   */
  async sendVideoCallLinkToDoctor(doctor, serviceRequest, videoCallUrl) {
    try {
      // Format scheduled time
      const scheduledTime = new Date(serviceRequest.requestedServiceDateTime).toLocaleString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create our platform URL instead of direct Whereby URL
      const platformVideoUrl = `${this.frontendVideoUrl}/consultation/${serviceRequest.id}?type=doctor&roomUrl=${encodeURIComponent(videoCallUrl)}`;

      const messageData = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(doctor.phone),
        type: 'template',
        template: {
          name: this.doctorVideoCallTemplate,
          language: {
            code: 'en_GB'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: `${doctor.firstName} ${doctor.lastName}`
                },
                {
                  type: 'text',
                  text: `${serviceRequest.patientFirstName} ${serviceRequest.patientLastName}`
                },
                {
                  type: 'text',
                  text: serviceRequest.serviceType || 'Online Consultation'
                },
                {
                  type: 'text',
                  text: scheduledTime
                },
                {
                  type: 'text',
                  text: platformVideoUrl
                },
                {
                  type: 'text',
                  text: serviceRequest.business?.businessName || serviceRequest.business?.name || 'ThanksDoc Patient'
                }
              ]
            }
          ]
        }
      };

      const response = await this.sendWhatsAppMessage(messageData);
      console.log(`✅ Video call link sent to doctor: ${doctor.firstName} ${doctor.lastName}`);
      console.log(`📱 Platform URL sent: ${platformVideoUrl}`);
      return response;

    } catch (error) {
      console.error(`❌ Failed to send video call link to doctor ${doctor.id}:`, error);
      throw error;
    }
  }

  /**
   * Send video call link to patient for online consultation
   */
  async sendVideoCallLinkToPatient(serviceRequest, doctor, videoCallUrl) {
    try {
      if (!serviceRequest.patientPhone) {
        console.warn('⚠️ No patient phone number provided for video call notification');
        return null;
      }

      // Format scheduled time
      const scheduledTime = new Date(serviceRequest.requestedServiceDateTime).toLocaleString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create our platform URL instead of direct Whereby URL
      const platformVideoUrl = `${this.frontendVideoUrl}/consultation/${serviceRequest.id}?type=patient&roomUrl=${encodeURIComponent(videoCallUrl)}`;

      const messageData = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(serviceRequest.patientPhone),
        type: 'template',
        template: {
          name: this.patientVideoCallTemplate,
          language: {
            code: 'en_GB'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: serviceRequest.patientFirstName || 'Patient'
                },
                {
                  type: 'text',
                  text: `${doctor.firstName} ${doctor.lastName}`
                },
                {
                  type: 'text',
                  text: `${doctor.firstName} ${doctor.lastName}`
                },
                {
                  type: 'text',
                  text: serviceRequest.serviceType || 'Online Consultation'
                },
                {
                  type: 'text',
                  text: scheduledTime
                },
                {
                  type: 'text',
                  text: platformVideoUrl
                },
                {
                  type: 'text',
                  text: serviceRequest.business?.businessName || serviceRequest.business?.name || 'ThanksDoc Patient'
                }
              ]
            }
          ]
        }
      };

      const response = await this.sendWhatsAppMessage(messageData);
      console.log(`✅ Video call link sent to patient: ${serviceRequest.patientFirstName} ${serviceRequest.patientLastName}`);
      console.log(`📱 Platform URL sent: ${platformVideoUrl}`);
      return response;

    } catch (error) {
      console.error(`❌ Failed to send video call link to patient:`, error);
      throw error;
    }
  }

  /**
   * Send video call links to both doctor and patient
   */
  async sendVideoCallNotifications(doctor, serviceRequest, videoCallUrl) {
    try {
      console.log('🎥 Sending video call notifications for online consultation');
      
      const notifications = [];
      
      // Send to doctor
      try {
        const doctorNotification = await this.sendVideoCallLinkToDoctor(doctor, serviceRequest, videoCallUrl);
        notifications.push({ type: 'doctor', success: true, data: doctorNotification });
      } catch (error) {
        console.error('❌ Failed to send video call link to doctor:', error);
        notifications.push({ type: 'doctor', success: false, error: error.message });
      }

      // Send to patient (only if phone number is provided)
      if (serviceRequest.patientPhone) {
        try {
          const patientNotification = await this.sendVideoCallLinkToPatient(serviceRequest, doctor, videoCallUrl);
          notifications.push({ type: 'patient', success: true, data: patientNotification });
        } catch (error) {
          console.error('❌ Failed to send video call link to patient:', error);
          notifications.push({ type: 'patient', success: false, error: error.message });
        }
      } else {
        console.warn('⚠️ Patient phone number not provided, skipping patient notification');
        notifications.push({ type: 'patient', success: false, error: 'No phone number provided' });
      }

      console.log('✅ Video call notifications completed:', notifications);
      return notifications;

    } catch (error) {
      console.error('❌ Error sending video call notifications:', error);
      throw error;
    }
  }
}

module.exports = WhatsAppService;
