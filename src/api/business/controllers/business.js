// @ts-nocheck
'use strict';

const bcrypt = require('bcryptjs');
const { createCoreController } = require('@strapi/strapi').factories;

/**
 * business controller
 */

module.exports = createCoreController('api::business.business', ({ strapi }) => ({
  
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
}));
