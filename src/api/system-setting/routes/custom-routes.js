'use strict';

/**
 * Custom system-setting routes
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/system-settings/key/:key',
      handler: 'system-setting.findByKey',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/system-settings/key/:key',
      handler: 'system-setting.upsertByKey',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/system-settings/public',
      handler: 'system-setting.getPublicSettings',
      config: {
        auth: false, // No authentication required
        policies: [],
        middlewares: [],
      },
    },
  ],
};
