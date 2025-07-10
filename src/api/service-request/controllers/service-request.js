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
      const { businessId, urgencyLevel, serviceType, description, estimatedDuration, scheduledAt } = ctx.request.body;
      
      // Get business details
      const business = await strapi.entityService.findOne('api::business.business', businessId);
      
      if (!business) {
        return ctx.badRequest('Business not found');
      }

      // Create the service request
      const serviceRequest = await strapi.entityService.create('api::service-request.service-request', {
        data: {
          business: businessId,
          urgencyLevel,
          serviceType,
          description,
          estimatedDuration,
          scheduledAt,
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

      return {
        serviceRequest,
        notifiedDoctors: nearbyDoctorsResponse.count
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
        businessId, 
        doctorId, 
        urgencyLevel, 
        serviceType, 
        description, 
        estimatedDuration 
      } = ctx.request.body;
      
      console.log('Creating direct request with data:', {
        businessId, doctorId, urgencyLevel, serviceType, description, estimatedDuration
      });
      
      // Validate business exists
      const business = await strapi.entityService.findOne('api::business.business', businessId);
      if (!business) {
        return ctx.badRequest('Business not found');
      }

      // Validate doctor exists and is available
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      if (!doctor) {
        return ctx.badRequest('Doctor not found');
      }

      if (!doctor.isAvailable) {
        return ctx.badRequest('Doctor is currently unavailable');
      }

      // Create the service request
      const serviceRequest = await strapi.entityService.create('api::service-request.service-request', {
        data: {
          business: businessId,
          doctor: doctorId,
          urgencyLevel: urgencyLevel || 'medium',
          serviceType: serviceType || 'Medical Consultation',
          description,
          estimatedDuration: parseFloat(estimatedDuration) || 1,
          requestedAt: new Date(),
          status: 'pending',
          publishedAt: new Date(),
        },
        populate: ['business', 'doctor'],
      });

      console.log('Direct service request created:', serviceRequest.id);

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

      const serviceRequest = await strapi.entityService.findOne('api::service-request.service-request', id, {
        populate: ['doctor', 'business'],
      });

      if (!serviceRequest) {
        return ctx.notFound('Service request not found');
      }

      if (serviceRequest.status !== 'completed') {
        return ctx.badRequest('Can only process payment for completed service requests');
      }

      if (serviceRequest.isPaid) {
        return ctx.badRequest('Service request has already been paid');
      }

      // Calculate payment amount based on doctor rate and service duration
      const doctor = serviceRequest.doctor;
      const hourlyRate = doctor?.hourlyRate || 0;
      const hours = serviceRequest.estimatedDuration || 1;
      const amount = hourlyRate * hours;

      // Update the service request with payment information
      const updatedServiceRequest = await strapi.entityService.update('api::service-request.service-request', id, {
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentMethod,
          paymentDetails: JSON.stringify(paymentDetails),
          totalAmount: amount,
        },
        populate: ['business', 'doctor'],
      });

      return updatedServiceRequest;
    } catch (error) {
      ctx.throw(500, `Error processing payment: ${error.message}`);
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
