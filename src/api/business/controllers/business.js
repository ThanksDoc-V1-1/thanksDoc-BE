// @ts-nocheck
'use strict';

const bcrypt = require('bcryptjs');
const { createCoreController } = require('@strapi/strapi').factories;

/**
 * business controller
 */

module.exports = createCoreController('api::business.business', ({ strapi }) => ({
  
  async find(ctx) {
    try {
      const { query } = ctx;
      
      // Use the default strapi find method but ensure we get all the fields
      const result = await strapi.entityService.findMany('api::business.business', {
        ...query,
        populate: query.populate || [],
      });
      
      // Return the results in the standard format
      return { data: result };
    } catch (error) {
      console.error('Error in find:', error);
      ctx.throw(500, `Error finding businesses: ${error.message}`);
    }
  },

  async create(ctx) {
    try {
      const { data } = ctx.request.body;
      
      // Hash password if provided
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      const business = await strapi.entityService.create('api::business.business', {
        data,
      });

      return business;
    } catch (error) {
      ctx.throw(500, `Error creating business: ${error.message}`);
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

      const business = await strapi.entityService.update('api::business.business', id, {
        data,
      });

      return business;
    } catch (error) {
      ctx.throw(500, `Error updating business: ${error.message}`);
    }
  },

  async getOverallStats(ctx) {
    try {
      const totalBusinesses = await strapi.entityService.count('api::business.business');
      const verifiedBusinesses = await strapi.entityService.count('api::business.business', {
        filters: { isVerified: true }
      });

      return {
        totalBusinesses,
        verifiedBusinesses
      };
    } catch (error) {
      ctx.throw(500, `Error getting business stats: ${error.message}`);
    }
  },

  async getStats(ctx) {
    try {
      const { id } = ctx.params;
      
      // Use the service to get business statistics
      const stats = await strapi.service('api::business.business').getBusinessStats(id);
      
      return ctx.send({
        data: stats
      });
    } catch (error) {
      ctx.throw(500, `Error fetching business stats: ${error.message}`);
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      console.log('🔍 Business findOne called with ID:', id);
      console.log('🔍 ID type:', typeof id);
      console.log('🔍 Params object:', ctx.params);
      
      const business = await strapi.entityService.findOne('api::business.business', id);
      console.log('📡 Business found:', business ? 'YES' : 'NO');
      console.log('👤 Business data keys:', business ? Object.keys(business) : 'N/A');
      
      if (!business) {
        console.log('❌ Business not found with ID:', id);
        return ctx.notFound('Business not found');
      }

      // Remove password from response
      const { password, ...businessData } = business;
      console.log('✅ Returning business data for:', businessData.businessName);
      
      return ctx.send({
        data: businessData
      });
    } catch (error) {
      console.error('❌ Error in business findOne:', error);
      ctx.throw(500, `Error fetching business: ${error.message}`);
    }
  },
}));
