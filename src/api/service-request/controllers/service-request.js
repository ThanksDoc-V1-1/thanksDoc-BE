// @ts-nocheck
'use strict';

/**
 * service-request controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::service-request.service-request', ({ strapi }) => ({
  
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

  // Get service requests for a specific doctor
  async getDoctorRequests(ctx) {
    try {
      const { doctorId } = ctx.params;

      const serviceRequests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: {
          doctor: doctorId,
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
        populate: ['business', 'doctor'],
        sort: { createdAt: 'desc' },
      });

      return serviceRequests;
    } catch (error) {
      ctx.throw(500, `Error getting business requests: ${error.message}`);
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
