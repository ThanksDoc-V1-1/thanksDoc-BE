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
      method: 'POST',
      path: '/service-requests/create',
      handler: 'service-request.createServiceRequest',
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
    // WhatsApp integration routes
    {
      method: 'GET',
      path: '/service-requests/whatsapp-accept/:token',
      handler: 'service-request.whatsappAcceptRequest',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/service-requests/whatsapp-reject/:token',
      handler: 'service-request.whatsappRejectRequest',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/service-requests/whatsapp-webhook',
      handler: 'service-request.handleWhatsappWebhook',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/service-requests/whatsapp-webhook',
      handler: 'service-request.handleWhatsappWebhook',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/service-requests/test-whatsapp',
      handler: 'service-request.testWhatsappNotification',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/service-requests/test-interactive-whatsapp',
      handler: 'service-request.testInteractiveWhatsapp',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/service-requests/diagnose-whatsapp',
      handler: 'service-request.diagnoseWhatsappSetup',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/service-requests/:id/accept',
      handler: 'service-request.acceptServiceRequest',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/service-requests/admin/format-phone-numbers',
      handler: 'service-request.formatDoctorPhoneNumbers',
      config: {
        auth: false,
      },
    },
    // Deprecated endpoint - now handled by cron job
    {
      method: 'GET',
      path: '/service-requests/:id/fallback-status',
      handler: 'service-request.getFallbackStatus',
      config: {
        auth: false,
      },
    },
    // Transaction history endpoints
    {
      method: 'GET',
      path: '/service-requests/transaction-history',
      handler: 'service-request.getTransactionHistory',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/service-requests/doctor-earnings',
      handler: 'service-request.getDoctorEarnings',
      config: {
        auth: false,
      },
    },
  ],
};
