'use strict';

/**
 * service-request router
 */

module.exports = {
  routes: [
    // Default CRUD routes
    {
      method: 'GET',
      path: '/service-requests',
      handler: 'service-request.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/service-requests/stats',
      handler: 'service-request.getOverallStats',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/service-requests/:id',
      handler: 'service-request.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/service-requests',
      handler: 'service-request.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/service-requests/:id',
      handler: 'service-request.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/service-requests/:id',
      handler: 'service-request.delete',
      config: {
        auth: false,
      },
    },
    // Custom routes
    {
      method: 'POST',
      path: '/service-requests/find-nearby-doctors',
      handler: 'service-request.findNearbyDoctors',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/service-requests/create',
      handler: 'service-request.createServiceRequest',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/service-requests/direct',
      handler: 'service-request.createDirectRequest',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/service-requests/:id/accept',
      handler: 'service-request.acceptServiceRequest',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/service-requests/:id/reject',
      handler: 'service-request.rejectServiceRequest',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/service-requests/:id/complete',
      handler: 'service-request.completeServiceRequest',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/service-requests/:id/cancel',
      handler: 'service-request.cancelServiceRequest',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/service-requests/:id/payment',
      handler: 'service-request.processPayment',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/service-requests/doctor/:doctorId',
      handler: 'service-request.getDoctorRequests',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/service-requests/available/:doctorId',
      handler: 'service-request.getAvailableRequests',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/service-requests/business/:businessId',
      handler: 'service-request.getBusinessRequests',
      config: {
        auth: false,
      },
    },
  ],
};
