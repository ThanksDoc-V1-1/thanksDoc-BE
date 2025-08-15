'use strict';

/**
 * professional-reference-submission router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Create the default router for CRUD operations  
const defaultRouter = createCoreRouter('api::professional-reference-submission.professional-reference-submission');

// Export the default router to enable basic CRUD operations
module.exports = defaultRouter;
