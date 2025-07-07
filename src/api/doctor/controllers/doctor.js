// @ts-nocheck
'use strict';

const bcrypt = require('bcryptjs');
const { createCoreController } = require('@strapi/strapi').factories;

/**
 * doctor controller
 */

module.exports = createCoreController('api::doctor.doctor', ({ strapi }) => ({
  
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      console.log('🔍 Looking for doctor with ID:', id);
      
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', id);
      console.log('👤 Found doctor:', doctor ? 'YES' : 'NO');
      
      if (!doctor) {
        console.log('❌ Doctor not found with ID:', id);
        return ctx.notFound('Doctor not found');
      }
      
      console.log('✅ Returning doctor:', doctor.email);
      return { data: doctor };
    } catch (error) {
      console.error('💥 Error in findOne:', error);
      ctx.throw(500, `Error finding doctor: ${error.message}`);
    }
  },

  async create(ctx) {
    try {
      const { data } = ctx.request.body;
      
      // Hash password if provided
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      const doctor = await strapi.entityService.create('api::doctor.doctor', {
        data,
      });

      return doctor;
    } catch (error) {
      ctx.throw(500, `Error creating doctor: ${error.message}`);
    }
  },

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      
      // Hash password if provided
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      const doctor = await strapi.entityService.update('api::doctor.doctor', id, {
        data,
      });

      return doctor;
    } catch (error) {
      ctx.throw(500, `Error updating doctor: ${error.message}`);
    }
  },

  async findAvailable(ctx) {
    try {
      const { latitude, longitude, radius = 10 } = ctx.query;
      
      const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
        filters: {
          isAvailable: true,
          isVerified: true, // Only show verified doctors to businesses
        },
        populate: ['profilePicture'],
      });

      // Remove sensitive contact information for business access
      const filteredDoctors = doctors.map(doctor => {
        const { email, phone, password, emergencyContact, ...publicData } = doctor;
        return publicData;
      });

      if (latitude && longitude) {
        // Filter by distance if coordinates provided
        const nearbyDoctors = filteredDoctors.filter(doctor => {
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

      return filteredDoctors;
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

  async getStats(ctx) {
    try {
      const { id } = ctx.params;
      
      // Use the service to get doctor statistics
      const stats = await strapi.service('api::doctor.doctor').getDoctorStats(id);
      
      return ctx.send({
        data: stats
      });
    } catch (error) {
      ctx.throw(500, `Error fetching doctor stats: ${error.message}`);
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
