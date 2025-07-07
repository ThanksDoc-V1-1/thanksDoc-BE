'use strict';

/**
 * doctor controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::doctor.doctor', ({ strapi }) => ({
  
  async findAvailable(ctx) {
    try {
      const { latitude, longitude, radius = 10 } = ctx.query;
      
      const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
        filters: {
          isAvailable: true,
          isVerified: true,
        },
        populate: ['profilePicture'],
      });

      if (latitude && longitude) {
        // Filter by distance if coordinates provided
        const nearbyDoctors = doctors.filter(doctor => {
          const distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(doctor.latitude),
            parseFloat(doctor.longitude)
          );
          return distance <= parseFloat(radius);
        }).map(doctor => ({
          ...doctor,
          distance: calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(doctor.latitude),
            parseFloat(doctor.longitude)
          )
        })).sort((a, b) => a.distance - b.distance);

        return nearbyDoctors;
      }

      return doctors;
    } catch (error) {
      ctx.throw(500, `Error finding available doctors: ${error.message}`);
    }
  },

  async updateAvailability(ctx) {
    try {
      const { id } = ctx.params;
      const { isAvailable } = ctx.request.body;

      const doctor = await strapi.entityService.update('api::doctor.doctor', id, {
        data: {
          isAvailable,
        },
      });

      return doctor;
    } catch (error) {
      ctx.throw(500, `Error updating doctor availability: ${error.message}`);
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
