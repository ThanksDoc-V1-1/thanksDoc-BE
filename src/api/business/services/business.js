// @ts-nocheck
'use strict';

/**
 * business service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::business.business', ({ strapi }) => ({
  // ...existing code...
  
  async getBusinessStats(businessId) {
    try {
      // Get business requests
      const requests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: {
          business: businessId
        }
      });

      // Calculate stats
      const totalRequests = requests.length;
      const activeRequests = requests.filter(req => req.status === 'pending' || req.status === 'accepted').length;
      const completedRequests = requests.filter(req => req.status === 'completed').length;
      const totalSpent = requests
        .filter(req => req.status === 'completed')
        .reduce((sum, req) => sum + (req.totalAmount || 0), 0);

      return {
        totalRequests,
        activeRequests,
        completedRequests,
        totalSpent
      };
    } catch (error) {
      console.error('Error fetching business stats:', error);
      throw error;
    }
  }
}));
