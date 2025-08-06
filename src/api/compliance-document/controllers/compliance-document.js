'use strict';

/**
 * compliance-document controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::compliance-document.compliance-document', ({ strapi }) => ({
  
  // Upload compliance document
  async upload(ctx) {
    try {
      console.log('Upload request received:');
      console.log('Body:', ctx.request.body);
      console.log('Files:', ctx.request.files);
      
      const { doctorId, documentType, issueDate, expiryDate, notes } = ctx.request.body;
      const files = ctx.request.files;

      if (!files || !files.file) {
        console.log('No file provided error - files:', files);
        return ctx.badRequest('No file provided');
      }

      if (!doctorId || !documentType) {
        console.log('Missing required fields - doctorId:', doctorId, 'documentType:', documentType);
        return ctx.badRequest('Doctor ID and document type are required');
      }

      // Verify doctor exists
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      if (!doctor) {
        return ctx.notFound('Doctor not found');
      }

      // Check if document already exists for this doctor and type
      const existingDoc = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          doctor: doctorId,
          documentType: documentType
        }
      });

      // Upload to S3 and create document record
      const uploadResult = await strapi.service('api::compliance-document.compliance-document').uploadToS3AndCreate({
        file: files.file,
        doctorId,
        documentType,
        issueDate,
        expiryDate,
        notes,
        replaceExisting: existingDoc.length > 0 ? existingDoc[0].id : null
      });

      // Automatically check doctor verification status after document upload
      try {
        console.log(`🔄 Triggering doctor verification status check for doctor ${doctorId} after document upload`);
        
        const doctorVerificationService = strapi.service('api::compliance-document.doctor-verification');
        const verificationResult = await doctorVerificationService.updateDoctorVerificationStatus(doctorId);
        
        console.log('✅ Doctor verification status check completed after upload:', verificationResult);
        
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
        console.log(`🔄 Triggering doctor verification status update for doctor ${document.doctor.id} after document verification change`);
        
        const doctorVerificationService = strapi.service('api::compliance-document.doctor-verification');
        const verificationResult = await doctorVerificationService.updateDoctorVerificationStatus(document.doctor.id);
        
        console.log('✅ Doctor verification status update completed:', verificationResult);
        
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
      console.log('🔄 Starting bulk doctor verification status update...');
      
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
  }

}));
