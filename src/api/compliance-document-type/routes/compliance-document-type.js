'use strict';

/**
 * compliance-document-type router
 */

module.exports = {
  routes: [
    // Custom routes first
    {
      method: 'POST',
      path: '/compliance-document-types/enable-auto-expiry',
      handler: 'compliance-document-type.enableAutoExpiry',
      config: {
        auth: false, // Set to true if authentication is required
      },
    },
    // Default CRUD routes
    {
      method: 'GET',
      path: '/compliance-document-types',
      handler: 'compliance-document-type.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/compliance-document-types/:id',
      handler: 'compliance-document-type.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/compliance-document-types',
      handler: 'compliance-document-type.create',
    },
    {
      method: 'PUT',
      path: '/compliance-document-types/:id',
      handler: 'compliance-document-type.update',
    },
    {
      method: 'DELETE',
      path: '/compliance-document-types/:id',
      handler: 'compliance-document-type.delete',
    },
  ],
};
