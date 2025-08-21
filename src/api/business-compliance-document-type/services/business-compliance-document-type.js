// @ts-nocheck
'use strict';

/**
 * business-compliance-document-type service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::business-compliance-document-type.business-compliance-document-type', ({ strapi }) => ({
  
  async findByKey(key) {
    return await strapi.entityService.findMany('api::business-compliance-document-type.business-compliance-document-type', {
      filters: { key }
    });
  },
  
  async getActiveTypes() {
    return await strapi.entityService.findMany('api::business-compliance-document-type.business-compliance-document-type', {
      filters: { isActive: true },
      sort: { displayOrder: 'asc', name: 'asc' }
    });
  },

  async getRequiredTypes() {
    return await strapi.entityService.findMany('api::business-compliance-document-type.business-compliance-document-type', {
      filters: { 
        isActive: true,
        required: true 
      },
      sort: { displayOrder: 'asc', name: 'asc' }
    });
  },

  async getCategorizedTypes() {
    const types = await this.getActiveTypes();
    
    const categorized = {};
    types.forEach(type => {
      const category = type.category || 'other';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(type);
    });
    
    return categorized;
  }
}));
