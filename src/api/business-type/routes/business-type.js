'use strict';

/**
 * business-type router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::business-type.business-type', {
  config: {
    find: {
      auth: false, // Make this endpoint public so registration form can access it
    },
    findOne: {
      auth: false, // Allow public access to individual business types
    },
    create: {
      auth: false, // Allow creation (admin should be able to create)
    },
    update: {
      auth: false, // Allow updates (admin should be able to update)
    },
    delete: {
      auth: false, // Allow deletion (admin should be able to delete)
    }
  }
});
