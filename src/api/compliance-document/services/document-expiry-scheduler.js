/**
 * Document Expiry Scheduler Service
 * Automatically updates document statuses based on expiry dates
 */

'use strict';

module.exports = ({ strapi }) => ({

  async updateDocumentExpiryStatuses() {
    console.log('🔄 Starting scheduled document expiry status update...');
    
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Get all documents with auto-expiry enabled
      const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          autoExpiry: true,
          expiryDate: {
            $notNull: true
          }
        },
        populate: ['doctor', 'documentType'],
        limit: -1
      });

      console.log(`📄 Found ${documents.length} documents with auto-expiry enabled`);

      let statusUpdated = 0;
      let notificationsToSend = [];

      for (const doc of documents) {
        try {
          const expiryDate = new Date(doc.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          let newStatus = doc.status;
          let sendNotification = false;

          // Determine new status based on expiry
          if (daysUntilExpiry < 0) {
            // Document has expired
            if (doc.status !== 'expired') {
              newStatus = 'expired';
              sendNotification = true;
            }
          } else if (daysUntilExpiry <= (doc.expiryWarningDays || 30)) {
            // Document is expiring soon
            if (doc.status !== 'expiring' && doc.status !== 'expired') {
              newStatus = 'expiring';
              sendNotification = true;
            }
          }

          // Update status if it has changed
          if (newStatus !== doc.status) {
            await strapi.entityService.update('api::compliance-document.compliance-document', doc.id, {
              data: {
                status: newStatus,
                lastStatusUpdate: new Date().toISOString()
              }
            });

            statusUpdated++;
            console.log(`📋 Updated ${doc.documentName} for doctor ${doc.doctor?.firstName} ${doc.doctor?.lastName} - Status: ${newStatus}`);

            // Queue notification
            if (sendNotification && doc.doctor) {
              notificationsToSend.push({
                doctorId: doc.doctor.id,
                doctorName: `${doc.doctor.firstName} ${doc.doctor.lastName}`,
                doctorEmail: doc.doctor.email,
                documentName: doc.documentName,
                status: newStatus,
                expiryDate: doc.expiryDate,
                daysUntilExpiry: daysUntilExpiry
              });
            }
          }

        } catch (error) {
          console.error(`❌ Error updating document ${doc.id}:`, error.message);
        }
      }

      // Send notifications (you can integrate with email service or notification system)
      if (notificationsToSend.length > 0) {
        console.log(`📧 Queuing ${notificationsToSend.length} expiry notifications`);
        await this.sendExpiryNotifications(notificationsToSend);
      }

      console.log(`✅ Document expiry status update completed:`);
      console.log(`   - Documents processed: ${documents.length}`);
      console.log(`   - Status updates: ${statusUpdated}`);
      console.log(`   - Notifications sent: ${notificationsToSend.length}`);

      return {
        documentsProcessed: documents.length,
        statusUpdated: statusUpdated,
        notificationsSent: notificationsToSend.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error in document expiry status update:', error);
      throw error;
    }
  },

  async sendExpiryNotifications(notifications) {
    console.log('📧 Sending expiry notifications...');
    
    for (const notification of notifications) {
      try {
        // Here you can integrate with your email service
        // For now, we'll just log the notifications
        console.log(`📧 Notification for ${notification.doctorName} (${notification.doctorEmail}):`);
        console.log(`   Document: ${notification.documentName}`);
        console.log(`   Status: ${notification.status}`);
        console.log(`   ${notification.status === 'expired' ? 'Expired on' : 'Expires on'}: ${notification.expiryDate}`);
        
        if (notification.status === 'expiring') {
          console.log(`   Days until expiry: ${notification.daysUntilExpiry}`);
        }

        // TODO: Integrate with actual email service (e.g., SendGrid, Nodemailer, etc.)
        // await emailService.sendExpiryNotification(notification);

      } catch (error) {
        console.error(`❌ Error sending notification to ${notification.doctorEmail}:`, error.message);
      }
    }
  },

  // Get documents expiring in the next N days
  async getExpiringDocuments(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
      filters: {
        autoExpiry: true,
        expiryDate: {
          $lte: futureDate.toISOString().split('T')[0],
          $gte: new Date().toISOString().split('T')[0]
        }
      },
      populate: ['doctor', 'documentType'],
      sort: 'expiryDate:asc'
    });

    return documents.map(doc => {
      const expiryDate = new Date(doc.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...doc,
        daysUntilExpiry
      };
    });
  },

  // Get expired documents
  async getExpiredDocuments() {
    const today = new Date().toISOString().split('T')[0];
    
    return await strapi.entityService.findMany('api::compliance-document.compliance-document', {
      filters: {
        autoExpiry: true,
        expiryDate: {
          $lt: today
        }
      },
      populate: ['doctor', 'documentType'],
      sort: 'expiryDate:desc'
    });
  }

});
