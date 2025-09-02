'use strict';

/**
 * Custom service routes
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/services/category/:category',
      handler: 'service.findByCategory',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/services/patient',
      handler: 'service.findPatientServices',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/services/business',
      handler: 'service.findBusinessServices',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/services/:serviceId/doctors',
      handler: 'service.findDoctorsByService',
      config: {
        auth: false,
      },
    },
  ],
};
