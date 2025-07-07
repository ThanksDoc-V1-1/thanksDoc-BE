// @ts-nocheck
'use strict';

/**
 * doctor service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::doctor.doctor', ({ strapi }) => ({
  // ...existing code...
  
  async getDoctorStats(doctorId) {
    try {
      // Get doctor requests
      const requests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: {
          doctor: doctorId
        }
      });

      // Calculate stats
      const totalRequests = requests.length;
      const activeRequests = requests.filter(req => req.status === 'pending' || req.status === 'accepted').length;
      const completedRequests = requests.filter(req => req.status === 'completed').length;
      const totalEarnings = requests
        .filter(req => req.status === 'completed')
        .reduce((sum, req) => sum + (req.totalAmount || 0), 0);

      return {
        totalRequests,
        activeRequests,
        completedRequests,
        totalEarnings
      };
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
      throw error;
    }
  }
}));
