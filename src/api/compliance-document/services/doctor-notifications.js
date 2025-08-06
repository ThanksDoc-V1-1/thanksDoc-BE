'use strict';

/**
 * Doctor Notification Service
 * Generates notifications for doctors based on their verification status and compliance documents
 */

module.exports = () => ({

  /**
   * Get all notifications for a doctor
   */
  async getDoctorNotifications(doctorId) {
    try {
      console.log(`🔔 Getting notifications for doctor ${doctorId}...`);

      const notifications = [];

      // Get doctor information
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      if (!doctor) {
        return { success: false, error: 'Doctor not found' };
      }

      // Get doctor's compliance documents
      const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          doctor: doctorId
        },
        sort: 'updatedAt:desc'
      });

      // Check verification status changes
      await this.checkVerificationStatusNotifications(doctor, notifications);

      // Check document-specific notifications
      await this.checkDocumentNotifications(documents, notifications);

      // Check expiring documents
      await this.checkExpiringDocuments(documents, notifications);

      // Sort notifications by priority and date
      notifications.sort((a, b) => {
        // Priority order: error > warning > success > info
        const priorityOrder = { error: 4, warning: 3, success: 2, info: 1 };
        const priorityDiff = priorityOrder[b.type] - priorityOrder[a.type];
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by date (newest first)
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      console.log(`📋 Generated ${notifications.length} notifications for doctor ${doctorId}`);

      return {
        success: true,
        data: {
          doctorId,
          doctorName: `${doctor.firstName} ${doctor.lastName}`,
          isVerified: doctor.isVerified,
          verificationStatusReason: doctor.verificationStatusReason,
          verificationStatusUpdatedAt: doctor.verificationStatusUpdatedAt,
          totalNotifications: notifications.length,
          unreadCount: notifications.filter(n => !n.read).length,
          notifications
        }
      };

    } catch (error) {
      console.error('Error getting doctor notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check for verification status notifications
   */
  async checkVerificationStatusNotifications(doctor, notifications) {
    const now = new Date();
    const statusUpdatedAt = doctor.verificationStatusUpdatedAt ? new Date(doctor.verificationStatusUpdatedAt) : null;
    
    // Only show recent status changes (within last 7 days)
    const isRecentUpdate = statusUpdatedAt && (now - statusUpdatedAt) < (7 * 24 * 60 * 60 * 1000);

    if (doctor.isVerified) {
      // Doctor is verified
      if (isRecentUpdate) {
        notifications.push({
          id: `verification-success-${doctor.id}`,
          type: 'success',
          title: 'Account Verified Successfully!',
          message: 'Congratulations! Your medical credentials have been verified. You can now accept patient appointments.',
          timestamp: statusUpdatedAt,
          read: false,
          actionRequired: false,
          category: 'verification',
          icon: 'CheckCircle'
        });
      }
    } else {
      // Doctor is not verified
      const reason = doctor.verificationStatusReason || 'Verification pending';
      
      if (reason.includes('No compliance documents')) {
        notifications.push({
          id: `verification-no-docs-${doctor.id}`,
          type: 'warning',
          title: 'Upload Required Documents',
          message: 'Please upload your compliance documents to start the verification process.',
          timestamp: statusUpdatedAt || now,
          read: false,
          actionRequired: true,
          category: 'verification',
          icon: 'AlertTriangle',
          actionText: 'Upload Documents',
          actionUrl: '/doctor/compliance'
        });
      } else if (reason.includes('pending')) {
        notifications.push({
          id: `verification-pending-${doctor.id}`,
          type: 'info',
          title: 'Verification Under Review',
          message: 'Your documents are being reviewed by our compliance team. We\'ll notify you once the review is complete.',
          timestamp: statusUpdatedAt || now,
          read: false,
          actionRequired: false,
          category: 'verification',
          icon: 'Clock'
        });
      } else if (reason.includes('rejected') || reason.includes('expired')) {
        notifications.push({
          id: `verification-issues-${doctor.id}`,
          type: 'error',
          title: 'Action Required: Document Issues',
          message: `Verification failed: ${reason}. Please review and update your documents.`,
          timestamp: statusUpdatedAt || now,
          read: false,
          actionRequired: true,
          category: 'verification',
          icon: 'XCircle',
          actionText: 'Review Documents',
          actionUrl: '/doctor/compliance'
        });
      }
    }
  },

  /**
   * Check for document-specific notifications
   */
  async checkDocumentNotifications(documents, notifications) {
    const recentlyUpdated = documents.filter(doc => {
      const updatedAt = new Date(doc.updatedAt);
      const now = new Date();
      return (now - updatedAt) < (7 * 24 * 60 * 60 * 1000); // Last 7 days
    });

    for (const doc of recentlyUpdated) {
      const docName = doc.documentType || `Document ${doc.id}`;
      
      if (doc.verificationStatus === 'verified') {
        notifications.push({
          id: `doc-verified-${doc.id}`,
          type: 'success',
          title: 'Document Verified',
          message: `Your ${docName} has been verified and approved.`,
          timestamp: new Date(doc.updatedAt),
          read: false,
          actionRequired: false,
          category: 'document',
          icon: 'CheckCircle',
          documentId: doc.id,
          documentType: docName
        });
      } else if (doc.verificationStatus === 'rejected') {
        notifications.push({
          id: `doc-rejected-${doc.id}`,
          type: 'error',
          title: 'Document Rejected',
          message: `Your ${docName} was rejected. ${doc.verificationNotes || 'Please review and resubmit.'}`,
          timestamp: new Date(doc.updatedAt),
          read: false,
          actionRequired: true,
          category: 'document',
          icon: 'XCircle',
          actionText: 'View Details',
          actionUrl: '/doctor/compliance',
          documentId: doc.id,
          documentType: docName
        });
      }
    }
  },

  /**
   * Check for expiring documents
   */
  async checkExpiringDocuments(documents, notifications) {
    const now = new Date();
    
    for (const doc of documents) {
      if (doc.autoExpiry && doc.expiryDate) {
        const expiryDate = new Date(doc.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        const docName = doc.documentType || `Document ${doc.id}`;

        if (daysUntilExpiry < 0) {
          // Document has expired
          notifications.push({
            id: `doc-expired-${doc.id}`,
            type: 'error',
            title: 'Document Expired',
            message: `Your ${docName} expired ${Math.abs(daysUntilExpiry)} day(s) ago. Please renew immediately.`,
            timestamp: expiryDate,
            read: false,
            actionRequired: true,
            category: 'expiry',
            icon: 'AlertTriangle',
            actionText: 'Renew Document',
            actionUrl: '/doctor/compliance',
            documentId: doc.id,
            documentType: docName,
            expiryDate: doc.expiryDate
          });
        } else if (daysUntilExpiry <= 30) {
          // Document expiring soon
          const urgency = daysUntilExpiry <= 7 ? 'error' : 'warning';
          notifications.push({
            id: `doc-expiring-${doc.id}`,
            type: urgency,
            title: 'Document Expiring Soon',
            message: `Your ${docName} will expire in ${daysUntilExpiry} day(s). Please renew before ${expiryDate.toLocaleDateString()}.`,
            timestamp: now,
            read: false,
            actionRequired: true,
            category: 'expiry',
            icon: 'Clock',
            actionText: 'Renew Document',
            actionUrl: '/doctor/compliance',
            documentId: doc.id,
            documentType: docName,
            expiryDate: doc.expiryDate,
            daysUntilExpiry
          });
        }
      }
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(doctorId, notificationId) {
    try {
      // In a real implementation, you'd store notification read status in the database
      // For now, we'll just return success
      console.log(`📖 Marked notification ${notificationId} as read for doctor ${doctorId}`);
      
      return {
        success: true,
        data: {
          notificationId,
          doctorId,
          markedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark all notifications as read for a doctor
   */
  async markAllNotificationsAsRead(doctorId) {
    try {
      console.log(`📖 Marked all notifications as read for doctor ${doctorId}`);
      
      return {
        success: true,
        data: {
          doctorId,
          markedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get notification summary/count for a doctor
   */
  async getDoctorNotificationSummary(doctorId) {
    try {
      const result = await this.getDoctorNotifications(doctorId);
      
      if (!result.success) {
        return result;
      }

      const notifications = result.data.notifications;
      
      return {
        success: true,
        data: {
          doctorId,
          totalCount: notifications.length,
          unreadCount: notifications.filter(n => !n.read).length,
          errorCount: notifications.filter(n => n.type === 'error').length,
          warningCount: notifications.filter(n => n.type === 'warning').length,
          successCount: notifications.filter(n => n.type === 'success').length,
          infoCount: notifications.filter(n => n.type === 'info').length,
          actionRequiredCount: notifications.filter(n => n.actionRequired).length,
          hasUrgentNotifications: notifications.some(n => n.type === 'error' && n.actionRequired)
        }
      };
    } catch (error) {
      console.error('Error getting notification summary:', error);
      return { success: false, error: error.message };
    }
  }

});
