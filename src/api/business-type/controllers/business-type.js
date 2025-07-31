'use strict';

/**
 * business-type controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::business-type.business-type', ({ strapi }) => ({
  async find(ctx) {
    // Only return active business types, sorted by displayOrder
    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        isActive: true
      },
      sort: 'displayOrder:asc'
    };
    
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  }
}));
