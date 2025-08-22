'use strict';

/**
 * whatsapp router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/whatsapp/test-template',
      handler: 'whatsapp.testDoctorAcceptTemplate',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/whatsapp/test-connectivity',
      handler: 'whatsapp.testConnectivity',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
