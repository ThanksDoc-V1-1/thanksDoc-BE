/**
 * Document Expiry Cron Jobs Bootstrap
 * Sets up scheduled tasks for automatic document expiry tracking
 */

'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    console.log('🚀 Setting up document expiry cron jobs...');
    
    // Add health check endpoint for Railway
    strapi.server.routes([
      {
        method: 'GET',
        path: '/health',
        handler: async (ctx) => {
          ctx.body = { 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            service: 'ThanksDoc Backend',
            database: 'checking...'
          };
          
          try {
            // Test database connection
            await strapi.db.connection.raw('SELECT 1');
            ctx.body.database = 'connected';
          } catch (error) {
            ctx.body.database = 'disconnected';
            ctx.body.error = error.message;
          }
        },
      },
      {
        method: 'GET',
        path: '/',
        handler: async (ctx) => {
          ctx.body = { 
            message: 'ThanksDoc Backend API is running',
            status: 'healthy',
            timestamp: new Date().toISOString()
          };
        },
      }
    ]);

    // Seed business compliance document types if they don't exist
    try {
      console.log('🌱 Seeding business compliance document types...');
      
      const existingTypes = await strapi.entityService.findMany('api::business-compliance-document-type.business-compliance-document-type');
      
      if (existingTypes.length === 0) {
        const businessDocumentTypes = [
          {
            key: 'business-license',
            name: 'Business License',
            description: 'Valid business registration/license document',
            required: true,
            isActive: true,
            displayOrder: 1,
            category: 'registration',
            autoExpiry: true,
            validityYears: 1,
            expiryWarningDays: 30,
            acceptedFormats: '.pdf,.jpg,.jpeg,.png',
            examples: 'Business registration certificate, trading license'
          },
          {
            key: 'insurance-certificate',
            name: 'Insurance Certificate',
            description: 'Professional liability insurance certificate',
            required: true,
            isActive: true,
            displayOrder: 2,
            category: 'insurance',
            autoExpiry: true,
            validityYears: 1,
            expiryWarningDays: 30,
            acceptedFormats: '.pdf,.jpg,.jpeg,.png',
            examples: 'Professional indemnity insurance, public liability insurance'
          },
          {
            key: 'tax-certificate',
            name: 'Tax Registration Certificate',
            description: 'Tax registration or VAT certificate',
            required: true,
            isActive: true,
            displayOrder: 3,
            category: 'financial',
            autoExpiry: true,
            validityYears: 1,
            expiryWarningDays: 30,
            acceptedFormats: '.pdf,.jpg,.jpeg,.png',
            examples: 'VAT registration, tax identification certificate'
          },
          {
            key: 'health-safety-certificate',
            name: 'Health & Safety Certificate',
            description: 'Health and safety compliance certificate',
            required: true,
            isActive: true,
            displayOrder: 4,
            category: 'compliance',
            autoExpiry: true,
            validityYears: 1,
            expiryWarningDays: 30,
            acceptedFormats: '.pdf,.jpg,.jpeg,.png',
            examples: 'HSE compliance certificate, workplace safety certification'
          },
          {
            key: 'data-protection-certificate',
            name: 'Data Protection Certificate',
            description: 'GDPR/Data protection compliance certificate',
            required: true,
            isActive: true,
            displayOrder: 5,
            category: 'compliance',
            autoExpiry: true,
            validityYears: 1,
            expiryWarningDays: 30,
            acceptedFormats: '.pdf,.jpg,.jpeg,.png',
            examples: 'Data protection certification, GDPR compliance certificate'
          }
        ];

        for (const docType of businessDocumentTypes) {
          await strapi.entityService.create('api::business-compliance-document-type.business-compliance-document-type', {
            data: docType
          });
          console.log(`✅ Created business document type: ${docType.name}`);
        }

        console.log('✅ Business compliance document types seeded successfully');
      } else {
        console.log('📄 Business compliance document types already exist, skipping seed');
      }
    } catch (error) {
      console.error('❌ Error seeding business compliance document types:', error);
    }
    
    try {
      // Schedule the expiry status update job
      strapi.cron.add({
        '0 2 * * *': async () => {
          console.log('⏰ Running scheduled document expiry status update...');
          try {
            const result = await strapi.service('api::compliance-document.document-expiry-scheduler').updateDocumentExpiryStatuses();
            console.log('✅ Scheduled expiry update completed:', result);
          } catch (error) {
            console.error('❌ Error in scheduled expiry update:', error);
          }
        }
      });

      // Schedule an additional check every Monday at 9 AM for weekly reporting
      strapi.cron.add({
        '0 9 * * 1': async () => {
          console.log('📊 Running weekly document expiry report...');
          try {
            // Get documents expiring in the next 30 days
            const expiringDocs = await strapi.service('api::compliance-document.document-expiry-scheduler').getExpiringDocuments(30);
            // Get expired documents
            const expiredDocs = await strapi.service('api::compliance-document.document-expiry-scheduler').getExpiredDocuments();
            
            console.log(`📊 Weekly Expiry Report:`);
            console.log(`   - Documents expiring in next 30 days: ${expiringDocs.length}`);
            console.log(`   - Currently expired documents: ${expiredDocs.length}`);
            
            // Here you could send a weekly report email to admins
            // await emailService.sendWeeklyExpiryReport({ expiringDocs, expiredDocs });
            
          } catch (error) {
            console.error('❌ Error in weekly expiry report:', error);
          }
        }
      });

      console.log('✅ Document expiry cron jobs scheduled successfully');
      console.log('   - Daily status update: Every day at 2:00 AM');
      console.log('   - Weekly report: Every Monday at 9:00 AM');

    } catch (error) {
      console.error('❌ Error setting up document expiry cron jobs:', error);
    }
  },
};
