'use strict';

/**
 * Admin Notification Service
 * Generates notifications for admins about compliance document activities
 */

module.exports = () => ({

  /**
   * Get all notifications for admin
   */
  async getAdminNotifications() {
    try {
      console.log('🔔 Getting admin notifications...');

      const notifications = [];

      // Check for recent document uploads (last 30 days)
      await this.checkRecentDocumentUploads(notifications);

      // Check for documents needing review
      await this.checkDocumentsNeedingReview(notifications);

      // Check for expired documents
      await this.checkExpiredDocuments(notifications);

      // Check for expiring documents (within 7 days)
      await this.checkExpiringDocuments(notifications);

      // Check for rejected documents that need follow-up
      await this.checkRejectedDocuments(notifications);

      // Check for doctors with incomplete compliance
      await this.checkIncompleteCompliance(notifications);

      // Sort notifications by priority and date
      notifications.sort((a, b) => {
        // Priority order: error > warning > success > info
        const priorityOrder = { error: 4, warning: 3, success: 2, info: 1 };
        const priorityDiff = priorityOrder[b.type] - priorityOrder[a.type];
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by date (newest first)
        // @ts-ignore
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      console.log(`📋 Generated ${notifications.length} admin notifications`);

      return {
        success: true,
        data: {
          notifications,
          totalCount: notifications.length,
          unreadCount: notifications.filter(n => !n.read).length
        }
      };

    } catch (error) {
      console.error('Error getting admin notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check for recent document uploads
   */
  async checkRecentDocumentUploads(notifications) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get recent uploads
      const recentUploads = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          createdAt: {
            $gte: sevenDaysAgo.toISOString()
          }
        },
        populate: ['doctor'],
        sort: 'createdAt:desc',
        limit: 50
      });

      console.log(`📁 Found ${recentUploads.length} recent document uploads`);

      // Group by doctor and document type for better notifications
      const uploadsByDoctor = {};
      for (const upload of recentUploads) {
        if (!upload.doctor) continue;
        
        const doctorKey = upload.doctor.id;
        if (!uploadsByDoctor[doctorKey]) {
          uploadsByDoctor[doctorKey] = {
            doctor: upload.doctor,
            uploads: []
          };
        }
        uploadsByDoctor[doctorKey].uploads.push(upload);
      }

      // Create notifications for each doctor's uploads
      for (const [doctorId, data] of Object.entries(uploadsByDoctor)) {
        const { doctor, uploads } = data;
        const doctorName = `${doctor.firstName} ${doctor.lastName}`;
        
        if (uploads.length === 1) {
          const upload = uploads[0];
          notifications.push({
                        id: `admin-upload-${upload.id}`,
            type: 'info',
            title: 'New Document Upload',
            message: `${doctorName} uploaded ${upload.documentName || upload.documentType}`,
            timestamp: new Date(upload.createdAt),
            read: false,
            actionRequired: upload.verificationStatus !== 'verified',
            category: 'upload',
            icon: 'FileText',
            actionText: 'Review Document',
            actionUrl: `/admin/dashboard?tab=doctors&search=${encodeURIComponent(doctorName)}&focus=${doctorId}`,
            doctorId: doctor.id,
            doctorName,
            documentId: upload.id,
            documentType: upload.documentType
          });
        } else {
          // Multiple uploads from same doctor
          notifications.push({
            id: `admin-uploads-${doctorId}-${Date.now()}`,
            type: 'info',
            title: 'Multiple Documents Uploaded',
            message: `${doctorName} uploaded ${uploads.length} documents`,
            timestamp: new Date(uploads[0].createdAt),
            read: false,
            actionRequired: uploads.some(u => u.verificationStatus !== 'verified'),
            category: 'upload',
            icon: 'FileText',
            actionText: 'Review Documents',
            actionUrl: `/admin/dashboard?tab=doctors&search=${encodeURIComponent(doctorName)}&focus=${doctorId}`,
            doctorId: doctor.id,
            doctorName,
            uploadCount: uploads.length
          });
        }
      }

    } catch (error) {
      console.error('Error checking recent uploads:', error);
    }
  },

  /**
   * Check for documents needing review
   */
  async checkDocumentsNeedingReview(notifications) {
    try {
      // Get documents that are uploaded but not yet reviewed
      const pendingReview = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          $or: [
            { verificationStatus: 'pending' },
            { verificationStatus: { $null: true } }
          ],
          status: 'uploaded'
        },
        populate: ['doctor'],
        sort: 'createdAt:asc',
        limit: -1
      });

      console.log(`📋 Found ${pendingReview.length} documents needing review`);

      // Group by urgency (how long they've been waiting)
      const now = new Date();
      const urgent = [];
      const normal = [];

      for (const doc of pendingReview) {
        if (!doc.doctor) continue;
        
        const uploadedAt = new Date(doc.createdAt);
        // @ts-ignore
        const daysWaiting = Math.floor((now - uploadedAt) / (1000 * 60 * 60 * 24));
        
        if (daysWaiting >= 3) {
          urgent.push({ ...doc, daysWaiting });
        } else {
          normal.push({ ...doc, daysWaiting });
        }
      }

      // Create urgent notifications
      for (const doc of urgent) {
        const doctorName = `${doc.doctor.firstName} ${doc.doctor.lastName}`;
        notifications.push({
          id: `admin-urgent-review-${doc.id}`,
          type: 'error',
          title: 'Urgent: Document Review Required',
          message: `${doctorName}'s ${doc.documentName || doc.documentType} has been waiting ${doc.daysWaiting} days for review`,
          timestamp: new Date(doc.createdAt),
          read: false,
          actionRequired: true,
          category: 'review',
          icon: 'AlertTriangle',
          actionText: 'Review Now',
          actionUrl: `/admin/dashboard?tab=doctors&search=${encodeURIComponent(doctorName)}&focus=${doc.doctor.id}`,
          doctorId: doc.doctor.id,
          doctorName,
          documentId: doc.id,
          documentType: doc.documentType,
          daysWaiting: doc.daysWaiting
        });
      }

      // Create summary notification for normal pending reviews
      if (normal.length > 0) {
        notifications.push({
          id: `admin-pending-reviews-${Date.now()}`,
          type: 'warning',
          title: 'Documents Awaiting Review',
          message: `${normal.length} document(s) pending review from ${[...new Set(normal.map(d => d.doctor.id))].length} doctor(s)`,
          timestamp: now,
          read: false,
          actionRequired: true,
          category: 'review',
          icon: 'Clock',
          actionText: 'Review Documents',
          actionUrl: '/admin/dashboard?tab=doctors',
          pendingCount: normal.length
        });
      }

    } catch (error) {
      console.error('Error checking documents needing review:', error);
    }
  },

  /**
   * Check for expired documents
   */
  async checkExpiredDocuments(notifications) {
    try {
      const today = new Date();
      
      // Get expired documents
      const expiredDocs = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          autoExpiry: true,
          expiryDate: {
            $lt: today.toISOString().split('T')[0]
          },
          status: {
            $ne: 'expired'
          }
        },
        populate: ['doctor'],
        sort: 'expiryDate:asc',
        limit: -1
      });

      console.log(`⚠️ Found ${expiredDocs.length} expired documents`);

      // Group by doctor
      const expiredByDoctor = {};
      for (const doc of expiredDocs) {
        if (!doc.doctor) continue;
        
        const doctorKey = doc.doctor.id;
        if (!expiredByDoctor[doctorKey]) {
          expiredByDoctor[doctorKey] = {
            doctor: doc.doctor,
            expiredDocs: []
          };
        }
        expiredByDoctor[doctorKey].expiredDocs.push(doc);
      }

      // Create notifications for each doctor with expired documents
      for (const [doctorId, data] of Object.entries(expiredByDoctor)) {
        const { doctor, expiredDocs } = data;
        const doctorName = `${doctor.firstName} ${doctor.lastName}`;
        
        if (expiredDocs.length === 1) {
          const doc = expiredDocs[0];
          // @ts-ignore
          const daysExpired = Math.floor((today - new Date(doc.expiryDate)) / (1000 * 60 * 60 * 24));
          
          notifications.push({
            id: `admin-expired-${doc.id}`,
            type: 'error',
            title: 'Document Expired',
            message: `${doctorName}'s ${doc.documentName || doc.documentType} expired ${daysExpired} day(s) ago`,
            timestamp: new Date(doc.expiryDate),
            read: false,
            actionRequired: true,
            category: 'expired',
            icon: 'XCircle',
            actionText: 'Contact Doctor',
            actionUrl: `/admin/dashboard?tab=doctors&search=${encodeURIComponent(doctorName)}&focus=${doctorId}`,
            doctorId: doctor.id,
            doctorName,
            documentId: doc.id,
            documentType: doc.documentType,
            daysExpired
          });
        } else {
          // Multiple expired documents
          notifications.push({
            id: `admin-expired-multiple-${doctorId}`,
            type: 'error',
            title: 'Multiple Documents Expired',
            message: `${doctorName} has ${expiredDocs.length} expired documents`,
            timestamp: new Date(Math.min(...expiredDocs.map(d => new Date(d.expiryDate)))),
            read: false,
            actionRequired: true,
            category: 'expired',
            icon: 'XCircle',
            actionText: 'View Details',
            actionUrl: `/admin/dashboard?tab=doctors&search=${encodeURIComponent(doctorName)}&focus=${doctorId}`,
            doctorId: doctor.id,
            doctorName,
            expiredCount: expiredDocs.length
          });
        }
      }

    } catch (error) {
      console.error('Error checking expired documents:', error);
    }
  },

  /**
   * Check for expiring documents (within next 7 days)
   */
  async checkExpiringDocuments(notifications) {
    try {
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      
      // Get documents expiring soon
      const expiringDocs = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          autoExpiry: true,
          expiryDate: {
            $gte: today.toISOString().split('T')[0],
            $lte: sevenDaysFromNow.toISOString().split('T')[0]
          },
          status: {
            $ne: 'expired'
          }
        },
        populate: ['doctor'],
        sort: 'expiryDate:asc',
        limit: -1
      });

      console.log(`⏰ Found ${expiringDocs.length} documents expiring soon`);

      // Group by urgency
      const urgent = []; // Expiring in 1-2 days
      const warning = []; // Expiring in 3-7 days

      for (const doc of expiringDocs) {
        if (!doc.doctor) continue;
        
        const expiryDate = new Date(doc.expiryDate);
        // @ts-ignore
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 2) {
          urgent.push({ ...doc, daysUntilExpiry });
        } else {
          warning.push({ ...doc, daysUntilExpiry });
        }
      }

      // Create urgent notifications (expiring in 1-2 days)
      for (const doc of urgent) {
        const doctorName = `${doc.doctor.firstName} ${doc.doctor.lastName}`;
        notifications.push({
          id: `admin-urgent-expiring-${doc.id}`,
          type: 'error',
          title: 'Document Expiring Soon',
          message: `${doctorName}'s ${doc.documentName || doc.documentType} expires in ${doc.daysUntilExpiry} day(s)`,
          timestamp: new Date(doc.expiryDate),
          read: false,
          actionRequired: true,
          category: 'expiring',
          icon: 'AlertTriangle',
          actionText: 'Notify Doctor',
          actionUrl: `/admin/dashboard?tab=doctors&search=${encodeURIComponent(doctorName)}&focus=${doc.doctor.id}`,
          doctorId: doc.doctor.id,
          doctorName,
          documentId: doc.id,
          documentType: doc.documentType,
          daysUntilExpiry: doc.daysUntilExpiry
        });
      }

      // Create summary notification for warning level (3-7 days)
      if (warning.length > 0) {
        notifications.push({
          id: `admin-expiring-warning-${Date.now()}`,
          type: 'warning',
          title: 'Documents Expiring This Week',
          message: `${warning.length} document(s) expiring in the next 7 days`,
          timestamp: new Date(),
          read: false,
          actionRequired: false,
          category: 'expiring',
          icon: 'Clock',
          actionText: 'View Details',
          actionUrl: '/admin/dashboard?tab=doctors',
          expiringCount: warning.length
        });
      }

    } catch (error) {
      console.error('Error checking expiring documents:', error);
    }
  },

  /**
   * Check for rejected documents needing follow-up
   */
  async checkRejectedDocuments(notifications) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get recently rejected documents
      const rejectedDocs = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          verificationStatus: 'rejected',
          updatedAt: {
            $gte: sevenDaysAgo.toISOString()
          }
        },
        populate: ['doctor'],
        sort: 'updatedAt:desc',
        limit: -1
      });

      console.log(`❌ Found ${rejectedDocs.length} recently rejected documents`);

      // Group by doctor
      const rejectedByDoctor = {};
      for (const doc of rejectedDocs) {
        if (!doc.doctor) continue;
        
        const doctorKey = doc.doctor.id;
        if (!rejectedByDoctor[doctorKey]) {
          rejectedByDoctor[doctorKey] = {
            doctor: doc.doctor,
            rejectedDocs: []
          };
        }
        rejectedByDoctor[doctorKey].rejectedDocs.push(doc);
      }

      // Create notifications for follow-up
      for (const [doctorId, data] of Object.entries(rejectedByDoctor)) {
        const { doctor, rejectedDocs } = data;
        const doctorName = `${doctor.firstName} ${doctor.lastName}`;
        
        notifications.push({
          id: `admin-rejected-followup-${doctorId}`,
          type: 'warning',
          title: 'Rejected Documents Need Follow-up',
          message: `${doctorName} has ${rejectedDocs.length} rejected document(s) that may need follow-up`,
          timestamp: new Date(rejectedDocs[0].updatedAt),
          read: false,
          actionRequired: false,
          category: 'rejected',
          icon: 'AlertTriangle',
          actionText: 'Check Status',
          actionUrl: `/admin/dashboard?tab=doctors&search=${encodeURIComponent(doctorName)}&focus=${doctorId}`,
          doctorId: doctor.id,
          doctorName,
          rejectedCount: rejectedDocs.length
        });
      }

    } catch (error) {
      console.error('Error checking rejected documents:', error);
    }
  },

  /**
   * Check for doctors with incomplete compliance
   */
  async checkIncompleteCompliance(notifications) {
    try {
      // Get all doctors
      const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
        limit: -1
      });

      console.log(`👥 Checking compliance for ${doctors.length} doctors`);

      const incompleteCompliance = [];

      for (const doctor of doctors) {
        try {
          // Get doctor's documents
          const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
            filters: {
              doctor: doctor.id
            }
          });

          // Check if doctor has documents but is not verified
          if (documents.length > 0 && !doctor.isVerified) {
            const totalDocs = documents.length;
            const verifiedDocs = documents.filter(d => d.verificationStatus === 'verified').length;
            const pendingDocs = documents.filter(d => !d.verificationStatus || d.verificationStatus === 'pending').length;
            const rejectedDocs = documents.filter(d => d.verificationStatus === 'rejected').length;
            const expiredDocs = documents.filter(d => d.status === 'expired').length;

            if (pendingDocs > 0 || rejectedDocs > 0 || expiredDocs > 0) {
              incompleteCompliance.push({
                doctor,
                totalDocs,
                verifiedDocs,
                pendingDocs,
                rejectedDocs,
                expiredDocs
              });
            }
          }
        } catch (error) {
          console.error(`Error checking compliance for doctor ${doctor.id}:`, error);
        }
      }

      console.log(`📊 Found ${incompleteCompliance.length} doctors with incomplete compliance`);

      // Create notifications for doctors with issues
      for (const data of incompleteCompliance.slice(0, 10)) { // Limit to top 10 to avoid spam
        const { doctor, totalDocs, verifiedDocs, pendingDocs, rejectedDocs, expiredDocs } = data;
        const doctorName = `${doctor.firstName} ${doctor.lastName}`;
        
        let issues = [];
        if (pendingDocs > 0) issues.push(`${pendingDocs} pending review`);
        if (rejectedDocs > 0) issues.push(`${rejectedDocs} rejected`);
        if (expiredDocs > 0) issues.push(`${expiredDocs} expired`);

        notifications.push({
          id: `admin-incomplete-${doctor.id}`,
          type: 'warning',
          title: 'Incomplete Compliance Profile',
          message: `${doctorName}: ${verifiedDocs}/${totalDocs} documents verified (${issues.join(', ')})`,
          timestamp: new Date(),
          read: false,
          actionRequired: true,
          category: 'compliance',
          icon: 'AlertTriangle',
          actionText: 'Review Profile',
          actionUrl: `/admin/dashboard?tab=doctors&search=${encodeURIComponent(doctorName)}&focus=${doctor.id}`,
          doctorId: doctor.id,
          doctorName,
          complianceStatus: {
            totalDocs,
            verifiedDocs,
            pendingDocs,
            rejectedDocs,
            expiredDocs
          }
        });
      }

    } catch (error) {
      console.error('Error checking incomplete compliance:', error);
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId) {
    try {
      // In a real implementation, you'd store notification read status in the database
      // For now, we'll just return success
      console.log(`📖 Marked admin notification ${notificationId} as read`);
      
      return {
        success: true,
        data: {
          notificationId,
          markedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error marking admin notification as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark all notifications as read for admin
   */
  async markAllNotificationsAsRead() {
    try {
      console.log('📖 Marked all admin notifications as read');
      
      return {
        success: true,
        data: {
          markedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error marking all admin notifications as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get notification summary/count for admin
   */
  async getAdminNotificationSummary() {
    try {
      const result = await this.getAdminNotifications();
      
      if (!result.success) {
        return result;
      }

      const notifications = result.data.notifications;
      
      return {
        success: true,
        data: {
          totalCount: notifications.length,
          unreadCount: notifications.filter(n => !n.read).length,
          errorCount: notifications.filter(n => n.type === 'error').length,
          warningCount: notifications.filter(n => n.type === 'warning').length,
          successCount: notifications.filter(n => n.type === 'success').length,
          infoCount: notifications.filter(n => n.type === 'info').length,
          actionRequiredCount: notifications.filter(n => n.actionRequired).length,
          hasUrgentNotifications: notifications.some(n => n.type === 'error' && n.actionRequired),
          categories: {
            upload: notifications.filter(n => n.category === 'upload').length,
            review: notifications.filter(n => n.category === 'review').length,
            expired: notifications.filter(n => n.category === 'expired').length,
            expiring: notifications.filter(n => n.category === 'expiring').length,
            rejected: notifications.filter(n => n.category === 'rejected').length,
            compliance: notifications.filter(n => n.category === 'compliance').length
          }
        }
      };

    } catch (error) {
      console.error('Error getting admin notification summary:', error);
      return { success: false, error: error.message };
    }
  }

});
