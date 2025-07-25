'use strict';

/**
 * Custom service routes
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/services/:serviceId/doctors',
      handler: 'service.findDoctorsByService',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/services/category/:category',
      handler: 'service.findByCategory',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
