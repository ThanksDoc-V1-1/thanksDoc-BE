// @ts-nocheck
'use strict';

/**
 * business-compliance-document router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    // Include all default CRUD routes
    {
      method: 'GET',
      path: '/business-compliance-documents',
      handler: 'business-compliance-document.find',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/business-compliance-documents/:id',
      handler: 'business-compliance-document.findOne',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/business-compliance-documents',
      handler: 'business-compliance-document.create',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/business-compliance-documents/:id',
      handler: 'business-compliance-document.update',
      config: { auth: false },
    },
    {
      method: 'DELETE',
      path: '/business-compliance-documents/:id',
      handler: 'business-compliance-document.delete',
      config: { auth: false },
    },
    // Custom routes
    {
      method: 'POST',
      path: '/business-compliance-documents/upload',
      handler: 'business-compliance-document.upload',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::file-upload'],
      },
    },
    {
      method: 'GET',
      path: '/business-compliance-documents/business/:businessId',
      handler: 'business-compliance-document.getBusinessDocuments',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/business-compliance-documents/:id/verify',
      handler: 'business-compliance-document.verifyDocument',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/business-compliance-documents/business/:businessId/overview',
      handler: 'business-compliance-document.getComplianceOverview',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/business-compliance-documents/update-expiry-statuses',
      handler: 'business-compliance-document.updateExpiryStatuses',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Business notification routes
    {
      method: 'GET',
      path: '/business-compliance-documents/business/:businessId/notifications',
      handler: 'business-compliance-document.getBusinessNotifications',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/business-compliance-documents/business/:businessId/notifications/summary',
      handler: 'business-compliance-document.getBusinessNotificationsSummary',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/business-compliance-documents/business/:businessId/notifications/:notificationId/read',
      handler: 'business-compliance-document.markBusinessNotificationAsRead',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/business-compliance-documents/business/:businessId/notifications/read-all',
      handler: 'business-compliance-document.markAllBusinessNotificationsAsRead',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }
  ]
};
