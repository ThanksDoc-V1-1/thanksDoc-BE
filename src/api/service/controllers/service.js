'use strict';

/**
 * service controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::service.service', ({ strapi }) => ({
  
  // Get services by category
  async findByCategory(ctx) {
    try {
      const { category } = ctx.params;
      
      if (!['in-person', 'online', 'nhs'].includes(category)) {
        return ctx.badRequest('Invalid category. Must be "in-person", "online", or "nhs"');
      }
      
      const services = await strapi.entityService.findMany('api::service.service', {
        filters: {
          category: category,
          isActive: true
        },
        sort: { displayOrder: 'asc', name: 'asc' }
      });
      
      return { data: services };
    } catch (error) {
      console.error('Error finding services by category:', error);
      ctx.throw(500, `Error finding services: ${error.message}`);
    }
  },

  // Get patient-specific services
  async findPatientServices(ctx) {
    try {
      const services = await strapi.entityService.findMany('api::service.service', {
        filters: {
          $or: [
            { serviceType: 'patient' },
            { serviceType: 'both' }
          ],
          isActive: true
        },
        sort: { displayOrder: 'asc', name: 'asc' }
      });
      
      return { data: services };
    } catch (error) {
      console.error('Error finding patient services:', error);
      ctx.throw(500, `Error finding patient services: ${error.message}`);
    }
  },

  // Get business-specific services
  async findBusinessServices(ctx) {
    try {
      const services = await strapi.entityService.findMany('api::service.service', {
        filters: {
          $or: [
            { serviceType: 'business' },
            { serviceType: 'both' }
          ],
          isActive: true
        },
        sort: { displayOrder: 'asc', name: 'asc' }
      });
      
      return { data: services };
    } catch (error) {
      console.error('Error finding business services:', error);
      ctx.throw(500, `Error finding business services: ${error.message}`);
    }
  },

  // Find doctors by service
  async findDoctorsByService(ctx) {
    try {
      const { serviceId } = ctx.params;
      const { latitude, longitude, radius = 10 } = ctx.query;
      
      const service = await strapi.entityService.findOne('api::service.service', serviceId, {
        populate: {
          doctors: {
            filters: {
              isAvailable: true,
              isVerified: true
            },
            fields: ['id', 'firstName', 'lastName', 'specialization', 'hourlyRate', 'latitude', 'longitude', 'address', 'city']
          }
        }
      });
      
      if (!service) {
        return ctx.notFound('Service not found');
      }
      
      let doctors = service.doctors || [];
      
      // Filter by location if coordinates provided
      if (latitude && longitude) {
        doctors = doctors.filter(doctor => {
          if (!doctor.latitude || !doctor.longitude) return false;
          
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
      }
      
      return {
        service,
        doctors,
        count: doctors.length
      };
    } catch (error) {
      console.error('Error finding doctors by service:', error);
      ctx.throw(500, `Error finding doctors: ${error.message}`);
    }
  }
}));

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}
