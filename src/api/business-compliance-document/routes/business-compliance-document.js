// @ts-nocheck
'use strict';

/**
 * business-compliance-document router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Create the default router
const defaultRouter = createCoreRouter('api::business-compliance-document.business-compliance-document');

// Custom routes for business compliance documents
const customRoutes = {
  routes: [
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
    }
  ]
};

module.exports = customRoutes;
