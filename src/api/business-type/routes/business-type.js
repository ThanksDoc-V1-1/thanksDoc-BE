'use strict';

/**
 * business-type router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::business-type.business-type', {
  config: {
    find: {
      auth: false, // Make this endpoint public so registration form can access it
    }
  }
});
