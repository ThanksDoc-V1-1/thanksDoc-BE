'use strict';

/**
 * professional-reference-submission router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Custom routes for professional reference submissions
const customRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/professional-reference-submissions/token/:token',
      handler: 'professional-reference-submission.findByToken',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Public access for external references
        description: 'Get reference submission by token',
        tags: ['Professional Reference Submissions']
      },
    },
    {
      method: 'POST',
      path: '/professional-reference-submissions/token/:token/submit',
      handler: 'professional-reference-submission.submitReference',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Public access for external references
        description: 'Submit reference form',
        tags: ['Professional Reference Submissions']
      },
    },
    {
      method: 'GET',
      path: '/professional-reference-submissions/doctor/:doctorId',
      handler: 'professional-reference-submission.getSubmissionsByDoctor',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
        description: 'Get all reference submissions for a doctor',
        tags: ['Professional Reference Submissions']
      },
    }
  ]
};

module.exports = customRoutes;
