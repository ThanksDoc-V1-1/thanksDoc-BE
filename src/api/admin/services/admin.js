'use strict';

/**
 * admin service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const bcrypt = require('bcryptjs');

module.exports = createCoreService('api::admin.admin', ({ strapi }) => ({
  async ensureDefaultAdmin() {
    const adminEmail = 'admin@gmail.com';
    
    // Check if admin exists
    const existingAdmin = await strapi.entityService.findMany('api::admin.admin', {
      filters: { email: adminEmail },
      limit: 1,
    });
    
    if (existingAdmin.length === 0) {
      // Create default admin if none exists
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await strapi.entityService.create('api::admin.admin', {
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin User',
          firstName: 'Admin',
          lastName: 'User',
          isActive: true,
          role: 'admin',
          publishedAt: new Date()
        },
      });
      
      ('✅ Default admin created with email:', adminEmail);
    }
  },
}));
