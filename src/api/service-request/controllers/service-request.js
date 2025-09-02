// @ts-nocheck
'use strict';

/**
 * service-request controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

// Helper function to get dynamic booking fee from system settings
const getBookingFee = async (strapi) => {
  try {
    const booking_fee_setting = await strapi.entityService.findMany('api::system-setting.system-setting', {
      filters: { key: 'booking_fee' },
      limit: 1,
    });
    
    if (booking_fee_setting && booking_fee_setting.length > 0) {
      const fee = parseFloat(booking_fee_setting[0].value);
      return isNaN(fee) ? 3.00 : fee; // Default to 3.00 if parsing fails
    }
    
    return 3.00; // Default booking fee
  } catch (error) {
    console.error('Error fetching booking fee from system settings:', error);
    return 3.00; // Default booking fee on error
  }
};

module.exports = createCoreController('api::service-request.service-request', ({ strapi }) => ({

  // Override the default create to ensure verification checks
  async create(ctx) {
    console.log('⚠️  WARNING: Default create endpoint called. Redirecting to createServiceRequest for verification.');
    // Redirect to our custom createServiceRequest which has proper verification
    return await this.createServiceRequest(ctx);
  },
  
  async find(ctx) {
    try {
      const { query } = ctx;
      
      ('Find query received:', JSON.stringify(query, null, 2));
      
      // Build the query parameters properly
      const queryParams = {
        populate: ['business', 'doctor', 'declinedByDoctors'],
        ...(query.sort && { sort: query.sort }),
        ...(query.start && { start: parseInt(query.start) }),
        ...(query.limit && { limit: parseInt(query.limit) }),
      };

      // Handle filters properly
      if (query.filters) {
        queryParams.filters = {};
        
        // Parse filters from URL query format
        Object.keys(query.filters).forEach(key => {
          if (key === 'isPaid' && query.filters[key]['$eq']) {
            queryParams.filters.isPaid = {
              $eq: query.filters[key]['$eq'] === 'true'
            };
          } else {
            queryParams.filters[key] = query.filters[key];
          }
        });
      }

      ('Processed query params:', JSON.stringify(queryParams, null, 2));
      
      // Use the default strapi find method with properly formatted query
      const result = await strapi.entityService.findMany('api::service-request.service-request', queryParams);
      
      (`Found ${result.length} service requests`);
      
      // Return the results in the standard format
      return { data: result };
    } catch (error) {
      console.error('Error in find:', error);
      console.error('Query that caused error:', JSON.stringify(ctx.query, null, 2));
      ctx.throw(500, `Error finding service requests: ${error.message}`);
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      
      const result = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: {
          business: true,
          doctor: true,
        },
      });
      
      if (!result) {
        return ctx.notFound('Service request not found');
      }
      
      return { data: result };
    } catch (error) {
      console.error('Error in findOne:', error);
      ctx.throw(500, `Error finding service request: ${error.message}`);
    }
  },

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      
      (`Updating service request ${id} with data:`, data);
      
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: data,
        populate: {
          business: true,
          doctor: true,
        },
      });
      
      if (!updatedServiceRequest) {
        return ctx.notFound('Service request not found');
      }
      
      return { data: updatedServiceRequest };
    } catch (error) {
      console.error('Error in update:', error);
      ctx.throw(500, `Error updating service request: ${error.message}`);
    }
  },

  // Find nearby doctors when a service request is created
  async findNearbyDoctors(ctx) {
    try {
      const { businessId, serviceId } = ctx.request.body;
      
      // Get business details
      const business = await strapi.entityService.findOne('api::business.business', businessId);
      
      if (!business) {
        return ctx.badRequest('Business not found');
      }

      // Get service details to check if it's an online service
      let serviceDetails = null;
      let isOnlineService = false;
      if (serviceId) {
        serviceDetails = await strapi.entityService.findOne('api::service.service', serviceId);
        isOnlineService = serviceDetails?.category === 'online';
        console.log(`🌐 Service ${serviceDetails?.name} is ${isOnlineService ? 'online' : 'location-based'} (category: ${serviceDetails?.category})`);
      }

      // Build filters for doctors
      const filters = {
        isAvailable: true,
        isVerified: true,
      };

      // Add service filter if serviceId is provided
      if (serviceId) {
        filters.services = { id: { $eq: serviceId } };
      }

      // Find all available and verified doctors with service radius included
      const allDoctors = await strapi.entityService.findMany('api::doctor.doctor', {
        filters,
        populate: ['profilePicture', 'services'],
        fields: ['id', 'name', 'firstName', 'lastName', 'phone', 'email', 'specialization', 'isAvailable', 'isVerified', 'latitude', 'longitude', 'serviceRadius'],
      });

      // For online services, return all doctors who offer the service regardless of location
      if (isOnlineService) {
        console.log(`🌍 Online service detected - returning all ${allDoctors.length} doctors who offer this service regardless of location`);
        return {
          doctors: allDoctors,
          count: allDoctors.length
        };
      }

      // For in-person services, filter doctors based on their service radius preferences
      let filteredDoctors = allDoctors;
      if (business.latitude && business.longitude) {
        const { calculateDistance } = require('../../../utils/distance');
        
        filteredDoctors = allDoctors.filter(doctor => {
          // Skip doctors without location data
          if (!doctor.latitude || !doctor.longitude) {
            console.log(`⚠️ Doctor ${doctor.firstName} ${doctor.lastName} has no location data - excluding`);
            return false;
          }

          // Get doctor's service radius (default to 12 miles if not set)
          const doctorServiceRadiusMiles = doctor.serviceRadius || 12;
          
          // If doctor accepts requests from anywhere, include them
          if (doctorServiceRadiusMiles === -1) {
            console.log(`✅ Doctor ${doctor.firstName} ${doctor.lastName} accepts requests from anywhere`);
            return true;
          }

          // Calculate distance between business and doctor
          const distanceKm = calculateDistance(
            parseFloat(business.latitude),
            parseFloat(business.longitude),
            parseFloat(doctor.latitude),
            parseFloat(doctor.longitude)
          );
          
          // Convert to miles (1 km = 0.621371 miles)
          const distanceMiles = distanceKm * 0.621371;
          
          // Check if business is within doctor's service radius
          const isWithinRadius = distanceMiles <= doctorServiceRadiusMiles;
          
          console.log(`🔍 Doctor ${doctor.firstName} ${doctor.lastName}: distance=${distanceMiles.toFixed(1)}mi, radius=${doctorServiceRadiusMiles}mi, withinRadius=${isWithinRadius}`);
          
          return isWithinRadius;
        });

        console.log(`📍 Distance filtering: ${allDoctors.length} total doctors -> ${filteredDoctors.length} within service radius`);
      } else {
        console.log('⚠️ Business has no location data - skipping distance filtering');
      }

      return {
        doctors: filteredDoctors,
        count: filteredDoctors.length
      };
    } catch (error) {
      console.error('Error finding doctors:', error);
      ctx.throw(500, `Error finding doctors: ${error.message}`);
    }
  },

  // Create a new service request and notify nearby doctors
  async createServiceRequest(ctx) {
    try {
      const { 
        businessId, 
        urgencyLevel, 
        serviceType, 
        serviceId,
        description, 
        estimatedDuration, 
        scheduledAt, 
        serviceDateTime,
        preferredDoctorId,
        doctorSelectionType,
        // Patient information for online consultations
        patientFirstName,
        patientLastName,
        patientPhone,
        patientEmail,
        // Payment information for pre-paid requests
        isPaid,
        paymentMethod,
        paymentIntentId,
        paymentStatus,
        paidAt,
        totalAmount,
        servicePrice,
        serviceCharge,
        currency,
        chargeId
      } = ctx.request.body;
      
      console.log('Creating service request with data:', {
        businessId, urgencyLevel, serviceType, serviceId, description, estimatedDuration, 
        serviceDateTime, preferredDoctorId, doctorSelectionType,
        patientFirstName, patientLastName, patientPhone, patientEmail,
        // Payment information
        isPaid, paymentMethod, paymentIntentId, paymentStatus, paidAt, totalAmount, servicePrice, serviceCharge, currency, chargeId
      });
      
      // Get business details with coordinates
      const business = await strapi.entityService.findOne('api::business.business', businessId, {
        fields: ['*'] // Include all fields including latitude, longitude, and updated name
      });
      
      if (!business) {
        return ctx.badRequest('Business not found');
      }

      // Validate serviceDateTime if provided
      let requestedServiceDateTime = null;
      if (serviceDateTime) {
        requestedServiceDateTime = new Date(serviceDateTime);
        if (isNaN(requestedServiceDateTime.getTime())) {
          return ctx.badRequest('Invalid service date/time format');
        }
        
        // Check if the requested time is in the future
        if (requestedServiceDateTime <= new Date()) {
          return ctx.badRequest('Service date/time must be in the future');
        }
      }

      // Prepare service request data
      const serviceRequestData = {
        business: businessId,
        urgencyLevel,
        serviceType,
        description,
        estimatedDuration: parseInt(estimatedDuration) || 1,
        scheduledAt,
        requestedServiceDateTime: requestedServiceDateTime,
        requestedAt: new Date(),
        status: 'pending',
        publishedAt: new Date(),
      };

      // Add payment information if provided (for pre-paid requests)
      if (isPaid) {
        // Convert Stripe payment status to our schema values
        let normalizedPaymentStatus = paymentStatus;
        if (paymentStatus === 'succeeded') {
          normalizedPaymentStatus = 'paid';
        } else if (paymentStatus === 'requires_payment_method') {
          normalizedPaymentStatus = 'pending';
        } else if (paymentStatus === 'failed') {
          normalizedPaymentStatus = 'failed';
        } else if (!['pending', 'paid', 'failed', 'refunded', 'doctor_paid'].includes(paymentStatus)) {
          // Default to 'paid' if payment was successful but status is unknown
          normalizedPaymentStatus = 'paid';
        }
        
        serviceRequestData.isPaid = isPaid;
        serviceRequestData.paymentMethod = paymentMethod;
        serviceRequestData.paymentIntentId = paymentIntentId;
        serviceRequestData.paymentStatus = normalizedPaymentStatus;
        serviceRequestData.paidAt = paidAt ? new Date(paidAt) : new Date();
        serviceRequestData.totalAmount = parseFloat(totalAmount) || 0;
        serviceRequestData.currency = currency || 'GBP';
        serviceRequestData.chargeId = chargeId;
        
        // Create payment details object for better tracking
        const paymentDetails = {
          paymentIntentId: paymentIntentId,
          paymentMethod: paymentMethod || 'card',
          paymentStatus: paymentStatus || 'succeeded',
          servicePrice: parseFloat(servicePrice) || 0,
          serviceCharge: parseFloat(serviceCharge) || 0,
          totalAmount: parseFloat(totalAmount) || 0,
          processedAt: paidAt || new Date().toISOString(),
          currency: currency || 'gbp'
        };
        
        serviceRequestData.paymentDetails = JSON.stringify(paymentDetails);
        
        ('💰 Adding payment information to service request:', {
          isPaid: serviceRequestData.isPaid,
          paymentIntentId: serviceRequestData.paymentIntentId,
          totalAmount: serviceRequestData.totalAmount,
          paymentMethod: serviceRequestData.paymentMethod
        });
      }

      // Add service ID if provided
      if (serviceId) {
        serviceRequestData.service = serviceId;
      }

      // Add patient information if provided (for online consultations)
      if (patientFirstName) {
        serviceRequestData.patientFirstName = patientFirstName;
      }
      if (patientLastName) {
        serviceRequestData.patientLastName = patientLastName;
      }
      if (patientPhone) {
        serviceRequestData.patientPhone = patientPhone;
      }
      if (patientEmail) {
        serviceRequestData.patientEmail = patientEmail;
      }

      // Add doctor if specific doctor is selected
      if (preferredDoctorId && (doctorSelectionType === 'previous' || doctorSelectionType === 'any')) {
        // Validate that the doctor exists, is available, and is verified
        const selectedDoctor = await strapi.entityService.findOne('api::doctor.doctor', preferredDoctorId, {
          fields: ['id', 'firstName', 'lastName', 'isAvailable', 'isVerified']
        });
        if (!selectedDoctor) {
          return ctx.badRequest('Selected doctor not found');
        }
        if (!selectedDoctor.isAvailable) {
          return ctx.badRequest('Selected doctor is currently unavailable');
        }
        if (!selectedDoctor.isVerified) {
          return ctx.badRequest('Selected doctor is not verified and cannot receive service requests');
        }
        
        serviceRequestData.doctor = preferredDoctorId;
      }

      // Create the service request
      ('🔍 About to save serviceRequestData:', {
        requestedServiceDateTime: serviceRequestData.requestedServiceDateTime,
        serviceDateTime: serviceRequestData.serviceDateTime,
        keys: Object.keys(serviceRequestData),
        totalAmount: serviceRequestData.totalAmount,
        isPaid: serviceRequestData.isPaid,
        paymentIntentId: serviceRequestData.paymentIntentId
      });
      
      const serviceRequest = await strapi.entityService.create('api::service-request.service-request', {
        data: serviceRequestData,
        populate: ['business', 'doctor', 'service'],
      });

      ('Service request created:', serviceRequest.id);
      ('🔍 Created serviceRequest object:', {
        id: serviceRequest.id,
        requestedServiceDateTime: serviceRequest.requestedServiceDateTime,
        serviceDateTime: serviceRequest.serviceDateTime,
        keys: Object.keys(serviceRequest)
      });

      let whatsappNotificationsSent = 0;
      let notifiedDoctorsCount = 0;

      // Handle WhatsApp notifications
      if (preferredDoctorId && (doctorSelectionType === 'previous' || doctorSelectionType === 'any')) {
        // Send notification to the selected doctor only if they are verified
        try {
          const selectedDoctor = await strapi.entityService.findOne('api::doctor.doctor', preferredDoctorId, {
            fields: ['id', 'firstName', 'lastName', 'phone', 'email', 'isAvailable', 'isVerified', 'latitude', 'longitude', 'address']
          });
          
          // Check if the doctor is verified before sending notification
          if (!selectedDoctor) {
            console.log('Selected doctor not found:', preferredDoctorId);
            // Fall back to finding all verified doctors
          } else if (!selectedDoctor.isVerified) {
            console.log('Selected doctor is not verified, skipping notification:', {
              id: selectedDoctor.id,
              name: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
              isVerified: selectedDoctor.isVerified
            });
            // Fall back to finding all verified doctors
          } else {
            // Doctor is verified, proceed with notification
            console.log('Sending WhatsApp notification to verified selected doctor:', {
              id: selectedDoctor.id,
              name: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
              phone: selectedDoctor.phone,
              isVerified: selectedDoctor.isVerified
            });
            
            const whatsappService = strapi.service('whatsapp');
            const emailService = new (require('../../../services/email.service'))();
            
            if (whatsappService) {
              // Send WhatsApp notification with timeout to avoid blocking the response
              Promise.race([
                whatsappService.sendServiceRequestNotification(selectedDoctor, serviceRequest, business),
                new Promise((_, reject) => setTimeout(() => reject(new Error('WhatsApp timeout')), 10000))
              ]).then(() => {
                whatsappNotificationsSent = 1;
                notifiedDoctorsCount = 1;
                console.log(`WhatsApp notification sent to verified selected doctor: ${selectedDoctor.firstName} ${selectedDoctor.lastName}`);
              }).catch(whatsappError => {
                console.error('Failed to send WhatsApp notification to selected doctor:', whatsappError.message || whatsappError);
              });
            } else {
              console.error('WhatsApp service not found!');
            }

            // Send email notification with timeout
            try {
              await Promise.race([
                emailService.sendServiceRequestNotification(selectedDoctor, serviceRequest, business),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 30000)) // 30 second timeout
              ]);
              console.log(`Email notification sent to verified selected doctor: ${selectedDoctor.firstName} ${selectedDoctor.lastName}`);
            } catch (emailError) {
              if (emailError.message.includes('timeout')) {
                console.warn(`⚠️ Email notification timed out for doctor: ${selectedDoctor.firstName} ${selectedDoctor.lastName} - continuing anyway`);
              } else {
                console.error('Failed to send email notification to selected doctor:', emailError.message || emailError);
              }
            }
              
            // Early return since we found and notified a verified doctor
            return ctx.send({
              data: serviceRequest,
              notifiedDoctorsCount: notifiedDoctorsCount,
              whatsappNotificationsSent: whatsappNotificationsSent,
              message: `Service request created successfully and notification sent to verified doctor: ${selectedDoctor.firstName} ${selectedDoctor.lastName}`
            });
          }
        } catch (whatsappError) {
          console.error('Failed to send WhatsApp notification to selected doctor:', whatsappError);
        }
      } else {
        // No specific doctor selected - find all verified doctors who offer the service
        try {
          console.log('🔍 Finding all available and verified doctors for service:', serviceId);
          
          const nearbyDoctorsResponse = await this.findNearbyDoctors({
            request: {
              body: {
                businessId,
                serviceId: serviceId // Pass serviceId instead of location data
              }
            }
          });

          console.log(`Found ${nearbyDoctorsResponse.count} available and verified doctors`);
          notifiedDoctorsCount = nearbyDoctorsResponse.count;

        // Send WhatsApp and Email notifications to nearby doctors
        const whatsappService = strapi.service('whatsapp');
        const emailService = new (require('../../../services/email.service'))();
        
        if (whatsappService) {
          // Send WhatsApp notifications and properly count successes
          const notificationPromises = nearbyDoctorsResponse.doctors.map(async (doctor) => {
            try {
              await Promise.race([
                whatsappService.sendServiceRequestNotification(doctor, serviceRequest, business),
                new Promise((_, reject) => setTimeout(() => reject(new Error('WhatsApp timeout')), 10000)) // 10 second timeout
              ]);
              return { success: true, doctor };
            } catch (error) {
              console.error(`Failed to send WhatsApp notification to Dr. ${doctor.firstName} ${doctor.lastName}:`, error.message || error);
              return { success: false, doctor, error };
            }
          });
          
          // Wait for all WhatsApp notifications to complete and count successes
          const results = await Promise.allSettled(notificationPromises);
          whatsappNotificationsSent = results.filter(result => 
            result.status === 'fulfilled' && result.value.success
          ).length;
        }

        // Send email notifications to all doctors with timeout
        const emailPromises = nearbyDoctorsResponse.doctors.map(async (doctor) => {
          try {
            await Promise.race([
              emailService.sendServiceRequestNotification(doctor, serviceRequest, business),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 30000)) // 30 second timeout
            ]);
            console.log(`Email notification sent to Dr. ${doctor.firstName} ${doctor.lastName}`);
          } catch (error) {
            if (error.message.includes('timeout')) {
              console.warn(`⚠️ Email notification timed out for Dr. ${doctor.firstName} ${doctor.lastName} - continuing anyway`);
            } else {
              console.error(`Failed to send email notification to Dr. ${doctor.firstName} ${doctor.lastName}:`, error.message || error);
            }
          }
        });

        // Send emails in parallel but don't wait for completion
        Promise.allSettled(emailPromises);

        console.log(`WhatsApp notifications sent to ${whatsappNotificationsSent} out of ${nearbyDoctorsResponse.count} doctors`);
        console.log(`Email notifications sent to ${nearbyDoctorsResponse.count} doctors`);
        } catch (error) {
          console.error('Error finding nearby doctors or sending notifications:', error);
        }
      }

      return {
        serviceRequest,
        notifiedDoctors: notifiedDoctorsCount,
        whatsappNotificationsSent: whatsappNotificationsSent
      };
    } catch (error) {
      console.error('❌ Error creating service request:', {
        message: error.message,
        stack: error.stack,
        details: error.details,
        requestBody: ctx.request.body
      });
      ctx.throw(500, `Error creating service request: ${error.message}`);
    }
  },

  // Accept a service request by a doctor
  async acceptServiceRequest(ctx) {
    try {
      const { id } = ctx.params;
      const { doctorId } = ctx.request.body;

      console.log(`🔐 SECURITY: Dashboard acceptance attempt - Request: ${id}, Doctor: ${doctorId}`);
      
      // Log the acceptance attempt for security audit
      try {
        const SecurityLogger = require('../../../utils/security-logger');
        await SecurityLogger.logServiceRequestAcceptance('dashboard', id, doctorId, {
          timestamp: new Date().toISOString(),
          source: 'Doctor Dashboard'
        });
      } catch (securityLogError) {
        console.warn('Security logging failed:', securityLogError.message);
      }

      // Get the service request
      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['business', 'doctor', 'service'],
      });

      if (!serviceRequest) {
        console.log(`❌ SECURITY: Service request ${id} not found`);
        return ctx.notFound('Service request not found');
      }

      if (serviceRequest.status !== 'pending') {
        console.log(`❌ SECURITY: Service request ${id} status is ${serviceRequest.status}, cannot accept`);
        return ctx.badRequest('Service request is no longer available');
      }

      // SECURITY: Check if already assigned to another doctor
      if (serviceRequest.doctor && serviceRequest.doctor.id !== parseInt(doctorId)) {
        console.log(`❌ SECURITY: Service request ${id} already assigned to doctor ${serviceRequest.doctor.id}`);
        await SecurityLogger.logSecurityViolation('ASSIGNMENT_CONFLICT', {
          serviceRequestId: id,
          requestingDoctorId: doctorId,
          assignedDoctorId: serviceRequest.doctor.id,
          source: 'dashboard'
        });
        return ctx.badRequest('Service request is already assigned to another doctor');
      }

      // Get doctor details and check verification
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        fields: ['id', 'firstName', 'lastName', 'phone', 'email', 'isAvailable', 'isVerified']
      });
      
      if (!doctor) {
        console.log(`❌ SECURITY: Doctor ${doctorId} not found`);
        return ctx.badRequest('Doctor not found');
      }

      if (!doctor.isVerified) {
        return ctx.badRequest('Only verified doctors can accept service requests');
      }

      // Check if this is an online consultation
      const isOnlineConsultation = serviceRequest.serviceType?.toLowerCase().includes('online consultation') || 
                                    serviceRequest.service?.category === 'online';

      // Remove hourlyRate calculation since it's no longer available in doctor model
      console.log('💰 Service request acceptance:', {
        doctorId: doctor.id,
        serviceRequestId: id,
        existingTotalAmount: serviceRequest.totalAmount
      });

      let updateData = {
        doctor: doctorId,
        status: 'accepted',
        acceptedAt: new Date(),
      };
      
      // Preserve existing totalAmount - don't recalculate since hourlyRate is deprecated
      // The totalAmount should be set from the service pricing system

      // Create video call for online consultations
      if (isOnlineConsultation && serviceRequest.patientFirstName && serviceRequest.patientPhone) {
        try {
          ('🎥 Creating video call for online consultation');
          
          const WherebyService = require('../../../services/whereby');
          const wherebyService = new WherebyService();
          
          const meeting = await wherebyService.createConsultationMeeting(serviceRequest);
          
          updateData.wherebyRoomUrl = meeting.roomUrl;
          updateData.wherebyMeetingId = meeting.meetingId;
          
          ('✅ Video call created successfully:', meeting.meetingId);

        } catch (videoError) {
          console.error('❌ Failed to create video call:', videoError.message);
          // Continue with acceptance even if video call creation fails
        }
      }

      // Update the service request
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: updateData,
        populate: ['business', 'doctor', 'service'],
      });

      // Send video call notifications for online consultations
      if (isOnlineConsultation && updatedServiceRequest.wherebyRoomUrl && serviceRequest.patientPhone) {
        try {
          ('📱 Sending video call notifications');
          
          const WhatsAppService = require('../../../services/whatsapp');
          const whatsappService = new WhatsAppService();
          
          // Send WhatsApp notifications
          await whatsappService.sendVideoCallNotifications(
            doctor, 
            updatedServiceRequest, 
            updatedServiceRequest.wherebyRoomUrl
          );
          
          ('✅ WhatsApp video call notifications sent successfully');

          // Send Email notifications
          try {
            const EmailService = require('../../../services/email.service');
            const emailService = new EmailService();
            
            await emailService.sendVideoCallEmails(
              doctor,
              updatedServiceRequest,
              updatedServiceRequest.wherebyRoomUrl
            );
            
            ('✅ Email video call notifications sent successfully');
            
          } catch (emailError) {
            console.error('❌ Failed to send video call emails (continuing anyway):', emailError.message);
            // Don't fail the whole process if emails fail - WhatsApp was successful
          }
          
        } catch (notificationError) {
          console.error('❌ Failed to send video call notifications:', notificationError.message);
          // Continue even if notifications fail
        }
      }

      // Cancel all related requests when this one is accepted
      await this.cancelRelatedRequests(id, strapi);

      // Note: Doctor availability is NOT changed when accepting requests
      // This allows doctors to accept multiple requests if they choose to

      // Send notifications to business or patient (only if not online consultation, as video notifications are sent above)
      if (!isOnlineConsultation) {
        try {
          const WhatsAppService = require('../../../services/whatsapp');
          const whatsappService = new WhatsAppService();
          
          // Check if this is a patient request or business request
          if (updatedServiceRequest.isPatientRequest && updatedServiceRequest.patientPhone) {
            // Send notification to patient
            await whatsappService.sendPatientNotification(updatedServiceRequest.patientPhone, doctor, updatedServiceRequest);
          } else if (updatedServiceRequest.business?.phone) {
            // Send notification to business
            await whatsappService.sendBusinessNotification(updatedServiceRequest.business.phone, doctor, updatedServiceRequest);
          }
        } catch (notificationError) {
          console.error('❌ Failed to send acceptance notifications:', notificationError.message);
          // Continue even if notifications fail
        }
      }

      return updatedServiceRequest;
    } catch (error) {
      ctx.throw(500, `Error accepting service request: ${error.message}`);
    }
  },

  // Reject a service request (WARNING: This marks the ENTIRE request as rejected)
  async rejectServiceRequest(ctx) {
    try {
      const { id } = ctx.params;
      const { doctorId, reason } = ctx.request.body;

      (`⚠️  WARNING: rejectServiceRequest called - this will mark ENTIRE request ${id} as REJECTED`);
      (`⚠️  Called by doctor ID: ${doctorId}`);
      (`⚠️  Reason: ${reason}`);
      (`⚠️  If this was called from WhatsApp decline, it's a bug!`);

      // Get the service request
      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['business', 'doctor'],
      });

      if (!serviceRequest) {
        return ctx.notFound('Service request not found');
      }

      if (serviceRequest.status !== 'pending') {
        return ctx.badRequest('Service request is no longer available');
      }

      // Get doctor details
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      (`🔴 MARKING SERVICE REQUEST ${id} AS REJECTED - this will remove it from ALL doctors`);

      // Update the service request
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: reason || 'No reason provided',
          rejectedBy: doctorId,
        },
        populate: ['business', 'doctor'],
      });

      return updatedServiceRequest;
    } catch (error) {
      ctx.throw(500, `Error rejecting service request: ${error.message}`);
    }
  },

  // Individual doctor rejection (doesn't change request status - keeps it available for other doctors)
  async doctorDeclineRequest(ctx) {
    try {
      const { id } = ctx.params;
      const { doctorId, reason } = ctx.request.body;

      (`✅ Individual doctor decline called - request ${id} will remain PENDING for other doctors`);
      (`🔍 Doctor ID: ${doctorId}, Reason: ${reason}`);

      // Get the service request
      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['business', 'doctor', 'declinedByDoctors'],
      });

      if (!serviceRequest) {
        return ctx.notFound('Service request not found');
      }

      if (serviceRequest.status !== 'pending') {
        return ctx.badRequest('Service request is no longer available');
      }

      // Get doctor details
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      // Log the individual rejection without changing the request status
      (`📝 Doctor ${doctor.firstName} ${doctor.lastName} (ID: ${doctorId}) declined service request ${id}`);
      (`✅ Service request ${id} remains PENDING for other doctors`);
      
      // Get current declined doctors list
      const currentDeclinedDoctors = serviceRequest.declinedByDoctors || [];
      const currentDeclinedDoctorIds = currentDeclinedDoctors.map(d => d.id);
      
      // Add this doctor to the declined list if not already there
      if (!currentDeclinedDoctorIds.includes(doctorId)) {
        const updatedDeclinedDoctorIds = [...currentDeclinedDoctorIds, doctorId];
        
        // Update the service request to include this doctor in the declined list
        await strapi.entityService.update('api::service-request.service-request', id, {
          data: {
            declinedByDoctors: updatedDeclinedDoctorIds,
          },
        });
        
        (`✅ Added doctor ${doctorId} to declined list for request ${id}`);
      }
      
      return {
        success: true,
        message: 'Your decline has been recorded. The request will be offered to other doctors.',
        serviceRequest: {
          id: serviceRequest.id,
          status: serviceRequest.status, // Should remain 'pending'
        },
        doctor: {
          id: doctor.id,
          name: `${doctor.firstName} ${doctor.lastName}`,
        }
      };
    } catch (error) {
      ctx.throw(500, `Error recording doctor decline: ${error.message}`);
    }
  },

  // Complete a service request
  async completeServiceRequest(ctx) {
    try {
      const { id } = ctx.params;
      const { notes } = ctx.request.body;

      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['doctor'],
      });

      if (!serviceRequest) {
        return ctx.notFound('Service request not found');
      }

      if (serviceRequest.status !== 'accepted' && serviceRequest.status !== 'in_progress') {
        return ctx.badRequest('Service request cannot be completed');
      }

      // Update the service request
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: {
          status: 'completed',
          completedAt: new Date(),
          notes,
        },
        populate: ['business', 'doctor'],
      });

      // Set doctor as available again
      if (serviceRequest.doctor) {
        await strapi.entityService.update('api::doctor.doctor', serviceRequest.doctor.id, {
          data: {
            isAvailable: true,
          },
        });
      }

      return updatedServiceRequest;
    } catch (error) {
      ctx.throw(500, `Error completing service request: ${error.message}`);
    }
  },

  // Cancel a service request
  async cancelServiceRequest(ctx) {
    try {
      const { id } = ctx.params;
      const { reason } = ctx.request.body;

      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['doctor'],
      });

      if (!serviceRequest) {
        return ctx.notFound('Service request not found');
      }

      if (serviceRequest.status === 'completed' || serviceRequest.status === 'cancelled') {
        return ctx.badRequest('Service request cannot be cancelled');
      }

      // Update the service request
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
        populate: ['business', 'doctor'],
      });

      // Set doctor as available again if they were assigned
      if (serviceRequest.doctor) {
        await strapi.entityService.update('api::doctor.doctor', serviceRequest.doctor.id, {
          data: {
            isAvailable: true,
          },
        });
      }

      return updatedServiceRequest;
    } catch (error) {
      ctx.throw(500, `Error cancelling service request: ${error.message}`);
    }
  },

  // Get service requests for a specific doctor (completed ones)
  async getDoctorRequests(ctx) {
    try {
      const { doctorId } = ctx.params;

      // First, check if the doctor is verified
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        fields: ['id', 'firstName', 'lastName', 'isVerified']
      });
      
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }
      
      if (!doctor.isVerified) {
        console.log('Unverified doctor attempted to access their requests:', {
          doctorId: doctor.id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          isVerified: doctor.isVerified
        });
        // Return empty array for unverified doctors
        return [];
      }

      const serviceRequests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: {
          doctor: doctorId,
          // Return all requests assigned to this doctor (accepted, in_progress, completed)
          status: {
            $in: ['accepted', 'in_progress', 'completed']
          }
        },
        populate: ['business', 'doctor'],
        sort: { createdAt: 'desc' },
      });

      return serviceRequests;
    } catch (error) {
      ctx.throw(500, `Error getting doctor requests: ${error.message}`);
    }
  },

  // Get service requests for a specific business
  async getBusinessRequests(ctx) {
    try {
      const { businessId } = ctx.params;

      const serviceRequests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: {
          business: businessId,
        },
        populate: {
          business: true,
          doctor: {
            fields: ['firstName', 'lastName', 'specialization', 'phone', 'email']
          }
        },
        sort: { createdAt: 'desc' },
      });

      return serviceRequests;
    } catch (error) {
      ctx.throw(500, `Error getting business requests: ${error.message}`);
    }
  },

  // Create a direct service request to a specific doctor
  async createDirectRequest(ctx) {
    try {
      const { 
        // Business portal fields
        businessId, 
        doctorId, 
        serviceId, // Add serviceId parameter
        urgencyLevel, 
        serviceType, 
        description, 
        estimatedDuration,
        serviceDateTime, // New field for requested service date/time
        // Patient portal fields
        firstName,
        lastName,
        phoneNumber,
        urgency,
        symptoms,
        notes,
        // Payment information for pre-paid requests
        isPaid,
        paymentMethod,
        paymentIntentId,
        paymentStatus,
        paidAt,
        totalAmount,
        servicePrice,
        serviceCharge,
        currency,
        chargeId
      } = ctx.request.body;
      
      console.log('Creating direct request with data:', {
        businessId, doctorId, serviceId, urgencyLevel, serviceType, description, estimatedDuration, serviceDateTime,
        firstName, lastName, phoneNumber, urgency, symptoms, notes,
        // Payment information
        isPaid, paymentMethod, paymentIntentId, paymentStatus, paidAt, totalAmount, servicePrice, serviceCharge, currency, chargeId
      });
      
      // Determine if this is from business portal or patient portal
      const isBusinessRequest = !!businessId;
      const isPatientRequest = !!(firstName && lastName && phoneNumber);
      
      if (!isBusinessRequest && !isPatientRequest) {
        return ctx.badRequest('Invalid request: must provide either business info or patient info');
      }

      // Validate required fields for business requests
      if (isBusinessRequest) {
        if (!doctorId) {
          return ctx.badRequest('Doctor ID is required for business requests');
        }
        if (!serviceId) {
          return ctx.badRequest('Service ID is required for business requests');
        }
      }
      
      // Validate business exists (for business requests)
      if (isBusinessRequest) {
        const business = await strapi.entityService.findOne('api::business.business', businessId);
        if (!business) {
          return ctx.badRequest('Business not found');
        }
      }

      // Validate doctor exists, is available, and is verified
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        fields: ['id', 'firstName', 'lastName', 'phone', 'email', 'isAvailable', 'isVerified', 'latitude', 'longitude', 'address']
      });
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      if (!doctor.isAvailable) {
        return ctx.badRequest('Doctor is currently unavailable');
      }

      if (!doctor.isVerified) {
        return ctx.badRequest('Doctor is not verified and cannot receive service requests');
      }

      // Validate serviceDateTime if provided
      let requestedServiceDateTime = null;
      if (serviceDateTime) {
        requestedServiceDateTime = new Date(serviceDateTime);
        if (isNaN(requestedServiceDateTime.getTime())) {
          return ctx.badRequest('Invalid service date/time format');
        }
        
        // Check if the requested time is in the future
        if (requestedServiceDateTime <= new Date()) {
          return ctx.badRequest('Service date/time must be in the future');
        }
      }

      // Prepare service request data based on request type
      const requestData = isBusinessRequest ? {
        business: businessId,
        doctor: doctorId,
        service: serviceId, // Add service relation
        urgencyLevel: urgencyLevel || 'medium',
        serviceType: serviceType || 'Medical Consultation',
        description,
        estimatedDuration: parseInt(estimatedDuration) || 1,
        requestedAt: new Date(),
        requestedServiceDateTime: requestedServiceDateTime,
        status: 'pending',
      } : {
        // Patient request data
        doctor: doctorId,
        service: serviceId, // Add service relation for patient requests too
        patientName: `${firstName} ${lastName}`,
        patientPhone: phoneNumber,
        urgencyLevel: urgency || 'medium',
        serviceType: serviceType || 'consultation',
        description: symptoms || 'Not specified',
        notes: notes || '',
        requestedAt: new Date(),
        requestedServiceDateTime: requestedServiceDateTime,
        status: 'pending'
      };

      // Add payment information if provided (for pre-paid requests)
      if (isPaid) {
        requestData.isPaid = isPaid;
        requestData.paymentMethod = paymentMethod;
        requestData.paymentIntentId = paymentIntentId;
        requestData.paymentStatus = paymentStatus;
        requestData.paidAt = paidAt ? new Date(paidAt) : new Date();
        requestData.totalAmount = parseFloat(totalAmount) || 0;
        requestData.currency = currency || 'GBP';
        requestData.chargeId = chargeId;
        
        // Create payment details object for better tracking
        const paymentDetails = {
          paymentIntentId: paymentIntentId,
          paymentMethod: paymentMethod || 'card',
          paymentStatus: paymentStatus || 'succeeded',
          servicePrice: parseFloat(servicePrice) || 0,
          serviceCharge: parseFloat(serviceCharge) || 0,
          totalAmount: parseFloat(totalAmount) || 0,
          processedAt: paidAt || new Date().toISOString(),
          currency: currency || 'gbp'
        };
        
        requestData.paymentDetails = JSON.stringify(paymentDetails);
        
        ('💰 Adding payment information to direct service request:', {
          isPaid: requestData.isPaid,
          paymentIntentId: requestData.paymentIntentId,
          totalAmount: requestData.totalAmount,
          paymentMethod: requestData.paymentMethod
        });
      }

      // Create the service request
      const serviceRequest = await strapi.entityService.create('api::service-request.service-request', {
        data: requestData,
        populate: ['business', 'doctor'],
      });

      ('Direct service request created:', serviceRequest.id);

      // Send WhatsApp and Email notifications to the selected doctor
      try {
        console.log('Attempting to send notifications to selected doctor...');
        const whatsappService = strapi.service('whatsapp');
        const emailService = new (require('../../../services/email.service'))();
        console.log('WhatsApp service retrieved:', !!whatsappService);
        
        // Get business data for the notification (for business requests)
        let businessForNotification = null;
        if (isBusinessRequest) {
          businessForNotification = await strapi.entityService.findOne('api::business.business', businessId);
        }
        
        // Send WhatsApp notification
        if (whatsappService) {
          console.log('Sending WhatsApp notification to doctor:', {
            id: doctor.id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            phone: doctor.phone
          });
          
          await whatsappService.sendServiceRequestNotification(doctor, serviceRequest, businessForNotification);
          console.log(`WhatsApp notification sent to selected doctor: ${doctor.firstName} ${doctor.lastName}`);
        } else {
          console.error('WhatsApp service not found!');
        }

        // Send Email notification with timeout
        try {
          await Promise.race([
            emailService.sendServiceRequestNotification(doctor, serviceRequest, businessForNotification),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 30000)) // 30 second timeout
          ]);
          console.log(`Email notification sent to selected doctor: ${doctor.firstName} ${doctor.lastName}`);
        } catch (emailError) {
          if (emailError.message.includes('timeout')) {
            console.warn(`⚠️ Email notification timed out for doctor: ${doctor.firstName} ${doctor.lastName} - continuing anyway`);
          } else {
            console.error('Failed to send email notification to selected doctor:', emailError.message);
          }
        }

      } catch (whatsappError) {
        console.error('Failed to send WhatsApp notification to selected doctor:', whatsappError.message);
        console.error('WhatsApp error details:', whatsappError);
        // Don't fail the request if WhatsApp fails
      }

      return {
        serviceRequest,
        message: 'Service request sent to doctor successfully'
      };
    } catch (error) {
      console.error('Error creating direct service request:', error);
      ctx.throw(500, `Error creating service request: ${error.message}`);
    }
  },

  // Get available service requests for a specific doctor (unassigned or assigned to them)
  async getAvailableRequests(ctx) {
    try {
      const { doctorId } = ctx.params;
      
      console.log('Getting available requests for doctor:', doctorId);
      
      // First, check if the doctor is verified
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        fields: ['id', 'firstName', 'lastName', 'isVerified']
      });
      
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }
      
      if (!doctor.isVerified) {
        console.log('Unverified doctor attempted to access requests:', {
          doctorId: doctor.id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          isVerified: doctor.isVerified
        });
        // Return empty array for unverified doctors
        return [];
      }
      
      // First, get the doctor's services to filter requests appropriately
      const doctorWithServices = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        populate: ['services'],
        fields: ['id', 'firstName', 'lastName']
      });
      
      const doctorServiceIds = doctorWithServices.services?.map(service => service.id) || [];
      console.log(`Doctor ${doctorWithServices.firstName} ${doctorWithServices.lastName} offers services:`, doctorServiceIds);

      // Get all pending or accepted requests that are either:
      // 1. Unassigned (no doctor) AND the doctor offers the requested service AND hasn't declined it
      // 2. Specifically assigned to this doctor (both pending and accepted)
      const requests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: {
          $and: [
            {
              status: { $ne: 'cancelled' } // Exclude cancelled requests
            },
            {
              $or: [
                { 
                  status: 'pending',
                  $or: [
                    {
                      $and: [
                        { doctor: null }, // Unassigned requests
                        { 
                          $or: [
                            { service: null }, // Requests without specific service (legacy)
                            { service: { id: { $in: doctorServiceIds } } } // Requests for services this doctor offers
                          ]
                        }
                      ]
                    },
                    { doctor: doctorId } // Pending requests specifically for this doctor
                  ]
                },
                {
                  status: 'accepted',
                  doctor: doctorId // Accepted requests by this doctor
                }
              ]
            }
          ]
        },
        populate: {
          business: { 
            fields: ['businessName', 'contactPersonName', 'phone', 'address', 'city', 'state', 'zipCode'] 
          },
          doctor: true,
          service: true, // Include service information for better filtering
          declinedByDoctors: true // Include declined doctors info for filtering
        },
        sort: 'requestedAt:desc',
      });

      // Filter out requests that have been declined by this doctor (client-side filtering for complex logic)
      const filteredRequests = requests.filter(request => {
        // Check if this doctor has declined this request
        const hasDeclined = request.declinedByDoctors?.some(doctor => doctor.id === parseInt(doctorId));
        return !hasDeclined;
      });

      console.log(`Found ${requests.length} available requests for verified doctor ${doctorId}`);
      console.log(`Requests breakdown:`, {
        unassigned: requests.filter(r => !r.doctor).length,
        assigned: requests.filter(r => r.doctor?.id === parseInt(doctorId)).length,
        withService: requests.filter(r => r.service).length,
        withoutService: requests.filter(r => !r.service).length
      });
      
      return requests;
    } catch (error) {
      console.error('Error fetching available requests:', error);
      ctx.throw(500, `Error fetching available requests: ${error.message}`);
    }
  },

  async getOverallStats(ctx) {
    try {
      const totalRequests = await strapi.entityService.count('api::service-request.service-request');
      const pendingRequests = await strapi.entityService.count('api::service-request.service-request', {
        filters: { status: 'pending' }
      });
      const completedRequests = await strapi.entityService.count('api::service-request.service-request', {
        filters: { status: 'completed' }
      });
      const acceptedRequests = await strapi.entityService.count('api::service-request.service-request', {
        filters: { status: 'accepted' }
      });

      return {
        totalRequests,
        pendingRequests,
        completedRequests,
        acceptedRequests
      };
    } catch (error) {
      ctx.throw(500, `Error getting service request stats: ${error.message}`);
    }
  },

  // Process payment for a service request
  async processPayment(ctx) {
    try {
      const { id } = ctx.params;
      const { paymentMethod, paymentDetails, paymentIntentId, chargeId, receiptUrl, currency = 'gbp' } = ctx.request.body;

      (`Processing payment for service request ${id} with method ${paymentMethod}`);
      (`Payment intent ID: ${paymentIntentId}`);

      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['doctor', 'business'],
      });

      if (!serviceRequest) {
        (`Service request ${id} not found`);
        return ctx.notFound('Service request not found');
      }

      (`Service request ${id} status: ${serviceRequest.status}`);

      if (serviceRequest.status !== 'completed') {
        (`Cannot process payment for request ${id} with status ${serviceRequest.status}`);
        return ctx.badRequest('Can only process payment for completed service requests');
      }

      if (serviceRequest.isPaid) {
        (`Service request ${id} has already been paid`);
        return ctx.badRequest('Service request has already been paid');
      }

      // Calculate payment amount - use existing totalAmount if available, otherwise use service pricing
      const doctor = serviceRequest.doctor;
      const business = serviceRequest.business;
      
      // Use existing totalAmount from service request (set during creation based on service pricing)
      const amount = serviceRequest.totalAmount || 0;

      console.log(`Payment amount for request ${id}: ${amount} (from existing totalAmount)`);

      // Create comprehensive payment details object
      const completePaymentDetails = {
        ...paymentDetails,
        paymentIntentId,
        chargeId,
        receiptUrl,
        currency,
        amount,
        processedAt: new Date().toISOString(),
        businessName: business?.name || business?.companyName,
        doctorName: doctor?.firstName && doctor?.lastName ? `${doctor.firstName} ${doctor.lastName}` : doctor?.name,
        doctorEmail: doctor?.email,
        businessEmail: business?.email
      };

      // Update the service request with comprehensive payment information
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentMethod,
          paymentDetails: JSON.stringify(completePaymentDetails),
          totalAmount: amount,
          paymentIntentId: paymentIntentId, // Store Stripe payment intent ID separately for easy querying
          chargeId: chargeId, // Store Stripe charge ID
          currency: currency.toUpperCase(),
          // Maintain the 'completed' status
        },
        populate: ['business', 'doctor'],
      });

      (`Payment processed successfully for request ${id} with payment intent ${paymentIntentId}`);
      return updatedServiceRequest;
    } catch (error) {
      console.error(`Error processing payment for request ${id}:`, error);
      ctx.throw(500, `Error processing payment: ${error.message}`);
    }
  },

  // WhatsApp Integration Methods
  async whatsappAcceptRequest(ctx) {
    try {
      const { token } = ctx.params;
      const { confirm } = ctx.query;
      const WhatsAppService = require('../../../services/whatsapp');
      const whatsappService = new WhatsAppService();

      // Verify and decode the token
      const { serviceRequestId, doctorId } = whatsappService.verifyAcceptanceToken(token);

      // Get the service request
      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', serviceRequestId, {
        populate: ['business', 'doctor'],
      });

      // If no confirmation parameter, this is likely WhatsApp's link preview crawling
      // Show a simple redirect page instead of accepting the request
      if (!confirm) {
        const redirectHtml = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Accept Service Request</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="refresh" content="0;url=?confirm=yes">
              <style>
                  body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
                  .container { max-width: 400px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; }
                  .loading { font-size: 18px; color: #666; }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="loading">Processing your request...</div>
                  <p>If you are not redirected automatically, <a href="?confirm=yes">click here</a>.</p>
              </div>
          </body>
          </html>
        `;
        
        ctx.type = 'text/html';
        return ctx.send(redirectHtml);
      }

      if (!serviceRequest) {
        // Generate a friendly HTML page for missing/expired service request
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Link Expired</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
              .icon { font-size: 60px; margin-bottom: 20px; }
              h1 { color: #e74c3c; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
              .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">⏰</div>
              <h1>Link Expired</h1>
              <p>This service request link has expired or is no longer valid.</p>
              <p>If you're looking for new service requests, please check your dashboard.</p>
              <a href="${process.env.BASE_URLL}/doctor/dashboard" class="btn">Go to Dashboard</a>
            </div>
          </body>
          </html>
        `;
        ctx.type = 'text/html';
        return html;
      }

      if (serviceRequest.status !== 'pending') {
        // Generate a response page for already accepted/expired request
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Request No Longer Available</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
              .icon { font-size: 60px; margin-bottom: 20px; }
              h1 { color: #e74c3c; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
              .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">⚠️</div>
              <h1>Request No Longer Available</h1>
              <p>This service request has already been accepted by another doctor or has expired.</p>
              <p>Thank you for your quick response!</p>
              <a href="${process.env.BASE_URLL}/doctor/dashboard" class="btn">Go to Dashboard</a>
            </div>
          </body>
          </html>
        `;
        ctx.type = 'text/html';
        return html;
      }

      // Get doctor details
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      // Check if this is an online consultation
      const isOnlineConsultation = serviceRequest.serviceType?.toLowerCase().includes('online consultation') || 
                                    serviceRequest.service?.category === 'online';

      let updateData = {
        doctor: doctorId,
        status: 'accepted',
        acceptedAt: new Date(),
        // Removed totalAmount calculation since hourlyRate is no longer available
      };

      // Only preserve existing totalAmount for paid requests
      if (serviceRequest.totalAmount && serviceRequest.totalAmount > 0) {
        delete updateData.totalAmount; // Don't overwrite existing amount
      }

      // Create video call for online consultations
      if (isOnlineConsultation && serviceRequest.patientFirstName && serviceRequest.patientPhone) {
        try {
          ('🎥 Creating video call for online consultation (WhatsApp acceptance)');
          
          const WherebyService = require('../../../services/whereby');
          const wherebyService = new WherebyService();
          
          const meeting = await wherebyService.createConsultationMeeting(serviceRequest);
          
          updateData.wherebyRoomUrl = meeting.roomUrl;
          updateData.wherebyMeetingId = meeting.meetingId;
          
          ('✅ Video call created successfully (WhatsApp):', meeting.meetingId);

        } catch (videoError) {
          console.error('❌ Failed to create video call (WhatsApp):', videoError.message);
          // Continue with acceptance even if video call creation fails
        }
      }

      // Accept the service request (same logic as dashboard acceptance)
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', serviceRequestId, {
        data: updateData,
        populate: ['business', 'doctor', 'service'],
      });

      // Send video call notifications for online consultations
      if (isOnlineConsultation && updatedServiceRequest.wherebyRoomUrl && serviceRequest.patientPhone) {
        try {
          ('📱 Sending video call notifications (WhatsApp acceptance)');
          
          const WhatsAppService = require('../../../services/whatsapp');
          const whatsappServiceForVideo = new WhatsAppService();
          
          // Send WhatsApp notifications
          await whatsappServiceForVideo.sendVideoCallNotifications(
            doctor, 
            updatedServiceRequest, 
            updatedServiceRequest.wherebyRoomUrl
          );
          
          ('✅ WhatsApp video call notifications sent successfully (WhatsApp acceptance)');

          // Send Email notifications
          try {
            const EmailService = require('../../../services/email.service');
            const emailService = new EmailService();
            
            await emailService.sendVideoCallEmails(
              doctor,
              updatedServiceRequest,
              updatedServiceRequest.wherebyRoomUrl
            );
            
            ('✅ Email video call notifications sent successfully (WhatsApp acceptance)');
            
          } catch (emailError) {
            console.error('❌ Failed to send video call emails (WhatsApp acceptance, continuing anyway):', emailError.message);
            // Don't fail the whole process if emails fail - WhatsApp was successful
          }
          
        } catch (notificationError) {
          console.error('❌ Failed to send video call notifications (WhatsApp):', notificationError.message);
          // Continue even if notifications fail
        }
      }

      // Cancel all related requests when this one is accepted
      await this.cancelRelatedRequests(serviceRequestId, strapi);

      // Note: Doctor availability is NOT changed when accepting requests
      // This allows doctors to accept multiple requests if they choose to

      // Send confirmation messages (only if not online consultation, as video notifications are sent above)
      if (!isOnlineConsultation) {
        await whatsappService.sendConfirmationMessage(doctor.phone, 'accept', serviceRequest, serviceRequest.business);
        
        // Check if this is a patient request or business request
        if (serviceRequest.isPatientRequest && serviceRequest.patientPhone) {
          // Send notification to patient
          await whatsappService.sendPatientNotification(serviceRequest.patientPhone, doctor, serviceRequest);
        } else {
          // Send notification to business
          await whatsappService.sendBusinessNotification(serviceRequest.business.phone, doctor, serviceRequest);
        }
      }

      // Generate success page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Request Accepted Successfully</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .icon { font-size: 60px; margin-bottom: 20px; }
            h1 { color: #27ae60; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; margin-bottom: 15px; }
            .detail { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-left; }
            .detail strong { color: #333; }
            .btn { background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Request Accepted Successfully!</h1>
            <p>You have successfully accepted the service request.</p>
            
            <div class="detail">
              <strong>Business:</strong> ${serviceRequest.isPatientRequest ? 'Patient Requests' : serviceRequest.business.name}<br>
              <strong>Service:</strong> ${serviceRequest.serviceType}<br>
              <strong>Duration:</strong> ${serviceRequest.estimatedDuration} minute(s)<br>
              <strong>Contact:</strong> ${serviceRequest.isPatientRequest ? serviceRequest.patientPhone : serviceRequest.business.phone}<br>
              <strong>Address:</strong> ${serviceRequest.isPatientRequest ? (serviceRequest.patientAddressLine1 || serviceRequest.patientAddress || 'Patient Address') : serviceRequest.business.address}
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <p>1. ${serviceRequest.isPatientRequest ? 'Contact the patient directly to coordinate your service' : 'Contact the business directly to coordinate your visit'}</p>
            <p>2. Update your status through your dashboard</p>
            <p>3. Complete the service when finished</p>
            
            <a href="${process.env.BASE_URLL}/doctor/dashboard" class="btn">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `;

      ctx.type = 'text/html';
      return html;
    } catch (error) {
      console.error('Error in whatsappAcceptRequest:', error);
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .icon { font-size: 60px; margin-bottom: 20px; }
            h1 { color: #e74c3c; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Error</h1>
            <p>There was an error processing your request. The link may be invalid or expired.</p>
            <a href="${process.env.BASE_URLL}/doctor/dashboard" class="btn">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `;
      
      ctx.type = 'text/html';
      return html;
    }
  },

  async whatsappRejectRequest(ctx) {
    try {
      const { token } = ctx.params;
      (`🔍 WhatsApp reject called with token: ${token}`);
      
      const WhatsAppService = require('../../../services/whatsapp');
      const whatsappService = new WhatsAppService();

      // Verify and decode the token
      const { serviceRequestId, doctorId } = whatsappService.verifyAcceptanceToken(token);
      
      (`🔍 Token verified - Service Request ID: ${serviceRequestId}, Doctor ID: ${doctorId}`);

      // Get the service request
      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', serviceRequestId, {
        populate: ['business', 'doctor'],
      });

      if (!serviceRequest) {
        (`❌ Service request ${serviceRequestId} not found or expired`);
        // Generate a friendly HTML page for missing/expired service request
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Link Expired</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
              .icon { font-size: 60px; margin-bottom: 20px; }
              h1 { color: #e74c3c; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
              .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">⏰</div>
              <h1>Link Expired</h1>
              <p>This service request link has expired or is no longer valid.</p>
              <p>If you're looking for new service requests, please check your dashboard.</p>
              <a href="${process.env.BASE_URLL}/doctor/dashboard" class="btn">Go to Dashboard</a>
            </div>
          </body>
          </html>
        `;
        ctx.type = 'text/html';
        return html;
      }

      if (serviceRequest.status !== 'pending') {
        (`❌ Service request ${serviceRequestId} is no longer available. Current status: ${serviceRequest.status}`);
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Request No Longer Available</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
              .icon { font-size: 60px; margin-bottom: 20px; }
              h1 { color: #e74c3c; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
              .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">⚠️</div>
              <h1>Request No Longer Available</h1>
              <p>This service request has already been handled or has expired.</p>
              <a href="${process.env.BASE_URLL}/doctor/dashboard" class="btn">Go to Dashboard</a>
            </div>
          </body>
          </html>
        `;
        ctx.type = 'text/html';
        return html;
      }

      // Get doctor details
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      // Track this doctor's rejection without changing the service request status
      // This helps avoid sending the same request to this doctor again
      (`🔍 Doctor ${doctor.firstName} ${doctor.lastName} (ID: ${doctorId}) declined service request ${serviceRequestId}`);
      (`✅ Service request remains PENDING for other doctors to accept`);
      
      // Add this doctor to the declined list to hide it from their dashboard
      try {
        const currentDeclinedDoctors = serviceRequest.declinedByDoctors || [];
        const currentDeclinedDoctorIds = currentDeclinedDoctors.map(d => d.id);
        
        // Add this doctor to the declined list if not already there
        if (!currentDeclinedDoctorIds.includes(doctorId)) {
          const updatedDeclinedDoctorIds = [...currentDeclinedDoctorIds, doctorId];
          
          // Update the service request to include this doctor in the declined list
          await strapi.entityService.update('api::service-request.service-request', serviceRequestId, {
            data: {
              declinedByDoctors: updatedDeclinedDoctorIds,
            },
          });
          
          (`✅ Added doctor ${doctorId} to declined list for request ${serviceRequestId} (WhatsApp)`);
        }
      } catch (trackingError) {
        console.error('Error tracking WhatsApp individual rejection:', trackingError);
        // Don't fail the main flow if tracking fails
      }

      // Send confirmation message
      await whatsappService.sendConfirmationMessage(doctor.phone, 'reject', serviceRequest, serviceRequest.business);

      // Generate success page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Request Declined</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .icon { font-size: 60px; margin-bottom: 20px; }
            h1 { color: #f39c12; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">👋</div>
            <h1>Request Declined</h1>
            <p>You have declined this service request.</p>
            <p>The request will be offered to other available doctors.</p>
            <p>Thank you for your quick response!</p>
            <a href="${process.env.BASE_URLL}/doctor/dashboard" class="btn">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `;

      ctx.type = 'text/html';
      return html;
    } catch (error) {
      console.error('Error in whatsappRejectRequest:', error);
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .icon { font-size: 60px; margin-bottom: 20px; }
            h1 { color: #e74c3c; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Error</h1>
            <p>There was an error processing your request. The link may be invalid or expired.</p>
            <a href="${process.env.BASE_URLL}/doctor/dashboard" class="btn">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `;
      
      ctx.type = 'text/html';
      return html;
    }
  },

  async handleWhatsappWebhook(ctx) {
    try {
      const { query, body } = ctx.request;
      
      // Handle webhook verification (GET request)
      if (ctx.method === 'GET') {
        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];
        
        const WhatsAppService = require('../../../services/whatsapp');
        const whatsappService = new WhatsAppService();
        
        try {
          const verificationResult = whatsappService.verifyWebhook(mode, token, challenge);
          ctx.body = verificationResult;
          return;
        } catch (error) {
          console.error('Webhook verification failed:', error);
          return ctx.forbidden('Webhook verification failed');
        }
      }
      
      // Handle incoming messages (POST request)
      if (ctx.method === 'POST') {
        const WhatsAppService = require('../../../services/whatsapp');
        const whatsappService = new WhatsAppService();
        
        await whatsappService.handleIncomingMessage(body);
        
        ctx.body = { status: 'ok' };
        return;
      }
      
      return ctx.badRequest('Invalid request method');
    } catch (error) {
      console.error('Error in handleWhatsappWebhook:', error);
      return ctx.badRequest(`Webhook error: ${error.message}`);
    }
  },

  // Test endpoint for WhatsApp notifications
  async testWhatsappNotification(ctx) {
    try {
      const { doctorId, testMessage } = ctx.request.body;

      if (!doctorId) {
        return ctx.badRequest('Doctor ID is required');
      }

      // Get doctor details
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        fields: ['id', 'name', 'firstName', 'lastName', 'phone', 'email', 'specialization', 'latitude', 'longitude', 'address'],
      });
      
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      const whatsappService = strapi.service('whatsapp');

      // Create a mock service request for testing
      const mockServiceRequest = {
        id: 'test-' + Date.now(),
        serviceType: 'consultation',
        urgencyLevel: 'medium',
        estimatedDuration: 1,
        description: testMessage || 'This is a test notification from ThanksDoc system'
      };

      const mockBusiness = {
        name: 'Test Clinic',
        address: '123 Test Street, Test City',
        phone: '+1234567890',
        latitude: 0.34,
        longitude: 32.58
      };

      // Send test notification
      ('🔍 About to send test notification...');
      ('Doctor phone:', doctor.phone);
      ('Mock service request:', mockServiceRequest);
      ('Mock business:', mockBusiness);
      
      const result = await whatsappService.sendServiceRequestNotification(
        doctor, 
        mockServiceRequest, 
        mockBusiness
      );

      const doctorDisplayName = whatsappService.getDoctorDisplayName(doctor);

      return {
        success: true,
        message: 'Test WhatsApp notification sent successfully',
        doctor: {
          id: doctor.id,
          name: doctorDisplayName,
          phone: doctor.phone
        },
        messageId: result.messages?.[0]?.id || 'N/A'
      };
    } catch (error) {
      console.error('Error in testWhatsappNotification:', error);
      return ctx.badRequest(`Error sending test notification: ${error.message}`);
    }
  },

  // Test endpoint for WhatsApp interactive messages
  async testInteractiveWhatsapp(ctx) {
    try {
      const { doctorId, testMessage } = ctx.request.body;

      if (!doctorId) {
        return ctx.badRequest('Doctor ID is required');
      }

      // Get doctor details
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        fields: ['id', 'name', 'firstName', 'lastName', 'phone', 'email', 'specialization', 'latitude', 'longitude', 'address'],
      });
      
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      const WhatsAppService = require('../../../services/whatsapp');
      const whatsappService = new WhatsAppService();

      // Create a mock service request for testing
      const mockServiceRequest = {
        id: 12345, // Use a recognizable test ID
        serviceType: 'Online Consultation - Test',
        urgencyLevel: 'medium',
        estimatedDuration: 20,
        description: testMessage || 'This is a test interactive message from ThanksDoc system with clickable buttons'
      };

      const mockBusiness = {
        name: 'Test Medical Center',
        address: '123 Test Medical Street, Test City',
        phone: '+1234567890',
        latitude: 0.34,
        longitude: 32.58
      };

      // Force interactive message by temporarily setting environment variable
      const originalValue = process.env.WHATSAPP_USE_INTERACTIVE_BUTTONS;
      process.env.WHATSAPP_USE_INTERACTIVE_BUTTONS = 'true';

      try {
        // Send interactive message
        const result = await whatsappService.sendServiceRequestNotification(
          doctor, 
          mockServiceRequest, 
          mockBusiness
        );

        const doctorDisplayName = whatsappService.getDoctorDisplayName(doctor);

        return {
          success: true,
          message: 'Test WhatsApp interactive message sent successfully',
          doctor: {
            id: doctor.id,
            name: doctorDisplayName,
            phone: doctor.phone
          },
          messageId: result.messages?.[0]?.id || 'N/A',
          note: 'Check WhatsApp for interactive Accept/Decline buttons'
        };
      } finally {
        // Restore original value
        process.env.WHATSAPP_USE_INTERACTIVE_BUTTONS = originalValue;
      }
    } catch (error) {
      console.error('Error in testInteractiveWhatsapp:', error);
      return ctx.badRequest(`Error sending test interactive message: ${error.message}`);
    }
  },

  // Admin endpoint to format doctor phone numbers
  async formatDoctorPhoneNumbers(ctx) {
    try {
      const WhatsAppUtils = require('../../../utils/whatsapp-utils');
      const result = await WhatsAppUtils.formatDoctorPhoneNumbers(strapi);
      
      return {
        success: true,
        message: `Phone number formatting completed`,
        summary: result
      };
    } catch (error) {
      console.error('Error in formatDoctorPhoneNumbers:', error);
      return ctx.badRequest(`Error formatting phone numbers: ${error.message}`);
    }
  },

  // Test endpoint to diagnose WhatsApp phone number verification issues
  async diagnoseWhatsappSetup(ctx) {
    try {
      const { phoneNumber } = ctx.request.body;

      if (!phoneNumber) {
        return ctx.badRequest('Phone number is required for diagnosis');
      }

      const WhatsAppService = require('../../../services/whatsapp');
      const whatsappService = new WhatsAppService();

      ('🔧 Starting WhatsApp setup diagnosis...');

      const results = {
        phoneNumber: phoneNumber,
        timestamp: new Date().toISOString(),
        diagnosis: {},
        recommendations: []
      };

      // 1. Check phone number formatting
      try {
        const formattedPhone = whatsappService.formatPhoneNumber(phoneNumber);
        results.diagnosis.phoneFormatting = {
          success: true,
          original: phoneNumber,
          formatted: formattedPhone,
          apiFormat: formattedPhone.replace('+', '')
        };
        ('✅ Phone number formatting: OK');
      } catch (error) {
        results.diagnosis.phoneFormatting = {
          success: false,
          error: error.message
        };
        results.recommendations.push('Fix phone number format - ensure it includes country code');
        ('❌ Phone number formatting: FAILED');
      }

      // 2. Check WhatsApp Business API credentials
      results.diagnosis.credentials = {
        hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
        hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        hasBusinessAccountId: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
      };

      if (!results.diagnosis.credentials.hasAccessToken) {
        results.recommendations.push('Set WHATSAPP_ACCESS_TOKEN environment variable');
      }

      // 3. Get verified phone numbers
      try {
        const verifiedNumbers = await whatsappService.getVerifiedPhoneNumbers();
        results.diagnosis.verifiedNumbers = verifiedNumbers;
        ('✅ Retrieved verified numbers list');
      } catch (error) {
        results.diagnosis.verifiedNumbers = { error: error.message };
        results.recommendations.push('Check WhatsApp Business account permissions');
        ('❌ Failed to get verified numbers');
      }

      // 4. Test phone verification status
      try {
        const verificationStatus = await whatsappService.checkPhoneVerificationStatus(phoneNumber);
        results.diagnosis.phoneVerification = verificationStatus;
        
        // Additional check: Compare against known working number
        const knownWorkingNumber = '256784528444'; // Your verified number
        const isKnownWorking = phoneNumber.replace(/[\s+\-]/g, '').includes(knownWorkingNumber);
        
        results.diagnosis.phoneVerification.isKnownWorkingNumber = isKnownWorking;
        results.diagnosis.phoneVerification.sandboxMode = {
          detected: !isKnownWorking && verificationStatus.verified,
          explanation: 'API returns success but messages may not be delivered in sandbox mode'
        };
        
        if (!verificationStatus.verified) {
          results.recommendations.push('Add this phone number to your verified list in Meta Business Manager');
          results.recommendations.push('Go to https://business.facebook.com -> WhatsApp Business -> Phone Numbers');
        } else if (!isKnownWorking) {
          results.recommendations.push('⚠️  SANDBOX MODE DETECTED: Messages may show as sent but not be delivered');
          results.recommendations.push('Add recipient phone numbers to your verified list in Meta Business Manager');
          results.recommendations.push('Go to https://business.facebook.com -> WhatsApp Business -> Phone Numbers -> Add phone numbers');
          results.recommendations.push('Or upgrade your WhatsApp Business app to production mode');
        }
      } catch (error) {
        results.diagnosis.phoneVerification = { error: error.message };
      }

      // 5. Generate recommendations
      if (results.recommendations.length === 0) {
        results.recommendations.push('Phone number appears to be properly configured');
      }

      // Add general recommendations
      results.recommendations.push('Ensure your WhatsApp Business account is fully verified');
      results.recommendations.push('Check that your app is approved for production (not sandbox mode)');

      ('🔧 Diagnosis complete:', JSON.stringify(results, null, 2));

      return {
        success: true,
        diagnosis: results,
        troubleshootingSteps: [
          '1. Verify your WhatsApp Business account is approved for production',
          '2. Add recipient phone numbers to your verified list',
          '3. Check Meta Business Manager settings',
          '4. Ensure your access token has proper permissions',
          '5. Contact Meta support if issues persist'
        ]
      };
    } catch (error) {
      console.error('Error in diagnoseWhatsappSetup:', error);
      return ctx.badRequest(`Diagnosis error: ${error.message}`);
    }
  },

  // Helper method to cancel all related requests when one is accepted
  async cancelRelatedRequests(acceptedRequestId, strapi) {
    try {
      (`Cancelling related requests for accepted request ID: ${acceptedRequestId}`);
      
      // Get the accepted request to find its originalRequestId
      const acceptedRequest = await strapi.entityService.findOne('api::service-request.service-request', acceptedRequestId);
      
      if (!acceptedRequest) {
        console.error('Accepted request not found');
        return;
      }

      // Find all related requests that need to be cancelled
      // This includes:
      // 1. The original request (if this accepted request is a broadcasted one)
      // 2. All other broadcasted requests from the same original request
      const relatedRequestsFilters = [];

      // If this request has an originalRequestId, it's a broadcasted request
      if (acceptedRequest.originalRequestId) {
        // Cancel the original request
        relatedRequestsFilters.push({
          id: acceptedRequest.originalRequestId,
          status: 'pending'
        });
        
        // Cancel other broadcasted requests from the same original
        relatedRequestsFilters.push({
          originalRequestId: acceptedRequest.originalRequestId,
          status: 'pending',
          id: { $ne: acceptedRequestId }
        });
      } else {
        // This is an original request that was accepted, cancel all its broadcasted requests
        relatedRequestsFilters.push({
          originalRequestId: acceptedRequestId,
          status: 'pending'
        });
      }

      // Cancel all related requests
      for (const filter of relatedRequestsFilters) {
        const relatedRequests = await strapi.entityService.findMany('api::service-request.service-request', {
          filters: filter,
          populate: ['doctor']
        });

        for (const relatedRequest of relatedRequests) {
          (`Cancelling related request ID: ${relatedRequest.id} for doctor: ${relatedRequest.doctor?.id}`);
          
          await strapi.entityService.update('api::service-request.service-request', relatedRequest.id, {
            data: {
              status: 'cancelled',
              cancelReason: 'Request was accepted by another doctor'
            }
          });
        }
        
        (`Cancelled ${relatedRequests.length} related requests with filter:`, filter);
      }
      
    } catch (error) {
      console.error('Error cancelling related requests:', error);
    }
  },

  // Deprecated endpoint - automatic broadcasting is now handled by cron job
  async getFallbackStatus(ctx) {
    try {
      const { id } = ctx.params;
      
      // Return a simple response indicating that this functionality 
      // is now handled automatically by the cron job
      return {
        requestId: id,
        message: 'Automatic broadcasting is handled by cron job',
        broadcastingEnabled: true,
        cronJobActive: true
      };
    } catch (error) {
      console.error('Error in getFallbackStatus:', error);
      ctx.throw(500, `Error checking fallback status: ${error.message}`);
    }
  },

  // Get transaction history for admin dashboard
  async getTransactionHistory(ctx) {
    try {
      const { query } = ctx.request;
      const { 
        doctorId, 
        startDate, 
        endDate, 
        limit = 100, 
        offset = 0,
        search 
      } = query;

      ('Getting transaction history with params:', query);

      // Build filter for paid service requests
      const filters = {
        isPaid: {
          $eq: true
        }
      };

      // Add date range filter
      if (startDate && endDate) {
        filters.paidAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (startDate) {
        filters.paidAt = {
          $gte: new Date(startDate),
        };
      } else if (endDate) {
        filters.paidAt = {
          $lte: new Date(endDate),
        };
      }

      // Add doctor filter
      if (doctorId) {
        filters.doctor = {
          id: {
            $eq: parseInt(doctorId)
          }
        };
      }

      ('Filters being used:', JSON.stringify(filters, null, 2));

      // Get paid service requests with populated relations
      const transactions = await strapi.entityService.findMany('api::service-request.service-request', {
        filters,
        populate: ['doctor', 'business'],
        sort: { paidAt: 'desc' },
        start: parseInt(offset),
        limit: parseInt(limit),
      });

      (`Found ${transactions.length} transactions`);

      // Calculate summary statistics
      const allPaidRequests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: { 
          isPaid: {
            $eq: true
          }
        },
        populate: ['doctor'],
      });

      const totalTransactions = allPaidRequests.length;
      const totalRevenue = allPaidRequests.reduce((sum, req) => sum + (req.totalAmount || 0), 0);
      const serviceCharge = await getBookingFee(strapi); // Dynamic service charge
      const totalServiceCharges = totalTransactions * serviceCharge;
      const totalDoctorEarnings = Math.max(0, totalRevenue - totalServiceCharges);

      // Format transactions for frontend
      const formattedTransactions = transactions.map(transaction => {
        const totalAmount = transaction.totalAmount || 0;
        const doctorFee = Math.max(0, totalAmount - serviceCharge);
        
        return {
          id: transaction.id,
          paymentId: transaction.paymentIntentId || transaction.id,
          serviceType: transaction.serviceType,
          doctorId: transaction.doctor?.id,
          doctorName: transaction.doctor ? 
            `${transaction.doctor.firstName || ''} ${transaction.doctor.lastName || ''}`.trim() || 
            transaction.doctor.name || 'Unknown Doctor' : 'Unknown Doctor',
          businessName: transaction.business?.name || transaction.business?.companyName || 'Unknown Business',
          totalAmount: totalAmount,
          doctorFee: doctorFee,
          serviceCharge: serviceCharge,
          currency: transaction.currency || 'GBP',
          paymentMethod: transaction.paymentMethod || 'card',
          status: transaction.isPaid ? 'paid' : 'pending',
          date: transaction.paidAt,
          paymentIntentId: transaction.paymentIntentId,
          chargeId: transaction.chargeId,
        };
      });

      // Apply search filter if provided
      let filteredTransactions = formattedTransactions;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredTransactions = formattedTransactions.filter(transaction => 
          transaction.doctorName.toLowerCase().includes(searchLower) ||
          transaction.serviceType.toLowerCase().includes(searchLower) ||
          transaction.businessName.toLowerCase().includes(searchLower) ||
          transaction.paymentId.toLowerCase().includes(searchLower)
        );
      }

      (`Returning ${filteredTransactions.length} transactions after filtering`);

      return {
        transactions: filteredTransactions,
        summary: {
          totalTransactions,
          totalRevenue,
          totalDoctorEarnings,
          totalServiceCharges,
        },
        pagination: {
          total: filteredTransactions.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
        }
      };

    } catch (error) {
      console.error('Error getting transaction history:', error);
      ctx.throw(500, `Error getting transaction history: ${error.message}`);
    }
  },

  // Get doctor earnings summary
  async getDoctorEarnings(ctx) {
    try {
      ('Getting doctor earnings summary');

      // Get all paid service requests with doctor information
      const paidRequests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: { 
          isPaid: {
            $eq: true
          }
        },
        populate: ['doctor'],
      });

      (`Found ${paidRequests.length} paid requests for doctor earnings calculation`);

      // Group by doctor and calculate earnings
      const doctorEarnings = {};
      const serviceCharge = await getBookingFee(strapi); // Dynamic service charge

      paidRequests.forEach(request => {
        const doctor = request.doctor;
        if (!doctor) return;

        const doctorId = doctor.id;
        const doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.name || 'Unknown Doctor';
        const totalAmount = request.totalAmount || 0;
        const doctorFee = Math.max(0, totalAmount - serviceCharge);

        if (!doctorEarnings[doctorId]) {
          doctorEarnings[doctorId] = {
            doctorId,
            doctorName,
            totalEarnings: 0,
            totalTransactions: 0,
            isPaid: false, // Track if doctor has been paid
          };
        }

        doctorEarnings[doctorId].totalEarnings += doctorFee;
        doctorEarnings[doctorId].totalTransactions += 1;
      });

      // Convert to array and sort by earnings
      const earnings = Object.values(doctorEarnings).sort((a, b) => b.totalEarnings - a.totalEarnings);

      (`Found earnings for ${earnings.length} doctors`);

      return earnings;

    } catch (error) {
      console.error('Error getting doctor earnings:', error);
      ctx.throw(500, `Error getting doctor earnings: ${error.message}`);
    }
  },

  // Calculate cost based on service pricing
  async calculateCost(ctx) {
    try {
      ('📊 Calculate cost request body:', ctx.request.body);
      
      // Support both direct serviceId and data.serviceId formats
      const requestData = ctx.request.body.data || ctx.request.body;
      const serviceId = requestData.serviceId || requestData.service;

      if (!serviceId) {
        ('❌ No serviceId provided in request');
        return ctx.badRequest('Service ID is required');
      }

      ('🔍 Looking for service ID:', serviceId);

      // Get the service with pricing information
      const service = await strapi.entityService.findOne('api::service.service', serviceId, {
        fields: ['name', 'price', 'duration', 'category', 'serviceType']
      });

      if (!service) {
        ('❌ Service not found:', serviceId);
        return ctx.notFound('Service not found');
      }

      ('✅ Service found:', service);

      const serviceCharge = await getBookingFee(strapi); // Dynamic service charge for all requests
      const servicePrice = parseFloat(service.price) || 0;
      const totalAmount = servicePrice + serviceCharge;

      const result = {
        service: {
          id: serviceId,
          name: service.name,
          price: servicePrice,
          duration: service.duration,
          category: service.category,
          serviceType: service.serviceType
        },
        pricing: {
          servicePrice: servicePrice,
          serviceCharge: serviceCharge,
          totalAmount: totalAmount
        }
      };

      ('✅ Cost calculation result:', result);
      return result;

    } catch (error) {
      console.error('❌ Error calculating service cost:', error);
      ctx.throw(500, `Error calculating service cost: ${error.message}`);
    }
  },

  // Email-based accept request
  async emailAcceptRequest(ctx) {
    try {
      const { id } = ctx.params;
      const { doctorId } = ctx.query;

      console.log(`📧 Email accept request - Service Request ID: ${id}, Doctor ID: ${doctorId}`);

      // Validate the service request exists and is pending
      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['business', 'doctor', 'service']
      });

      if (!serviceRequest) {
        return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Service request not found`);
      }

      if (serviceRequest.status !== 'pending') {
        return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Service request is no longer available`);
      }

      // Validate the doctor exists and is verified
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        fields: ['id', 'firstName', 'lastName', 'isAvailable', 'isVerified']
      });

      if (!doctor) {
        return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Doctor not found`);
      }

      if (!doctor.isVerified) {
        return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Doctor is not verified`);
      }

      if (!doctor.isAvailable) {
        return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Doctor is currently unavailable`);
      }

      // Accept the service request
      const updatedRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: {
          status: 'accepted',
          doctor: doctorId,
          acceptedAt: new Date(),
        },
        populate: ['business', 'doctor', 'service']
      });

      // Note: Doctor availability is NOT changed when accepting requests
      // This allows doctors to accept multiple requests if they choose to

      console.log(`✅ Service request ${id} accepted by Dr. ${doctor.firstName} ${doctor.lastName} via email`);

      // Redirect to success page
      return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/doctor/dashboard?accepted=${id}`);

    } catch (error) {
      console.error('❌ Error accepting service request via email:', error);
      return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Failed to accept request`);
    }
  },

  // Email-based ignore request
  async emailIgnoreRequest(ctx) {
    try {
      const { id } = ctx.params;
      const { doctorId } = ctx.query;

      console.log(`📧 Email ignore request - Service Request ID: ${id}, Doctor ID: ${doctorId}`);

      // Validate the service request exists
      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['business', 'doctor', 'service']
      });

      if (!serviceRequest) {
        return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Service request not found`);
      }

      // Validate the doctor exists and is verified
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        fields: ['id', 'firstName', 'lastName', 'isVerified']
      });

      if (!doctor) {
        return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Doctor not found`);
      }

      if (!doctor.isVerified) {
        return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Doctor is not verified`);
      }

      console.log(`ℹ️ Service request ${id} ignored by Dr. ${doctor.firstName} ${doctor.lastName} via email`);

      // Redirect to dashboard with ignore confirmation
      return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/doctor/dashboard?ignored=${id}`);

    } catch (error) {
      console.error('❌ Error ignoring service request via email:', error);
      return ctx.redirect(`${process.env.FRONTEND_DASHBOARD_URL}/error?message=Failed to process request`);
    }
  },

  // Create a patient service request (public endpoint, no authentication required)
  async createPatientRequest(ctx) {
    try {
      console.log('👤 Creating patient service request');
      console.log('📋 Request body:', ctx.request.body);
      console.log('🕐 DEBUG - received serviceDateTime:', ctx.request.body.serviceDateTime);

      const {
        // Patient information
        patientFirstName,
        patientLastName,
        patientPhone,
        patientEmail,
        
        // Service information
        serviceId,
        serviceType,
        urgencyLevel = 'medium',
        description,
        estimatedDuration = 1,
        
        // Doctor selection and scheduling
        doctorSelectionType = 'any',
        preferredDoctorId,
        serviceDateTime,
        
        // Payment information
        isPaid,
        paymentMethod,
        paymentIntentId,
        paymentStatus,
        paidAt,
        totalAmount,
        servicePrice,
        serviceCharge,
        currency = 'gbp',
        chargeId,
        
        // Additional fields
        status = 'pending',
        requestedAt
      } = ctx.request.body;

      // Validate required fields
      if (!patientFirstName || !patientLastName || !patientPhone || !patientEmail) {
        return ctx.badRequest('Patient information (firstName, lastName, phone, email) is required');
      }

      if (!serviceId) {
        return ctx.badRequest('Service ID is required');
      }

      // Validate service exists
      const service = await strapi.entityService.findOne('api::service.service', serviceId);
      if (!service) {
        return ctx.badRequest('Service not found');
      }

      console.log('✅ Service found:', service.name);

      // Create a special "patient" business entry or use a system placeholder
      let patientBusiness;
      try {
        // Check if a patient business entry already exists
        const existingPatientBusiness = await strapi.entityService.findMany('api::business.business', {
          filters: {
            email: 'patients@system.com'
          },
          limit: 1
        });

        if (existingPatientBusiness.length > 0) {
          patientBusiness = existingPatientBusiness[0];
        } else {
          // Create a system business entry for patient requests
          patientBusiness = await strapi.entityService.create('api::business.business', {
            data: {
              businessName: 'Patient Requests',
              name: 'Patient Requests',
              email: 'patients@system.com',
              password: '$2a$10$defaultPatientSystemPassword',
              phone: '+44000000000',
              businessType: 'patient',
              isVerified: true,
              isEmailVerified: true,
              publishedAt: new Date()
            }
          });
        }
      } catch (businessError) {
        console.error('Error creating/finding patient business entry:', businessError);
        return ctx.internalServerError('Failed to setup patient business entry');
      }

      // Prepare service request data
      const serviceRequestData = {
        business: patientBusiness.id,
        urgencyLevel,
        serviceType: serviceType || service.name,
        description: description || `Patient service request for ${service.name}`,
        estimatedDuration: parseInt(estimatedDuration) || 1,
        requestedAt: requestedAt ? new Date(requestedAt) : new Date(),
        status,
        publishedAt: new Date(),
        
        // Doctor selection and scheduling
        doctorSelectionType: doctorSelectionType || 'any',
        preferredDoctorId: preferredDoctorId || null,
        requestedServiceDateTime: serviceDateTime || null,
        
        // Mark as patient request
        isPatientRequest: true,
        
        // Patient information
        patientFirstName,
        patientLastName,
        patientPhone,
        patientEmail,
        
        // Service information
        service: serviceId
      };

      console.log('🕐 DEBUG - Final serviceRequestData.requestedServiceDateTime:', serviceRequestData.requestedServiceDateTime);

      // Add payment information if provided
      if (isPaid) {
        let normalizedPaymentStatus = paymentStatus;
        if (paymentStatus === 'succeeded') {
          normalizedPaymentStatus = 'paid';
        } else if (paymentStatus === 'requires_payment_method') {
          normalizedPaymentStatus = 'pending';
        } else if (paymentStatus === 'failed') {
          normalizedPaymentStatus = 'failed';
        } else if (!['pending', 'paid', 'failed', 'refunded', 'doctor_paid'].includes(paymentStatus)) {
          normalizedPaymentStatus = 'paid';
        }
        
        serviceRequestData.isPaid = isPaid;
        serviceRequestData.paymentMethod = paymentMethod;
        serviceRequestData.paymentIntentId = paymentIntentId;
        serviceRequestData.paymentStatus = normalizedPaymentStatus;
        serviceRequestData.paidAt = paidAt ? new Date(paidAt) : new Date();
        serviceRequestData.totalAmount = parseFloat(totalAmount) || 0;
        serviceRequestData.currency = currency;
        serviceRequestData.chargeId = chargeId;
        
        // Create payment details object
        const paymentDetails = {
          paymentIntentId,
          paymentMethod: paymentMethod || 'card',
          paymentStatus: paymentStatus || 'succeeded',
          servicePrice: parseFloat(servicePrice) || 0,
          serviceCharge: parseFloat(serviceCharge) || 0,
          totalAmount: parseFloat(totalAmount) || 0,
          processedAt: paidAt || new Date().toISOString(),
          currency: currency || 'gbp'
        };
        
        serviceRequestData.paymentDetails = JSON.stringify(paymentDetails);
        
        console.log('💰 Adding payment information to patient request:', {
          isPaid: serviceRequestData.isPaid,
          paymentIntentId: serviceRequestData.paymentIntentId,
          totalAmount: serviceRequestData.totalAmount,
          paymentMethod: serviceRequestData.paymentMethod
        });
      }

      // Create the service request
      const serviceRequest = await strapi.entityService.create('api::service-request.service-request', {
        data: serviceRequestData,
        populate: ['business', 'service']
      });

      console.log('✅ Patient service request created:', serviceRequest.id);

      // Find nearby doctors and send notifications
      try {
        console.log('🔍 Finding available doctors for patient request...');
        
        // Get all verified doctors who offer this service
        const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
          filters: {
            isVerified: true,
            isAvailable: true,
            services: {
              id: {
                $in: [serviceId]
              }
            }
          },
          populate: ['services'],
          limit: 100
        });

        console.log(`🩺 Found ${doctors.length} verified doctors who offer this service`);

        if (doctors.length > 0) {
          // Send notifications to all available doctors in parallel (non-blocking)
          const whatsappService = strapi.service('whatsapp');

          // Create notification promises for parallel execution
          const notificationPromises = doctors.map(async (doctor) => {
            try {
              // Send WhatsApp notification using the same template as business requests
              if (whatsappService && doctor.phone) {
                // Create a mock business object for patient requests
                const patientAsBusiness = {
                  id: 'patient',
                  name: 'Private Patient',
                  businessName: 'Private Patient',
                  contactPerson: `${patientFirstName} ${patientLastName}`,
                  phone: patientPhone,
                  email: patientEmail,
                  address: 'Patient Location', // For template parameter
                  latitude: null, // Will show as "Online" or distance calculation will be skipped
                  longitude: null,
                  isPatient: true
                };

                await whatsappService.sendServiceRequestNotification(doctor, serviceRequest, patientAsBusiness);
                console.log(`📱 WhatsApp sent to Dr. ${doctor.firstName} ${doctor.lastName}`);
              }

              // Send email notification
              try {
                await strapi.plugins['email'].services.email.send({
                  to: doctor.email,
                  subject: 'New Patient Service Request',
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #2563eb;">New Patient Service Request</h2>
                      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Service:</strong> ${service.name}</p>
                        <p><strong>Patient:</strong> ${patientFirstName} ${patientLastName}</p>
                        <p><strong>Phone:</strong> ${patientPhone}</p>
                        <p><strong>Email:</strong> ${patientEmail}</p>
                        <p><strong>Payment Status:</strong> ${isPaid ? 'Paid' : 'Pending'}</p>
                        <p><strong>Amount:</strong> ${totalAmount ? '£' + totalAmount.toFixed(2) : 'N/A'}</p>
                        <p><strong>Description:</strong> ${description || 'Not provided'}</p>
                      </div>
                      <p>Please log in to your dashboard to accept or decline this request.</p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_DASHBOARD_URL || process.env.BASE_URL}/doctor/dashboard" 
                           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                          View Dashboard
                        </a>
                      </div>
                    </div>
                  `
                });
                console.log(`📧 Email sent to Dr. ${doctor.firstName} ${doctor.lastName}`);
              } catch (emailError) {
                console.error(`❌ Failed to send email to Dr. ${doctor.firstName} ${doctor.lastName}:`, emailError.message);
              }

            } catch (error) {
              console.error(`❌ Error sending notification to Dr. ${doctor.firstName} ${doctor.lastName}:`, error);
            }
          });

          // Execute all notifications in parallel without waiting for completion
          // This allows the response to be sent immediately while notifications happen in background
          Promise.allSettled(notificationPromises).then((results) => {
            const successful = results.filter(result => result.status === 'fulfilled').length;
            const failed = results.filter(result => result.status === 'rejected').length;
            console.log(`🎯 Notification summary: ${successful} successful, ${failed} failed out of ${doctors.length} doctors`);
          }).catch((error) => {
            console.error('❌ Error in notification batch processing:', error);
          });

          console.log(`🚀 Started sending notifications to ${doctors.length} doctors in background`);
        } else {
          console.log('⚠️ No available doctors found for this service');
        }
      } catch (notificationError) {
        console.error('❌ Error in doctor notification process:', notificationError);
        // Don't fail the request creation if notifications fail
      }

      // Return the created service request
      return {
        data: serviceRequest,
        message: 'Patient service request created successfully'
      };

    } catch (error) {
      console.error('❌ Error creating patient service request:', error);
      ctx.throw(500, `Error creating patient service request: ${error.message}`);
    }
  },
}));
