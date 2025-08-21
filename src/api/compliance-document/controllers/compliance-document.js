'use strict';

/**
 * compliance-document controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::compliance-document.compliance-document', ({ strapi }) => ({
  
  // Upload compliance document
  async upload(ctx) {
    try {
      ('Upload request received:');
      ('Body:', ctx.request.body);
      ('Files:', ctx.request.files);
      
      const { doctorId, documentType, issueDate, expiryDate, notes } = ctx.request.body;
      const files = ctx.request.files;

      if (!files || !files.file) {
        ('No file provided error - files:', files);
        return ctx.badRequest('No file provided');
      }

      if (!doctorId || !documentType) {
        ('Missing required fields - doctorId:', doctorId, 'documentType:', documentType);
        return ctx.badRequest('Doctor ID and document type are required');
      }

      // Verify doctor exists
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      if (!doctor) {
        return ctx.notFound('Doctor not found');
      }

      // Check if document already exists for this doctor and type
      const existingDocs = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          doctor: doctorId,
          documentType: documentType
        },
        sort: 'createdAt:desc' // Get newest first, in case we want to preserve some logic
      });

      (`📄 Found ${existingDocs.length} existing documents of type ${documentType} for doctor ${doctorId}`);
      
      // Upload to S3 and create document record
      const uploadResult = await strapi.service('api::compliance-document.compliance-document').uploadToS3AndCreate({
        file: files.file,
        doctorId,
        documentType,
        issueDate,
        expiryDate,
        notes,
        replaceExisting: existingDocs.length > 0 ? existingDocs : null
      });

      // Automatically check doctor verification status after document upload
      try {
        (`🔄 Triggering doctor verification status check for doctor ${doctorId} after document upload`);
        
        const doctorVerificationService = strapi.service('api::compliance-document.doctor-verification');
        const verificationResult = await doctorVerificationService.updateDoctorVerificationStatus(doctorId);
        
        ('✅ Doctor verification status check completed after upload:', verificationResult);
        
        ctx.send({
          success: true,
          data: uploadResult,
          message: 'Document uploaded successfully',
          doctorVerificationUpdate: verificationResult
        });
      } catch (verificationError) {
        console.error('❌ Error checking doctor verification status after upload:', verificationError);
        
        // Still return success for the upload, but log the error
        ctx.send({
          success: true,
          data: uploadResult,
          message: 'Document uploaded successfully, but failed to update doctor verification status',
          doctorVerificationError: verificationError.message
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      ctx.internalServerError('Failed to upload document');
    }
  },

  // Get all compliance documents for a doctor
  async getByDoctor(ctx) {
    try {
      const { doctorId } = ctx.params;

      if (!doctorId) {
        return ctx.badRequest('Doctor ID is required');
      }

      const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          doctor: doctorId
        },
        populate: ['doctor'],
        sort: { createdAt: 'desc' }
      });

      // Group documents by type for easy frontend consumption
      const groupedDocs = {};
      documents.forEach(doc => {
        groupedDocs[doc.documentType] = doc;
      });

      ctx.send({
        success: true,
        data: {
          documents: documents,
          groupedByType: groupedDocs,
          totalDocuments: documents.length
        }
      });

    } catch (error) {
      console.error('Get documents error:', error);
      ctx.internalServerError('Failed to retrieve documents');
    }
  },

  // Get compliance overview/stats for a doctor
  async getComplianceOverview(ctx) {
    try {
      const { doctorId } = ctx.params;

      if (!doctorId) {
        return ctx.badRequest('Doctor ID is required');
      }

      const overview = await strapi.service('api::compliance-document.compliance-document').getComplianceOverview(doctorId);

      ctx.send({
        success: true,
        data: overview
      });

    } catch (error) {
      console.error('Get overview error:', error);
      ctx.internalServerError('Failed to retrieve compliance overview');
    }
  },

  // Update document dates
  async updateDates(ctx) {
    try {
      const { id } = ctx.params;
      const { issueDate, expiryDate } = ctx.request.body;

      const updatedDoc = await strapi.entityService.update('api::compliance-document.compliance-document', id, {
        data: {
          issueDate,
          expiryDate,
          lastModified: new Date()
        }
      });

      // Update status based on expiry date
      const updatedStatus = await strapi.service('api::compliance-document.compliance-document').updateDocumentStatus(updatedDoc);

      ctx.send({
        success: true,
        data: updatedStatus,
        message: 'Document dates updated successfully'
      });

    } catch (error) {
      console.error('Update dates error:', error);
      ctx.internalServerError('Failed to update document dates');
    }
  },

  // Delete compliance document
  async delete(ctx) {
    try {
      const { id } = ctx.params;

      // Get document details before deletion
      const document = await strapi.entityService.findOne('api::compliance-document.compliance-document', id);
      
      if (!document) {
        return ctx.notFound('Document not found');
      }

      // Delete from S3
      await strapi.service('api::compliance-document.compliance-document').deleteFromS3(document.s3Key);

      // Delete from database
      await strapi.entityService.delete('api::compliance-document.compliance-document', id);

      ctx.send({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Delete document error:', error);
      ctx.internalServerError('Failed to delete document');
    }
  },

  // Get signed URL for document download
  async getDownloadUrl(ctx) {
    try {
      const { id } = ctx.params;

      const document = await strapi.entityService.findOne('api::compliance-document.compliance-document', id);
      
      if (!document) {
        return ctx.notFound('Document not found');
      }

      const signedUrl = await strapi.service('api::compliance-document.compliance-document').getSignedDownloadUrl(document.s3Key);

      ctx.send({
        success: true,
        data: {
          downloadUrl: signedUrl,
          fileName: document.originalFileName,
          expiresIn: '1 hour'
        }
      });

    } catch (error) {
      console.error('Get download URL error:', error);
      ctx.internalServerError('Failed to generate download URL');
    }
  },

  // Verify document
  async verifyDocument(ctx) {
    try {
      const { id } = ctx.params;
      const { verificationStatus, notes } = ctx.request.body;
      const { user } = ctx.state; // Assuming you have authentication middleware

      // Get the document first to find the doctor
      const document = await strapi.entityService.findOne('api::compliance-document.compliance-document', id, {
        populate: ['doctor']
      });

      if (!document) {
        return ctx.notFound('Document not found');
      }

      const updatedDoc = await strapi.entityService.update('api::compliance-document.compliance-document', id, {
        data: {
          verificationStatus,
          verifiedBy: user?.email || 'admin',
          verifiedAt: new Date(),
          notes: notes || '',
          lastModified: new Date()
        }
      });

      // Automatically update doctor verification status
      try {
        (`🔄 Triggering doctor verification status update for doctor ${document.doctor.id} after document verification change`);
        
        const doctorVerificationService = strapi.service('api::compliance-document.doctor-verification');
        const verificationResult = await doctorVerificationService.updateDoctorVerificationStatus(document.doctor.id);
        
        ('✅ Doctor verification status update completed:', verificationResult);
        
        // Include verification result in response for debugging
        ctx.send({
          success: true,
          data: updatedDoc,
          message: 'Document verification updated successfully',
          doctorVerificationUpdate: verificationResult
        });
      } catch (verificationError) {
        console.error('❌ Error updating doctor verification status:', verificationError);
        
        // Still return success for the document update, but log the error
        ctx.send({
          success: true,
          data: updatedDoc,
          message: 'Document verification updated successfully, but failed to update doctor verification status',
          doctorVerificationError: verificationError.message
        });
      }

    } catch (error) {
      console.error('Verify document error:', error);
      ctx.internalServerError('Failed to verify document');
    }
  },

  // Bulk update expiry statuses (can be run as a cron job)
  async updateExpiryStatuses(ctx) {
    try {
      const result = await strapi.service('api::compliance-document.compliance-document').updateAllExpiryStatuses();

      ctx.send({
        success: true,
        data: result,
        message: 'Expiry statuses updated successfully'
      });

    } catch (error) {
      console.error('Update expiry statuses error:', error);
      ctx.internalServerError('Failed to update expiry statuses');
    }
  },

  // Update doctor verification status based on compliance documents
  async updateDoctorVerificationStatus(ctx) {
    try {
      const { doctorId } = ctx.params;

      if (!doctorId) {
        return ctx.badRequest('Doctor ID is required');
      }

      const doctorVerificationService = strapi.service('api::compliance-document.doctor-verification');
      const result = await doctorVerificationService.updateDoctorVerificationStatus(doctorId);

      ctx.send({
        success: true,
        data: result,
        message: 'Doctor verification status updated successfully'
      });

    } catch (error) {
      console.error('Update doctor verification status error:', error);
      ctx.internalServerError('Failed to update doctor verification status');
    }
  },

  // Bulk update all doctors' verification statuses
  async updateAllDoctorsVerificationStatus(ctx) {
    try {
      ('🔄 Starting bulk doctor verification status update...');
      
      const doctorVerificationService = strapi.service('api::compliance-document.doctor-verification');
      const result = await doctorVerificationService.updateAllDoctorsVerificationStatus();

      ctx.send({
        success: true,
        data: result,
        message: `Bulk verification status update completed. Updated: ${result.updated}, Unchanged: ${result.unchanged}, Errors: ${result.errors}`
      });

    } catch (error) {
      console.error('Bulk update doctors verification status error:', error);
      ctx.internalServerError('Failed to update doctors verification status');
    }
  },

  // Update doctors without documents to unverified
  async updateDoctorsWithoutDocuments(ctx) {
    try {
      ('🔄 Starting update for doctors without compliance documents...');
      
      const doctorVerificationService = strapi.service('api::compliance-document.doctor-verification');
      const result = await doctorVerificationService.updateDoctorsWithoutDocuments();

      ctx.send({
        success: true,
        data: result,
        message: `Doctors without documents update completed. Updated to unverified: ${result.updated}, Already unverified: ${result.alreadyUnverified}, Total without docs: ${result.doctorsWithoutDocs}`
      });

    } catch (error) {
      console.error('Update doctors without documents error:', error);
      ctx.internalServerError('Failed to update doctors without documents');
    }
  },

  // Get notifications for a doctor
  async getDoctorNotifications(ctx) {
    try {
      const { doctorId } = ctx.params;

      if (!doctorId) {
        return ctx.badRequest('Doctor ID is required');
      }

      const notificationService = strapi.service('api::compliance-document.doctor-notifications');
      const result = await notificationService.getDoctorNotifications(doctorId);

      if (!result.success) {
        return ctx.badRequest(result.error);
      }

      ctx.send({
        success: true,
        data: result.data,
        message: 'Notifications retrieved successfully'
      });

    } catch (error) {
      console.error('Get doctor notifications error:', error);
      ctx.internalServerError('Failed to get notifications');
    }
  },

  // Get notification summary for a doctor
  async getDoctorNotificationSummary(ctx) {
    try {
      const { doctorId } = ctx.params;

      if (!doctorId) {
        return ctx.badRequest('Doctor ID is required');
      }

      const notificationService = strapi.service('api::compliance-document.doctor-notifications');
      const result = await notificationService.getDoctorNotificationSummary(doctorId);

      if (!result.success) {
        return ctx.badRequest(result.error);
      }

      ctx.send({
        success: true,
        data: result.data,
        message: 'Notification summary retrieved successfully'
      });

    } catch (error) {
      console.error('Get doctor notification summary error:', error);
      ctx.internalServerError('Failed to get notification summary');
    }
  },

  // Mark notification as read
  async markNotificationAsRead(ctx) {
    try {
      const { doctorId, notificationId } = ctx.params;

      if (!doctorId || !notificationId) {
        return ctx.badRequest('Doctor ID and Notification ID are required');
      }

      const notificationService = strapi.service('api::compliance-document.doctor-notifications');
      const result = await notificationService.markNotificationAsRead(doctorId, notificationId);

      ctx.send({
        success: true,
        data: result.data,
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('Mark notification as read error:', error);
      ctx.internalServerError('Failed to mark notification as read');
    }
  },

  // Mark all notifications as read
  async markAllNotificationsAsRead(ctx) {
    try {
      const { doctorId } = ctx.params;

      if (!doctorId) {
        return ctx.badRequest('Doctor ID is required');
      }

      const notificationService = strapi.service('api::compliance-document.doctor-notifications');
      const result = await notificationService.markAllNotificationsAsRead(doctorId);

      ctx.send({
        success: true,
        data: result.data,
        message: 'All notifications marked as read'
      });

    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      ctx.internalServerError('Failed to mark all notifications as read');
    }
  },

  // ===== ADMIN NOTIFICATIONS =====

  // Get admin notifications
  async getAdminNotifications(ctx) {
    try {
      const adminNotificationService = strapi.service('api::compliance-document.admin-notifications');
      const result = await adminNotificationService.getAdminNotifications();

      if (!result.success) {
        return ctx.badRequest(result.error);
      }

      ctx.send({
        success: true,
        data: result.data,
        message: 'Admin notifications retrieved successfully'
      });

    } catch (error) {
      console.error('Get admin notifications error:', error);
      ctx.internalServerError('Failed to get admin notifications');
    }
  },

  // Get admin notification summary
  async getAdminNotificationSummary(ctx) {
    try {
      const adminNotificationService = strapi.service('api::compliance-document.admin-notifications');
      const result = await adminNotificationService.getAdminNotificationSummary();

      if (!result.success) {
        return ctx.badRequest(result.error);
      }

      ctx.send({
        success: true,
        data: result.data,
        message: 'Admin notification summary retrieved successfully'
      });

    } catch (error) {
      console.error('Get admin notification summary error:', error);
      ctx.internalServerError('Failed to get admin notification summary');
    }
  },

  // Mark admin notification as read
  async markAdminNotificationAsRead(ctx) {
    try {
      const { notificationId } = ctx.params;

      if (!notificationId) {
        return ctx.badRequest('Notification ID is required');
      }

      const adminNotificationService = strapi.service('api::compliance-document.admin-notifications');
      const result = await adminNotificationService.markNotificationAsRead(notificationId);

      ctx.send({
        success: true,
        data: result.data,
        message: 'Admin notification marked as read'
      });

    } catch (error) {
      console.error('Mark admin notification as read error:', error);
      ctx.internalServerError('Failed to mark admin notification as read');
    }
  },

  // Mark all admin notifications as read
  async markAllAdminNotificationsAsRead(ctx) {
    try {
      const adminNotificationService = strapi.service('api::compliance-document.admin-notifications');
      const result = await adminNotificationService.markAllNotificationsAsRead();

      ctx.send({
        success: true,
        data: result.data,
        message: 'All admin notifications marked as read'
      });

    } catch (error) {
      console.error('Mark all admin notifications as read error:', error);
      ctx.internalServerError('Failed to mark all admin notifications as read');
    }
  }

}));
