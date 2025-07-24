// @ts-nocheck
'use strict';

/**
 * service-request controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::service-request.service-request', ({ strapi }) => ({
  
  async find(ctx) {
    try {
      const { query } = ctx;
      
      // Use the default strapi find method but ensure we populate the relationships
      const result = await strapi.entityService.findMany('api::service-request.service-request', {
        ...query,
        populate: {
          business: true,
          doctor: true,
          ...query.populate,
        },
      });
      
      // Return the results in the standard format
      return { data: result };
    } catch (error) {
      console.error('Error in find:', error);
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

  // Find nearby doctors when a service request is created
  async findNearbyDoctors(ctx) {
    try {
      const { businessId, latitude, longitude, radius = 10 } = ctx.request.body;
      
      // Get business details
      const business = await strapi.entityService.findOne('api::business.business', businessId);
      
      if (!business) {
        return ctx.badRequest('Business not found');
      }

      // Find all available doctors within radius (using simple distance calculation)
      const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
        filters: {
          isAvailable: true,
          isVerified: true,
        },
        populate: ['profilePicture'],
        fields: ['id', 'name', 'firstName', 'lastName', 'phone', 'email', 'specialization', 'isAvailable', 'isVerified', 'latitude', 'longitude'],
      });

      // Calculate distance and filter doctors within radius
      const nearbyDoctors = doctors.filter(doctor => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(doctor.latitude),
          parseFloat(doctor.longitude)
        );
        return distance <= radius;
      }).map(doctor => ({
        ...doctor,
        distance: calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(doctor.latitude),
          parseFloat(doctor.longitude)
        )
      })).sort((a, b) => a.distance - b.distance);

      return {
        doctors: nearbyDoctors,
        count: nearbyDoctors.length
      };
    } catch (error) {
      ctx.throw(500, `Error finding nearby doctors: ${error.message}`);
    }
  },

  // Create a new service request and notify nearby doctors
  async createServiceRequest(ctx) {
    try {
      const { businessId, urgencyLevel, serviceType, description, estimatedDuration, scheduledAt, serviceDateTime } = ctx.request.body;
      
      // Get business details
      const business = await strapi.entityService.findOne('api::business.business', businessId);
      
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

      // Create the service request
      const serviceRequest = await strapi.entityService.create('api::service-request.service-request', {
        data: {
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
        },
        populate: ['business'],
      });

      // Find nearby doctors
      const nearbyDoctorsResponse = await this.findNearbyDoctors({
        request: {
          body: {
            businessId,
            latitude: business.latitude,
            longitude: business.longitude,
            radius: 10
          }
        }
      });

      // In a real application, you would send notifications to nearby doctors
      // For now, we'll just log the notification
      console.log(`Notifying ${nearbyDoctorsResponse.count} nearby doctors about new service request ${serviceRequest.id}`);

      // Send WhatsApp notifications to nearby doctors
      const WhatsAppService = require('../../../services/whatsapp');
      const whatsappService = new WhatsAppService();
      
      let notificationsSent = 0;
      for (const doctor of nearbyDoctorsResponse.doctors) {
        try {
          await whatsappService.sendServiceRequestNotification(doctor, serviceRequest, business);
          notificationsSent++;
        } catch (error) {
          console.error(`Failed to send WhatsApp notification to Dr. ${doctor.name}:`, error);
        }
      }
      
      console.log(`WhatsApp notifications sent to ${notificationsSent} out of ${nearbyDoctorsResponse.count} doctors`);

      return {
        serviceRequest,
        notifiedDoctors: nearbyDoctorsResponse.count,
        whatsappNotificationsSent: notificationsSent
      };
    } catch (error) {
      ctx.throw(500, `Error creating service request: ${error.message}`);
    }
  },

  // Accept a service request by a doctor
  async acceptServiceRequest(ctx) {
    try {
      const { id } = ctx.params;
      const { doctorId } = ctx.request.body;

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

      // Update the service request
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: {
          doctor: doctorId,
          status: 'accepted',
          acceptedAt: new Date(),
          totalAmount: doctor.hourlyRate * (serviceRequest.estimatedDuration || 1),
        },
        populate: ['business', 'doctor'],
      });

      // Set doctor as temporarily unavailable
      await strapi.entityService.update('api::doctor.doctor', doctorId, {
        data: {
          isAvailable: false,
        },
      });

      return updatedServiceRequest;
    } catch (error) {
      ctx.throw(500, `Error accepting service request: ${error.message}`);
    }
  },

  // Reject a service request
  async rejectServiceRequest(ctx) {
    try {
      const { id } = ctx.params;
      const { doctorId, reason } = ctx.request.body;

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

      const serviceRequests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: {
          doctor: doctorId,
          status: 'completed', // Only get completed requests
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
        notes
      } = ctx.request.body;
      
      console.log('Creating direct request with data:', {
        businessId, doctorId, urgencyLevel, serviceType, description, estimatedDuration, serviceDateTime,
        firstName, lastName, phoneNumber, urgency, symptoms, notes
      });
      
      // Determine if this is from business portal or patient portal
      const isBusinessRequest = !!businessId;
      const isPatientRequest = !!(firstName && lastName && phoneNumber);
      
      if (!isBusinessRequest && !isPatientRequest) {
        return ctx.badRequest('Invalid request: must provide either business info or patient info');
      }
      
      // Validate business exists (for business requests)
      if (isBusinessRequest) {
        const business = await strapi.entityService.findOne('api::business.business', businessId);
        if (!business) {
          return ctx.badRequest('Business not found');
        }
      }

      // Validate doctor exists and is available
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      if (!doctor.isAvailable) {
        return ctx.badRequest('Doctor is currently unavailable');
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
        urgencyLevel: urgencyLevel || 'medium',
        serviceType: serviceType || 'Medical Consultation',
        description,
        estimatedDuration: parseInt(estimatedDuration) || 1,
        requestedAt: new Date(),
        requestedServiceDateTime: requestedServiceDateTime,
        status: 'pending'
      } : {
        // Patient request data
        doctor: doctorId,
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

      // Create the service request
      const serviceRequest = await strapi.entityService.create('api::service-request.service-request', {
        data: requestData,
        populate: ['business', 'doctor'],
      });

      console.log('Direct service request created:', serviceRequest.id);

      // Send WhatsApp notification to the selected doctor
      try {
        console.log('Attempting to send WhatsApp notification to selected doctor...');
        const whatsappService = strapi.service('whatsapp');
        console.log('WhatsApp service retrieved:', !!whatsappService);
        
        if (whatsappService) {
          console.log('Sending notification to doctor:', {
            id: doctor.id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            phone: doctor.phone
          });
          
          // Get business data for the notification (for business requests)
          let businessForNotification = null;
          if (isBusinessRequest) {
            businessForNotification = await strapi.entityService.findOne('api::business.business', businessId);
          }
          
          await whatsappService.sendServiceRequestNotification(doctor, serviceRequest, businessForNotification);
          console.log(`WhatsApp notification sent to selected doctor: ${doctor.firstName} ${doctor.lastName}`);
        } else {
          console.error('WhatsApp service not found!');
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
      
      // Get all pending or accepted requests that are either:
      // 1. Unassigned (no doctor) - general requests that any doctor can accept
      // 2. Specifically assigned to this doctor (both pending and accepted)
      const requests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: {
          $or: [
            { 
              status: 'pending',
              $or: [
                { doctor: null }, // Unassigned requests
                { doctor: doctorId } // Pending requests specifically for this doctor
              ]
            },
            {
              status: 'accepted',
              doctor: doctorId // Accepted requests by this doctor
            }
          ]
        },
        populate: {
          business: { 
            fields: ['businessName', 'contactPersonName', 'phone', 'address', 'city', 'state', 'zipCode'] 
          },
          doctor: true
        },
        sort: 'requestedAt:desc',
      });

      console.log(`Found ${requests.length} available requests for doctor ${doctorId}`);
      
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
      const { paymentMethod, paymentDetails } = ctx.request.body;

      console.log(`Processing payment for service request ${id} with method ${paymentMethod}`);

      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['doctor', 'business'],
      });

      if (!serviceRequest) {
        console.log(`Service request ${id} not found`);
        return ctx.notFound('Service request not found');
      }

      console.log(`Service request ${id} status: ${serviceRequest.status}`);

      if (serviceRequest.status !== 'completed') {
        console.log(`Cannot process payment for request ${id} with status ${serviceRequest.status}`);
        return ctx.badRequest('Can only process payment for completed service requests');
      }

      if (serviceRequest.isPaid) {
        console.log(`Service request ${id} has already been paid`);
        return ctx.badRequest('Service request has already been paid');
      }

      // Calculate payment amount based on doctor rate and service duration
      const doctor = serviceRequest.doctor;
      const hourlyRate = doctor?.hourlyRate || 0;
      const hours = serviceRequest.estimatedDuration || 1;
      const amount = hourlyRate * hours;

      console.log(`Payment amount for request ${id}: ${amount}`);

      // Update the service request with payment information
      // Keep the status as 'completed' but mark as paid
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: {
          isPaid: true, // This is the flag we use to track payment status
          paidAt: new Date(),
          paymentMethod,
          paymentDetails: JSON.stringify(paymentDetails),
          totalAmount: amount,
          // Don't change the status since 'paid' is not a valid status in our schema
          // Maintain the 'completed' status
        },
        populate: ['business', 'doctor'],
      });

      console.log(`Payment processed successfully for request ${id}`);
      return updatedServiceRequest;
    } catch (error) {
      ctx.throw(500, `Error processing payment: ${error.message}`);
    }
  },

  // WhatsApp Integration Methods
  async whatsappAcceptRequest(ctx) {
    try {
      const { token } = ctx.params;
      const WhatsAppService = require('../../../services/whatsapp');
      const whatsappService = new WhatsAppService();

      // Verify and decode the token
      const { serviceRequestId, doctorId } = whatsappService.verifyAcceptanceToken(token);

      // Get the service request
      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', serviceRequestId, {
        populate: ['business', 'doctor'],
      });

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

      // Accept the service request (same logic as dashboard acceptance)
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', serviceRequestId, {
        data: {
          doctor: doctorId,
          status: 'accepted',
          acceptedAt: new Date(),
          totalAmount: doctor.hourlyRate * (serviceRequest.estimatedDuration || 1),
        },
        populate: ['business', 'doctor'],
      });

      // Set doctor as temporarily unavailable
      await strapi.entityService.update('api::doctor.doctor', doctorId, {
        data: {
          isAvailable: false,
        },
      });

      // Send confirmation messages
      await whatsappService.sendConfirmationMessage(doctor.phone, 'accept', serviceRequest, serviceRequest.business);
      await whatsappService.sendBusinessNotification(serviceRequest.business.phone, doctor, serviceRequest);

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
              <strong>Business:</strong> ${serviceRequest.business.name}<br>
              <strong>Service:</strong> ${serviceRequest.serviceType}<br>
              <strong>Duration:</strong> ${serviceRequest.estimatedDuration} hour(s)<br>
              <strong>Contact:</strong> ${serviceRequest.business.phone}<br>
              <strong>Address:</strong> ${serviceRequest.business.address}
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <p>1. Contact the business directly to coordinate your visit</p>
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
      const WhatsAppService = require('../../../services/whatsapp');
      const whatsappService = new WhatsAppService();

      // Verify and decode the token
      const { serviceRequestId, doctorId } = whatsappService.verifyAcceptanceToken(token);

      // Get the service request
      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', serviceRequestId, {
        populate: ['business', 'doctor'],
      });

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
        fields: ['id', 'name', 'firstName', 'lastName', 'phone', 'email', 'specialization'],
      });
      
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      const WhatsAppService = require('../../../services/whatsapp');
      const whatsappService = new WhatsAppService();

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
        phone: '+1234567890'
      };

      // Send test notification
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

      console.log('🔧 Starting WhatsApp setup diagnosis...');

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
        console.log('✅ Phone number formatting: OK');
      } catch (error) {
        results.diagnosis.phoneFormatting = {
          success: false,
          error: error.message
        };
        results.recommendations.push('Fix phone number format - ensure it includes country code');
        console.log('❌ Phone number formatting: FAILED');
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
        console.log('✅ Retrieved verified numbers list');
      } catch (error) {
        results.diagnosis.verifiedNumbers = { error: error.message };
        results.recommendations.push('Check WhatsApp Business account permissions');
        console.log('❌ Failed to get verified numbers');
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

      console.log('🔧 Diagnosis complete:', JSON.stringify(results, null, 2));

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
}));

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}
