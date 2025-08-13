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

    // Schedule document expiry status updates to run every day at 2 AM
    const cronTime = '0 2 * * *'; // Every day at 2:00 AM
    
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
