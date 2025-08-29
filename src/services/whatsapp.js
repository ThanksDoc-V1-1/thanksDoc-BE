'use strict';

// Load environment variables
require('dotenv').config();

const axios = require('axios');
const crypto = require('crypto');
const { calculateDistance } = require('../utils/distance');
const SecurityLogger = require('../utils/security-logger');

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
    this.templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'doctor_receive_request';
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
    console.log('🚀 STARTING sendServiceRequestNotification');
    console.log('🔍 Doctor data:', {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      phone: doctor.phone
    });
    console.log('🔍 ServiceRequest data:', {
      id: serviceRequest.id,
      serviceType: serviceRequest.serviceType,
      status: serviceRequest.status
    });
    console.log('🔍 Business data:', {
      id: business?.id,
      name: business?.name,
      businessName: business?.businessName,
      latitude: business?.latitude,
      longitude: business?.longitude
    });
    console.log('🔍 Doctor data:', {
      id: doctor?.id,
      firstName: doctor?.firstName,
      lastName: doctor?.lastName,
      phone: doctor?.phone,
      latitude: doctor?.latitude,
      longitude: doctor?.longitude
    });
    
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
      const acceptUrl = acceptanceToken; // Token for accept button
      const rejectUrl = acceptanceToken; // Same token but will use different endpoint URL

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
    console.log('🔨 buildWhatsAppMessage called');
    console.log('🔍 useTemplate env var:', process.env.WHATSAPP_USE_TEMPLATE);
    console.log('🔍 templateName env var:', process.env.WHATSAPP_TEMPLATE_NAME);
    
    // Try to use template first, fall back to text message
    const useTemplate = process.env.WHATSAPP_USE_TEMPLATE === 'true';
    
    console.log('🔍 useTemplate resolved to:', useTemplate);
    
    if (useTemplate && process.env.WHATSAPP_TEMPLATE_NAME) {
      console.log('🔍 Using buildTemplateMessage');
      return this.buildTemplateMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor);
    } else {
      console.log('🔍 Using buildTextMessage');
      return this.buildTextMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor);
    }
  }

  /**
   * Build template message (for approved templates)
   */
  buildTemplateMessage(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    
    console.log('🔍 DEBUG: buildTemplateMessage called with templateName:', templateName);
    console.log('🔍 DEBUG: Checking conditions...');
    
    // FORCE ALL REQUESTS TO USE buildDoctorAcceptRequestTemplate - NO EXCEPTIONS
    console.log('🔍 DEBUG: FORCING buildDoctorAcceptRequestTemplate for ALL requests');
    return this.buildDoctorAcceptRequestTemplate(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor);
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
   * Calculate distance between business and doctor in miles
   */
  calculateDistanceInMiles(business, doctor) {
    // Enhanced logging for production debugging
    console.log('\n🔍 WhatsApp Distance Calculation Debug:');
    console.log('📍 Business object keys:', business ? Object.keys(business) : 'null/undefined');
    console.log('👨‍⚕️ Doctor object keys:', doctor ? Object.keys(doctor) : 'null/undefined');
    console.log('📏 Business coordinates:', {
      latitude: business ? business.latitude : 'N/A',
      longitude: business ? business.longitude : 'N/A',
      latType: business && business.latitude ? typeof business.latitude : 'N/A',
      lngType: business && business.longitude ? typeof business.longitude : 'N/A'
    });
    console.log('👨‍⚕️ Doctor coordinates:', {
      latitude: doctor ? doctor.latitude : 'N/A',
      longitude: doctor ? doctor.longitude : 'N/A',
      latType: doctor && doctor.latitude ? typeof doctor.latitude : 'N/A',
      lngType: doctor && doctor.longitude ? typeof doctor.longitude : 'N/A'
    });
    
    // Check if both business and doctor have valid coordinates
    if (!business || !doctor) {
      console.log('❌ Missing business or doctor object');
      return 'Unknown';
    }
    
    // Handle both string and number coordinates
    const businessLat = business.latitude ? parseFloat(business.latitude) : NaN;
    const businessLng = business.longitude ? parseFloat(business.longitude) : NaN;
    const doctorLat = doctor.latitude ? parseFloat(doctor.latitude) : NaN;
    const doctorLng = doctor.longitude ? parseFloat(doctor.longitude) : NaN;
    
    // Validate coordinates
    if (isNaN(businessLat) || isNaN(businessLng) || isNaN(doctorLat) || isNaN(doctorLng)) {
      console.log('🔍 Distance calculation: Invalid coordinates detected', {
        business: { lat: business.latitude, lng: business.longitude },
        doctor: { lat: doctor.latitude, lng: doctor.longitude },
        parsed: { businessLat, businessLng, doctorLat, doctorLng }
      });
      return 'Unknown';
    }
    
    // Calculate distance in kilometers using Haversine formula
    const distanceKm = calculateDistance(businessLat, businessLng, doctorLat, doctorLng);
    
    // Convert to miles (1 km = 0.621371 miles)
    const distanceMiles = distanceKm * 0.621371;
    
    // Format the distance nicely
    if (distanceMiles < 0.1) {
      // Very close - show in feet
      const feet = Math.round(distanceMiles * 5280);
      return `${feet}ft`;
    } else if (distanceMiles < 1) {
      // Less than a mile - show one decimal place
      return `${distanceMiles.toFixed(1)} miles`;
    } else if (distanceMiles < 10) {
      // Less than 10 miles - show one decimal place
      return `${distanceMiles.toFixed(1)} miles`;
    } else {
      // 10+ miles - round to nearest mile
      return `${Math.round(distanceMiles)} miles`;
    }
  }

  /**
   * Build Doctor Accept Request template message
   */
  buildDoctorAcceptRequestTemplate(doctorPhone, serviceRequest, business, acceptUrl, rejectUrl, doctor = null) {
    const doctorName = doctor ? this.getDoctorDisplayName(doctor) : 'Doctor';
    
    // Calculate doctor's take-home pay (90% of service cost, same as dashboard)
    const calculateDoctorTakeHome = (servicePrice) => {
      return servicePrice * 0.9; // Doctor keeps 90%, ThanksDoc takes 10%
    };
    
    // Get the service price from multiple possible sources
    let servicePrice = 0;
    
    // Try to get BASE service price (what doctor gets paid from) - NOT total amount
    if (serviceRequest.servicePrice && parseFloat(serviceRequest.servicePrice) > 0) {
      servicePrice = parseFloat(serviceRequest.servicePrice);
      console.log('💰 Using serviceRequest.servicePrice (base price):', servicePrice);
    } else if (serviceRequest.serviceCost && parseFloat(serviceRequest.serviceCost) > 0) {
      servicePrice = parseFloat(serviceRequest.serviceCost);
      console.log('💰 Using serviceRequest.serviceCost (base price):', servicePrice);
    } else if (serviceRequest.service && serviceRequest.service.price && parseFloat(serviceRequest.service.price) > 0) {
      servicePrice = parseFloat(serviceRequest.service.price);
      console.log('💰 Using serviceRequest.service.price (base price):', servicePrice);
    } else if (serviceRequest.totalAmount && parseFloat(serviceRequest.totalAmount) > 0) {
      // Fallback to totalAmount only if no base service price is available
      servicePrice = parseFloat(serviceRequest.totalAmount);
      console.log('💰 Using serviceRequest.totalAmount as fallback:', servicePrice);
      console.log('⚠️ Warning: Using totalAmount instead of base service price - doctor take-home calculation may be incorrect');
    } else {
      console.log('⚠️ No service price found in serviceRequest:', {
        servicePrice: serviceRequest.servicePrice,
        serviceCost: serviceRequest.serviceCost,
        totalAmount: serviceRequest.totalAmount,
        serviceData: serviceRequest.service,
        availableKeys: Object.keys(serviceRequest)
      });
    }
    
    const doctorTakeHome = servicePrice > 0 ? calculateDoctorTakeHome(servicePrice) : 0;
    const formattedTakeHome = doctorTakeHome > 0 ? `£${doctorTakeHome.toFixed(2)}` : 'To be confirmed';
    
    console.log('💰 Price calculation:', {
      servicePrice,
      doctorTakeHome,
      formattedTakeHome
    });
    
    // Format service date and time for display
    const formatServiceDateTime = (dateTimeString) => {
      ('🔍 formatServiceDateTime called with:', dateTimeString, 'Type:', typeof dateTimeString);
      
      if (!dateTimeString) {
        ('🔍 formatServiceDateTime: No dateTimeString provided');
        return { date: 'Not specified', time: 'Not specified' };
      }
      
      try {
        ('🔍 formatServiceDateTime: Processing datetime string directly');
        
        // Parse the datetime string directly to avoid timezone conversion
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
          ('🔍 formatServiceDateTime: Invalid date');
          return { date: 'Not specified', time: 'Not specified' };
        }
        
        // Extract the original time components from the ISO string
        // This preserves the exact time that was originally selected
        let timeString = '';
        let dateString = '';
        
        if (typeof dateTimeString === 'string' && dateTimeString.includes('T')) {
          // Handle ISO format: "2025-09-03T14:17:00.000Z"
          const [datePart, timePart] = dateTimeString.split('T');
          const timeOnly = timePart.split('.')[0]; // Remove milliseconds and Z
          const [hours, minutes] = timeOnly.split(':');
          
          console.log('🔍 Parsing ISO datetime:');
          console.log('  - Original string:', dateTimeString);
          console.log('  - Date part:', datePart);
          console.log('  - Time part:', timePart);
          console.log('  - Time only:', timeOnly);
          console.log('  - Hours:', hours, 'Minutes:', minutes);
          
          // Format date
          const dateObj = new Date(datePart);
          dateString = dateObj.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          
          // Format time manually to preserve exact selected time
          const hour24 = parseInt(hours);
          const minute = parseInt(minutes);
          const isPM = hour24 >= 12;
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
          const minuteStr = minute.toString().padStart(2, '0');
          timeString = `${hour12}:${minuteStr} ${isPM ? 'pm' : 'am'}`;
          
          console.log('🔍 Manual time formatting:');
          console.log('  - hour24:', hour24, 'minute:', minute);
          console.log('  - hour12:', hour12, 'isPM:', isPM);
          console.log('  - Final time string:', timeString);
          
        } else {
          // Fallback to regular formatting if not ISO format
          dateString = date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          
          timeString = date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }
        
        ('🔍 formatServiceDateTime formatted output:', { date: dateString, time: timeString });
        return { date: dateString, time: timeString };
      } catch (error) {
        console.error('❌ formatServiceDateTime error:', error);
        return { date: 'Not specified', time: 'Not specified' };
      }
    };
    
    const { date: serviceDate, time: serviceTime } = formatServiceDateTime(serviceRequest.requestedServiceDateTime);
    
    // Calculate distance between business and doctor (or show "Online" for online services)
    let distanceText;
    if (serviceRequest.service && serviceRequest.service.category === 'online') {
      distanceText = "Online";
    } else {
      distanceText = this.calculateDistanceInMiles(business, doctor);
    }
    
    // Determine location text based on service category
    let locationText;
    if (serviceRequest.service && serviceRequest.service.category === 'online') {
      locationText = "Online";
    } else {
      locationText = business.address || "Location not specified";
    }
    
    return {
      messaging_product: "whatsapp",
      to: doctorPhone,
      type: "template",
      template: {
        name: this.templateName,
        language: {
          code: "en" // UK English
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
                text: serviceRequest.serviceType || "Medical service" // {{2}} Job Type
              },
              {
                type: "text",
                text: business.name || business.businessName || "Healthcare provider" // {{3}} Business name
              },
              {
                type: "text",
                text: locationText // {{4}} Location - "Online" for online services, business address for in-person
              },
              {
                type: "text",
                text: serviceRequest.estimatedDuration?.toString() || "Unknown" // {{5}} Duration in minutes
              },
              {
                type: "text",
                text: formattedTakeHome // {{6}} Pay (doctor's take-home after 10% commission)
              },
              {
                type: "text",
                text: distanceText // {{7}} Distance in miles between business and doctor, or "Online" for online services
              },
              {
                type: "text",
                text: serviceDate // {{8}} Date
              },
              {
                type: "text",
                text: serviceTime // {{9}} Time
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
                text: acceptUrl.split('/').pop() // Just the token
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
                text: rejectUrl.split('/').pop() // Use reject token for second button
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
        
        ('📱 Sending doctor confirmation template message');
        ('📱 Full payload:', JSON.stringify(templateMessage, null, 2));
        
        const response = await axios.post(this.apiUrl, templateMessage, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        ('✅ Doctor confirmation template sent successfully');
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

      (`Confirmation message sent to doctor for ${action} action`);
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
        
        ('📱 Sending business notification template message');
        ('📱 Full payload:', JSON.stringify(templateMessage, null, 2));
        
        const response = await axios.post(this.apiUrl, templateMessage, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        ('✅ Business notification template sent successfully');
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

      (`Business notification sent for accepted service request`);
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
          // SECURITY: Only process user messages, not system status updates
          if (change.field === 'messages') {
            const { messages, statuses } = change.value;
            
            // Skip processing if this is a status update webhook (delivery, read receipts, etc.)
            if (statuses && statuses.length > 0) {
              console.log('📊 Received message status update - ignoring to prevent auto-acceptance');
              console.log('Status details:', JSON.stringify(statuses, null, 2));
              continue;
            }
            
            for (const message of messages || []) {
              // SECURITY: Additional validation to ensure this is a user-initiated message
              if (!message.from || !message.type) {
                console.log('⚠️ Skipping invalid message structure');
                continue;
              }
              
              // SECURITY: Skip system messages or automated responses
              if (message.system || message.context?.from === 'system') {
                console.log('⚠️ Skipping system message to prevent auto-acceptance');
                continue;
              }
              
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
      
      // SECURITY: Additional validation for interactive messages
      if (!interactive || !interactive.button_reply) {
        console.log('⚠️ Invalid interactive message structure - skipping');
        return;
      }
      
      // Handle Quick Reply button responses
      if (interactive.type === 'button_reply') {
        const buttonId = interactive.button_reply.id;
        const buttonTitle = interactive.button_reply.title;
        
        console.log(`🎯 Button clicked - ID: ${buttonId}, Title: ${buttonTitle}, From: ${from}`);
        
        // SECURITY: Validate button ID format to prevent injection
        if (!buttonId || typeof buttonId !== 'string') {
          console.log('⚠️ Invalid button ID format - skipping');
          return;
        }
        
        // Parse button ID to extract action, service request ID, and doctor ID
        // Format: accept_123_456 or decline_123_456
        const buttonParts = buttonId.split('_');
        if (buttonParts.length === 3) {
          const action = buttonParts[0]; // 'accept' or 'decline'
          
          // SECURITY: Validate action is expected value
          if (action !== 'accept' && action !== 'decline') {
            console.log(`⚠️ Invalid action in button ID: ${action} - skipping`);
            return;
          }
          
          const serviceRequestId = parseInt(buttonParts[1]);
          const doctorId = parseInt(buttonParts[2]);
          
          // SECURITY: Validate IDs are valid numbers
          if (isNaN(serviceRequestId) || isNaN(doctorId) || serviceRequestId <= 0 || doctorId <= 0) {
            console.log(`⚠️ Invalid service request ID (${serviceRequestId}) or doctor ID (${doctorId}) - skipping`);
            return;
          }
          
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
          
          // SECURITY: Verify doctor ID matches - critical security check
          if (doctor.id !== doctorId) {
            console.log(`❌ SECURITY VIOLATION: Doctor ID mismatch - Found: ${doctor.id}, Expected: ${doctorId}`);
            await this.sendSimpleMessage(from, "❌ Security verification failed. Please contact support immediately.");
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

          // SECURITY: Check if request is still pending
          if (serviceRequest.status !== 'pending') {
            console.log(`❌ Service request status is not pending: ${serviceRequest.status}`);
            await this.sendSimpleMessage(from, `❌ This request is no longer available (Status: ${serviceRequest.status.toUpperCase()}).`);
            return;
          }
          
          // SECURITY: Ensure request isn't already assigned to another doctor
          if (serviceRequest.doctor && serviceRequest.doctor.id !== doctorId) {
            console.log(`❌ Request already assigned to different doctor: ${serviceRequest.doctor.id}`);
            await this.sendSimpleMessage(from, "❌ This request has already been assigned to another doctor.");
            return;
          }

          // Process the action
          if (action === 'accept') {
            console.log(`✅ Processing SECURE ACCEPT for request ${serviceRequestId} by doctor ${doctorId}`);
            await this.acceptServiceRequest(serviceRequestId, doctorId);
            await this.sendConfirmationMessage(doctor.phone, 'accept', serviceRequest, serviceRequest.business);
            
            // Send business notification if business phone is available
            if (serviceRequest.business?.phone) {
              await this.sendBusinessNotification(serviceRequest.business.phone, doctor, serviceRequest);
            }
          } else if (action === 'decline') {
            console.log(`❌ Processing SECURE DECLINE for request ${serviceRequestId} by doctor ${doctorId}`);
            await this.sendConfirmationMessage(doctor.phone, 'reject', serviceRequest, serviceRequest.business);
          }
          
          return;
        } else {
          console.log(`⚠️ Invalid button ID format: ${buttonId} - expected format: action_requestId_doctorId`);
        }
        
        // REMOVED: Fallback text message processing to prevent security vulnerabilities
        // Previous code would process any button title as a text message, which was unsafe
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
   * SECURITY: Disabled automatic acceptance via text messages to prevent accidental acceptance
   */
  async processTextMessage(message) {
    try {
      const { from, text } = message;
      const messageText = text.body.toLowerCase().trim();
      
      console.log(`📱 Received text message from ${from}: "${messageText}"`);
      
      // SECURITY FIX: Disable automatic acceptance via plain text messages
      // This prevents accidental acceptance when doctors send casual messages
      // or when WhatsApp system messages contain trigger words
      
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
          console.log(`❌ No doctor found with phone: ${from}`);
          // Send helpful message
          await this.sendSimpleMessage(from, 
            "🔒 For security, please use the Accept/Decline buttons in our official messages, or visit your dashboard to respond to service requests."
          );
          return;
        }

        const doctor = doctors[0];
        console.log(`⚠️ SECURITY: Doctor ${doctor.firstName} ${doctor.lastName} sent text "${messageText}" - text-based acceptance disabled`);

        // Send security message instead of auto-accepting
        await this.sendSimpleMessage(from, 
          `🔒 Hi Dr. ${doctor.firstName}! For security reasons, please use the Accept/Decline buttons in our service request messages, or visit your dashboard at ${process.env.FRONTEND_DASHBOARD_URL}/doctor/dashboard to respond to requests.`
        );
      }
    } catch (error) {
      console.error('Error processing text message:', error);
    }
  }

  /**
   * Accept service request (extracted for reuse)
   */
  async acceptServiceRequest(serviceRequestId, doctorId) {
    try {
      console.log(`🔐 SECURITY: Processing service request acceptance - ID: ${serviceRequestId}, Doctor: ${doctorId}`);
      
      // Log the acceptance for security audit
      await SecurityLogger.logServiceRequestAcceptance('whatsapp_button', serviceRequestId, doctorId, {
        timestamp: new Date().toISOString(),
        source: 'WhatsApp interactive button'
      });
      
      // Double-check the request is still pending before accepting
      const currentRequest = await strapi.entityService.findOne('api::service-request.service-request', serviceRequestId, {
        populate: ['doctor']
      });
      
      if (!currentRequest) {
        console.log(`❌ SECURITY: Service request ${serviceRequestId} not found during acceptance`);
        throw new Error('Service request not found');
      }
      
      if (currentRequest.status !== 'pending') {
        console.log(`❌ SECURITY: Service request ${serviceRequestId} status changed to ${currentRequest.status} before acceptance`);
        throw new Error(`Request status is ${currentRequest.status}, cannot accept`);
      }
      
      if (currentRequest.doctor && currentRequest.doctor.id !== doctorId) {
        console.log(`❌ SECURITY: Service request ${serviceRequestId} already assigned to doctor ${currentRequest.doctor.id}`);
        throw new Error('Request already assigned to another doctor');
      }
    
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
      
      console.log(`✅ SECURITY: Service request ${serviceRequestId} successfully accepted by doctor ${doctorId}`);
    } catch (error) {
      console.error(`❌ SECURITY ERROR: Failed to accept service request ${serviceRequestId}:`, error.message);
      
      // Log the security error
      await SecurityLogger.logSecurityViolation('ACCEPTANCE_FAILED', {
        serviceRequestId,
        doctorId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Send WhatsApp message with detailed error logging for debugging
   */
  async sendWhatsAppMessage(payload) {
    try {
      console.log('📱 Sending WhatsApp message to:', payload.to);
      console.log('📱 Message type:', payload.type);
      console.log('📱 API URL:', this.apiUrl);
      console.log('📱 Access Token (first 20 chars):', this.accessToken?.substring(0, 20) + '...');
      console.log('📱 Full payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
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
      (`🔍 Checking verification status for: ${formattedPhone}`);
      
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
        (`✅ Phone number ${formattedPhone} is verified and can receive messages`);
        return { verified: true, phone: formattedPhone };
      } catch (error) {
        if (error.response?.data?.error?.code === 131026) {
          (`❌ Phone number ${formattedPhone} is NOT verified for your WhatsApp Business account`);
          return { verified: false, phone: formattedPhone, reason: 'Not verified' };
        } else {
          (`⚠️ Unable to determine verification status for ${formattedPhone}: ${error.message}`);
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
      
      ('📋 Verified phone numbers:', response.data);
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
      (`📱 Sending password reset token to: ${phoneNumber}`);
      
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
      (`✅ Password reset token sent successfully to: ${phoneNumber}`);
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
      (`✅ Video call link sent to doctor: ${doctor.firstName} ${doctor.lastName}`);
      (`📱 Platform URL sent: ${platformVideoUrl}`);
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
      (`✅ Video call link sent to patient: ${serviceRequest.patientFirstName} ${serviceRequest.patientLastName}`);
      (`📱 Platform URL sent: ${platformVideoUrl}`);
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
      ('🎥 Sending video call notifications for online consultation');
      
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

      ('✅ Video call notifications completed:', notifications);
      return notifications;

    } catch (error) {
      console.error('❌ Error sending video call notifications:', error);
      throw error;
    }
  }
}

module.exports = WhatsAppService;
