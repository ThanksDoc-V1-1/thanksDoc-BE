// @ts-nocheck
'use strict';

const bcrypt = require('bcryptjs');
const { createCoreController } = require('@strapi/strapi').factories;

/**
 * doctor controller
 */

module.exports = createCoreController('api::doctor.doctor', ({ strapi }) => ({
  
  async find(ctx) {
    try {
      const { query } = ctx;
      
      // Use the default strapi find method but ensure we get all the fields
      const result = await strapi.entityService.findMany('api::doctor.doctor', {
        ...query,
        populate: query.populate || ['profilePicture'],
      });
      
      // Return the results in the standard format
      return { data: result };
    } catch (error) {
      console.error('Error in find:', error);
      ctx.throw(500, `Error finding doctors: ${error.message}`);
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const { populate } = ctx.query;
      console.log('🔍 Looking for doctor with ID:', id);
      console.log('🔗 Populate query:', populate);
      
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', id, {
        populate: populate ? (typeof populate === 'string' ? populate.split(',') : populate) : ['services'],
      });
      console.log('👤 Found doctor:', doctor ? 'YES' : 'NO');
      console.log('🔧 Doctor services:', doctor?.services?.length || 0);
      
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

      // Update the doctor and automatically publish the changes
      const doctor = await strapi.entityService.update('api::doctor.doctor', id, {
        data: {
          ...data,
          publishedAt: new Date(), // Automatically publish the changes
        },
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

  async getOverallStats(ctx) {
    try {
      const totalDoctors = await strapi.entityService.count('api::doctor.doctor');
      const verifiedDoctors = await strapi.entityService.count('api::doctor.doctor', {
        filters: { isVerified: true }
      });
      const availableDoctors = await strapi.entityService.count('api::doctor.doctor', {
        filters: { 
          isAvailable: true,
          isVerified: true
        }
      });

      return {
        totalDoctors,
        verifiedDoctors,
        availableDoctors
      };
    } catch (error) {
      ctx.throw(500, `Error getting doctor stats: ${error.message}`);
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
