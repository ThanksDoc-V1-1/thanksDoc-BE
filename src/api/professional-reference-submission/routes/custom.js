'use strict';

/**
 * Custom routes for professional-reference-submission
 * These routes will be loaded automatically by Strapi
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/professional-reference-submissions/token/:token',
      handler: 'professional-reference-submission.findByToken',
      config: {
        auth: false, // Public access for external references
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/professional-reference-submissions/token/:token/submit',
      handler: 'professional-reference-submission.submitReference',
      config: {
        auth: false, // Public access for external references
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/professional-reference-submissions/doctor/:doctorId',
      handler: 'professional-reference-submission.getSubmissionsByDoctor',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }
  ]
};
