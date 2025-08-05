'use strict';

/**
 * professional-reference router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Create the default router
const defaultRouter = createCoreRouter('api::professional-reference.professional-reference');

// Custom routes for professional references
const customRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/professional-references/doctor/:doctorId',
      handler: 'professional-reference.findByDoctor',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/professional-references/save',
      handler: 'professional-reference.saveReferences',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/professional-references/:id',
      handler: 'professional-reference.deleteReference',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ]
};

module.exports = customRoutes;
