'use strict';

/**
 * compliance-document-type service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::compliance-document-type.compliance-document-type', ({ strapi }) => ({
  // Add custom service methods here if needed
  
  async findByKey(key) {
    return await strapi.entityService.findMany('api::compliance-document-type.compliance-document-type', {
      filters: { key }
    });
  },
  
  async getActiveTypes() {
    return await strapi.entityService.findMany('api::compliance-document-type.compliance-document-type', {
      filters: { isActive: true },
      sort: { displayOrder: 'asc' }
    });
  }
}));
