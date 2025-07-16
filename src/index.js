'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    // Register WhatsApp service - make it accessible globally
    const WhatsAppService = require('./services/whatsapp');
    const whatsappServiceInstance = new WhatsAppService();
    
    // Store original service method
    const originalService = strapi.service;
    
    // Override service method to handle our custom WhatsApp service
    strapi.service = function(serviceName) {
      if (serviceName === 'whatsapp') {
        return whatsappServiceInstance;
      }
      return originalService.call(this, serviceName);
    };
    
    console.log('✅ WhatsApp service registered successfully');
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    // Create default admin user if none exists
    setTimeout(async () => {
      try {
        // Wait a bit to ensure all services are registered
        await strapi.service('api::admin.admin').ensureDefaultAdmin();
        console.log('✅ Bootstrap process completed successfully');
      } catch (error) {
        console.error('❌ Error in bootstrap process:', error);
      }
    }, 3000);
  },
};
