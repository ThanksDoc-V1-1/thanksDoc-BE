'use strict';

/**
 * system-setting router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::system-setting.system-setting', {
  config: {
    find: {
      auth: false,
      middlewares: [],
    },
    findOne: {
      auth: false,
      middlewares: [],
    },
    create: {
      auth: false,
      middlewares: [],
    },
    update: {
      auth: false,
      middlewares: [],
    },
    delete: {
      auth: false,
      middlewares: [],
    },
  },
});
