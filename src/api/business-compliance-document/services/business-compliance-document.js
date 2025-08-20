// @ts-nocheck
'use strict';

/**
 * business-compliance-document service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const S3Service = require('../../../utils/s3-service');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

module.exports = createCoreService('api::business-compliance-document.business-compliance-document', ({ strapi }) => ({

  // Business-specific document types configuration
  getRequiredDocumentTypes() {
    return [
      {
        id: 'business-license',
        name: 'Business License',
        description: 'Valid business registration/license document',
        required: true,
        autoExpiry: true,
        category: 'registration'
      },
      {
        id: 'insurance-certificate',
        name: 'Insurance Certificate',
        description: 'Professional liability insurance certificate',
        required: true,
        autoExpiry: true,
        category: 'insurance'
      },
      {
        id: 'tax-certificate',
        name: 'Tax Registration Certificate',
        description: 'Tax registration or VAT certificate',
        required: true,
        autoExpiry: true,
        category: 'financial'
      },
      {
        id: 'health-safety-certificate',
        name: 'Health & Safety Certificate',
        description: 'Health and safety compliance certificate',
        required: true,
        autoExpiry: true,
        category: 'compliance'
      },
      {
        id: 'data-protection-certificate',
        name: 'Data Protection Certificate',
        description: 'GDPR/Data protection compliance certificate',
        required: true,
        autoExpiry: true,
        category: 'compliance'
      }
    ];
  },

  // Get document configuration by type
  getDocumentConfig(documentType) {
    const requiredDocs = this.getRequiredDocumentTypes();
    return requiredDocs.find(doc => doc.id === documentType);
  },

  // Upload document with S3 integration
  async uploadDocument({ businessId, documentType, file, issueDate, isUpdate = false }) {
    try {
      console.log('📄 Uploading business compliance document:', {
        businessId,
        documentType,
        fileName: file.name || file.originalFilename,
        fileSize: file.size || (file.originalFilename ? require('fs').statSync(file.filepath).size : 0),
        isUpdate
      });

      // Initialize S3 service
      const s3Service = new S3Service();

      // Handle different file object formats and prepare for S3 upload
      let fileName, fileData, fileMimeType;
      
      if (file.originalFilename) {
        // Strapi native PersistentFile format
        fileName = file.originalFilename;
        fileMimeType = file.mimetype;
        // Read file data from temporary file path
        const fs = require('fs');
        fileData = fs.readFileSync(file.filepath);
      } else {
        // Multer format
        fileName = file.name;
        fileData = file.data;
        fileMimeType = file.mimetype;
      }

      // Generate unique filename
      const fileExtension = path.extname(fileName);
      const uniqueFileName = `${documentType}-${businessId}-${uuidv4()}${fileExtension}`;
      const s3Key = `business-compliance/${businessId}/${uniqueFileName}`;

      // Upload to S3
      const s3Result = await s3Service.uploadFile(
        s3Key,
        fileData,
        fileMimeType,
        {
          businessId: businessId.toString(),
          documentType: documentType,
          originalFileName: fileName
        }
      );
      
      console.log('📤 S3 upload result:', s3Result);

      // Get document configuration
      const docConfig = this.getDocumentConfig(documentType);
      const autoExpiry = docConfig?.autoExpiry || false;

      // Calculate automatic expiry date if needed
      let calculatedExpiryDate = null;
      if (autoExpiry && issueDate) {
        // Default to 1 year expiry for business documents
        // This could be made configurable per document type in the future
        const issueDateObj = new Date(issueDate);
        calculatedExpiryDate = new Date(issueDateObj);
        calculatedExpiryDate.setFullYear(calculatedExpiryDate.getFullYear() + 1);
      }

      // Prepare document data
      const documentData = {
        business: businessId,
        documentType,
        fileName: fileName,
        fileUrl: s3Result.location,
        mimeType: fileMimeType,
        fileSize: file.size || (file.originalFilename ? require('fs').statSync(file.filepath).size : 0),
        uploadedAt: new Date(),
        verificationStatus: 'pending',
        autoExpiry,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: calculatedExpiryDate,
        lastModified: new Date()
      };

      // Calculate expiry status if applicable
      if (autoExpiry && calculatedExpiryDate) {
        const today = new Date();
        const timeDiff = calculatedExpiryDate.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        documentData.daysUntilExpiry = daysUntilExpiry;

        if (daysUntilExpiry < 0) {
          documentData.expiryStatus = 'expired';
        } else if (daysUntilExpiry <= 30) {
          documentData.expiryStatus = 'expiring';
        } else {
          documentData.expiryStatus = 'valid';
        }
      }

      let result;

      if (isUpdate) {
        // Find existing document and update
        const existingDocs = await strapi.entityService.findMany('api::business-compliance-document.business-compliance-document', {
          filters: {
            business: businessId,
            documentType: documentType
          },
          limit: 1
        });

        if (existingDocs.length > 0) {
          result = await strapi.entityService.update('api::business-compliance-document.business-compliance-document', existingDocs[0].id, {
            data: documentData
          });
          console.log('✅ Updated existing business document:', result.id);
        } else {
          result = await strapi.entityService.create('api::business-compliance-document.business-compliance-document', {
            data: documentData
          });
          console.log('✅ Created new business document:', result.id);
        }
      } else {
        result = await strapi.entityService.create('api::business-compliance-document.business-compliance-document', {
          data: documentData
        });
        console.log('✅ Created new business document:', result.id);
      }

      return result;

    } catch (error) {
      console.error('❌ Error uploading business document:', error);
      throw error;
    }
  },

  // Get compliance overview for a business
  async getComplianceOverview(businessId) {
    const documents = await strapi.entityService.findMany('api::business-compliance-document.business-compliance-document', {
      filters: {
        business: businessId
      }
    });

    const requiredDocumentTypes = this.getRequiredDocumentTypes();
    const stats = {
      uploaded: 0,
      missing: 0,
      expiring: 0,
      expired: 0,
      total: requiredDocumentTypes.length
    };

    const documentsByType = {};
    documents.forEach(doc => {
      documentsByType[doc.documentType] = doc;
    });

    // Check each required document type
    requiredDocumentTypes.forEach(docType => {
      const doc = documentsByType[docType.id];
      
      if (!doc) {
        stats.missing++;
      } else {
        // Update status if needed
        if (docType.autoExpiry && doc.expiryDate) {
          const expiryDate = new Date(doc.expiryDate);
          const today = new Date();
          const timeDiff = expiryDate.getTime() - today.getTime();
          const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry < 0) {
            stats.expired++;
          } else if (daysUntilExpiry <= 30) {
            stats.expiring++;
          } else {
            stats.uploaded++;
          }
        } else {
          stats.uploaded++;
        }
      }
    });

    return {
      stats,
      documents: documentsByType,
      requiredDocuments: requiredDocumentTypes,
      completionPercentage: Math.round((stats.uploaded / stats.total) * 100)
    };
  },

  // Update all document expiry statuses (for cron job)
  async updateAllExpiryStatuses() {
    try {
      console.log('🔄 Updating all business document expiry statuses...');
      
      const documents = await strapi.entityService.findMany('api::business-compliance-document.business-compliance-document', {
        filters: {
          autoExpiry: true,
          expiryDate: { $notNull: true }
        }
      });

      let updated = 0;
      const today = new Date();

      for (const doc of documents) {
        const expiryDate = new Date(doc.expiryDate);
        const timeDiff = expiryDate.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        let newStatus = 'valid';
        if (daysUntilExpiry < 0) {
          newStatus = 'expired';
        } else if (daysUntilExpiry <= 30) {
          newStatus = 'expiring';
        }

        if (doc.expiryStatus !== newStatus || doc.daysUntilExpiry !== daysUntilExpiry) {
          await strapi.entityService.update('api::business-compliance-document.business-compliance-document', doc.id, {
            data: {
              expiryStatus: newStatus,
              daysUntilExpiry,
              lastModified: new Date()
            }
          });
          updated++;
        }
      }

      console.log(`✅ Updated ${updated} business document expiry statuses`);
      return { updated, total: documents.length };

    } catch (error) {
      console.error('❌ Error updating business document expiry statuses:', error);
      throw error;
    }
  }

}));
