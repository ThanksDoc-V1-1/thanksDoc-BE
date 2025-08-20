// @ts-nocheck
'use strict';

/**
 * business-compliance-document controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::business-compliance-document.business-compliance-document', ({ strapi }) => ({
  
  // Upload compliance document for business
  async upload(ctx) {
    try {
      console.log('Business compliance upload request received:');
      console.log('Body:', ctx.request.body);
      console.log('Files:', ctx.request.files);
      
      const { businessId, documentType, issueDate } = ctx.request.body;
      const files = ctx.request.files;

      if (!files || !files.file) {
        console.log('No file provided error - files:', files);
        return ctx.badRequest('No file provided');
      }

      if (!businessId || !documentType) {
        console.log('Missing required fields - businessId:', businessId, 'documentType:', documentType);
        return ctx.badRequest('Business ID and document type are required');
      }

      // Verify business exists
      const business = await strapi.entityService.findOne('api::business.business', businessId);
      if (!business) {
        return ctx.notFound('Business not found');
      }

      // Check if document already exists for this business and type
      const existingDoc = await strapi.entityService.findMany('api::business-compliance-document.business-compliance-document', {
        filters: {
          business: businessId,
          documentType: documentType
        },
        limit: 1
      });

      // Use the compliance document service to handle the upload
      const complianceService = strapi.service('api::business-compliance-document.business-compliance-document');
      
      const uploadResult = await complianceService.uploadDocument({
        businessId,
        documentType,
        file: files.file,
        issueDate,
        isUpdate: existingDoc.length > 0
      });

      // Update business verification status after successful upload
      try {
        console.log(`🔄 Triggering business verification status check for business ${businessId} after document upload`);
        
        const businessVerificationService = strapi.service('api::business-compliance-document.business-verification');
        const verificationResult = await businessVerificationService.updateBusinessVerificationStatus(businessId);
        
        console.log('✅ Business verification status check completed after upload:', verificationResult);
        
        ctx.send({
          success: true,
          data: uploadResult,
          message: 'Document uploaded successfully',
          businessVerificationUpdate: verificationResult
        });
      } catch (verificationError) {
        console.error('❌ Error checking business verification status after upload:', verificationError);
        
        // Still return success for the upload, but log the error
        ctx.send({
          success: true,
          data: uploadResult,
          message: 'Document uploaded successfully, but failed to update business verification status',
          businessVerificationError: verificationError.message
        });
      }

    } catch (error) {
      console.error('Business compliance upload error:', error);
      ctx.throw(500, `Upload failed: ${error.message}`);
    }
  },

  // Get compliance documents for a business
  async getBusinessDocuments(ctx) {
    try {
      const { businessId } = ctx.params;

      if (!businessId) {
        return ctx.badRequest('Business ID is required');
      }

      const documents = await strapi.entityService.findMany('api::business-compliance-document.business-compliance-document', {
        filters: {
          business: businessId
        },
        sort: { createdAt: 'desc' }
      });

      // Get business compliance overview
      const complianceService = strapi.service('api::business-compliance-document.business-compliance-document');
      const overview = await complianceService.getComplianceOverview(businessId);

      ctx.send({
        success: true,
        data: {
          documents,
          overview
        }
      });

    } catch (error) {
      console.error('Get business documents error:', error);
      ctx.throw(500, `Failed to get documents: ${error.message}`);
    }
  },

  // Verify business document (admin only)
  async verifyDocument(ctx) {
    try {
      const { id } = ctx.params;
      const { verificationStatus, notes } = ctx.request.body;
      const { user } = ctx.state; // Assuming you have authentication middleware

      // Get the document first to find the business
      const document = await strapi.entityService.findOne('api::business-compliance-document.business-compliance-document', id, {
        populate: ['business']
      });

      if (!document) {
        return ctx.notFound('Document not found');
      }

      const updatedDoc = await strapi.entityService.update('api::business-compliance-document.business-compliance-document', id, {
        data: {
          verificationStatus,
          verifiedBy: user?.email || 'admin',
          verifiedAt: new Date(),
          notes: notes || '',
          lastModified: new Date()
        }
      });

      // Automatically update business verification status
      try {
        console.log(`🔄 Triggering business verification status update for business ${document.business.id} after document verification change`);
        
        const businessVerificationService = strapi.service('api::business-compliance-document.business-verification');
        const verificationResult = await businessVerificationService.updateBusinessVerificationStatus(document.business.id);
        
        console.log('✅ Business verification status update completed:', verificationResult);
        
        ctx.send({
          success: true,
          data: updatedDoc,
          message: 'Document verification updated successfully',
          businessVerificationUpdate: verificationResult
        });
      } catch (verificationError) {
        console.error('❌ Error updating business verification status:', verificationError);
        
        // Still return success for the document update, but log the error
        ctx.send({
          success: true,
          data: updatedDoc,
          message: 'Document verification updated successfully, but failed to update business verification status',
          businessVerificationError: verificationError.message
        });
      }

    } catch (error) {
      console.error('Verify business document error:', error);
      ctx.internalServerError('Failed to verify document');
    }
  },

  // Get compliance overview for a business
  async getComplianceOverview(ctx) {
    try {
      const { businessId } = ctx.params;

      if (!businessId) {
        return ctx.badRequest('Business ID is required');
      }

      const complianceService = strapi.service('api::business-compliance-document.business-compliance-document');
      const overview = await complianceService.getComplianceOverview(businessId);

      ctx.send({
        success: true,
        data: overview
      });

    } catch (error) {
      console.error('Get business compliance overview error:', error);
      ctx.throw(500, `Failed to get compliance overview: ${error.message}`);
    }
  }

}));
