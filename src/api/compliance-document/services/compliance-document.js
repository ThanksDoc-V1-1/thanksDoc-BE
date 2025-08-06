'use strict';

/**
 * compliance-document service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const S3Service = require('../../../utils/s3-service');

module.exports = createCoreService('api::compliance-document.compliance-document', ({ strapi }) => ({

  // Get S3 service instance
  getS3Service() {
    console.log('\n=== S3 Service Creation - Using Strapi ENV ===');
    
    // Import Strapi's env function to properly access environment variables
    const strapi = require('@strapi/strapi');
    
    // Get AWS configuration using process.env since Strapi automatically loads .env
    const awsConfig = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucketName: process.env.AWS_S3_BUCKET
    };
    
    console.log('Environment variables loaded by Strapi:');
    console.log('AWS_ACCESS_KEY_ID:', awsConfig.accessKeyId || 'MISSING');
    console.log('AWS_SECRET_ACCESS_KEY:', awsConfig.secretAccessKey ? 'Set (length: ' + awsConfig.secretAccessKey.length + ')' : 'MISSING');
    console.log('AWS_REGION:', awsConfig.region);
    console.log('AWS_S3_BUCKET:', awsConfig.bucketName || 'MISSING');
    
    // Additional debugging - let's check what Strapi thinks the env vars are
    console.log('\n=== Additional debugging ===');
    try {
      // Check if we can access Strapi's config
      if (strapi.config && strapi.config.get) {
        console.log('Strapi config AWS_ACCESS_KEY_ID:', strapi.config.get('AWS_ACCESS_KEY_ID'));
        console.log('Strapi config AWS_S3_BUCKET:', strapi.config.get('AWS_S3_BUCKET'));
      }
    } catch (e) {
      console.log('Could not access Strapi config:', e.message);
    }
    
    console.log('Raw process.env AWS values:');
    console.log('process.env.AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
    console.log('process.env.AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
    
    return new S3Service(awsConfig);
  },

  // Upload file to S3 and create database record
  async uploadToS3AndCreate({ file, doctorId, documentType, issueDate, expiryDate, notes, replaceExisting }) {
    const s3Service = this.getS3Service();
    
    try {
      // Handle different file object formats (multer vs Strapi native)
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
      const uniqueFileName = `${documentType}-${doctorId}-${uuidv4()}${fileExtension}`;
      const s3Key = `compliance-documents/${doctorId}/${uniqueFileName}`;

      // Upload to S3
      const uploadResult = await s3Service.uploadFile(
        s3Key,
        fileData,
        fileMimeType,
        {
          doctorId: doctorId.toString(),
          documentType: documentType,
          originalFileName: fileName
        }
      );

      // Calculate auto-expiry if applicable
      let calculatedExpiryDate = expiryDate;
      const documentConfig = this.getDocumentConfig(documentType);
      
      if (documentConfig.autoExpiry && issueDate && !expiryDate) {
        const issueDateTime = new Date(issueDate);
        calculatedExpiryDate = new Date(issueDateTime);
        calculatedExpiryDate.setFullYear(calculatedExpiryDate.getFullYear() + documentConfig.validityYears);
      }

      // If replacing existing documents, delete all old ones first
      if (replaceExisting && Array.isArray(replaceExisting)) {
        console.log(`🗑️ Removing ${replaceExisting.length} existing documents of the same type`);
        
        for (const oldDoc of replaceExisting) {
          try {
            // Delete from S3 if s3Key exists
            if (oldDoc.s3Key) {
              await s3Service.deleteFile(oldDoc.s3Key);
              console.log(`✅ Deleted S3 file: ${oldDoc.s3Key}`);
            }
            
            // Delete from database
            await strapi.entityService.delete('api::compliance-document.compliance-document', oldDoc.id);
            console.log(`✅ Deleted database record: ${oldDoc.id}`);
          } catch (deleteError) {
            console.error(`❌ Error deleting old document ${oldDoc.id}:`, deleteError);
            // Continue with other deletions even if one fails
          }
        }
      } else if (replaceExisting && !Array.isArray(replaceExisting)) {
        // Handle legacy single document replacement
        const oldDoc = await strapi.entityService.findOne('api::compliance-document.compliance-document', replaceExisting);
        if (oldDoc) {
          try {
            if (oldDoc.s3Key) {
              await s3Service.deleteFile(oldDoc.s3Key);
            }
            await strapi.entityService.delete('api::compliance-document.compliance-document', replaceExisting);
            console.log(`✅ Deleted legacy single document: ${replaceExisting}`);
          } catch (deleteError) {
            console.error(`❌ Error deleting legacy document ${replaceExisting}:`, deleteError);
          }
        }
      }

      // Create database record
      const documentData = {
        doctor: doctorId,
        documentType,
        documentName: documentConfig.name,
        fileName: uniqueFileName,
        originalFileName: fileName, // Use the fileName variable we extracted earlier
        fileSize: fileData.length, // Use the actual file data length
        fileType: fileMimeType, // Use the fileMimeType variable we extracted earlier
        s3Key,
        s3Url: uploadResult.location,
        s3Bucket: uploadResult.bucket,
        issueDate: issueDate || null,
        expiryDate: calculatedExpiryDate || null,
        isRequired: documentConfig.required,
        autoExpiry: documentConfig.autoExpiry,
        validityYears: documentConfig.validityYears || null,
        uploadedAt: new Date(),
        notes: notes || '',
        status: 'uploaded'
      };

      const createdDocument = await strapi.entityService.create('api::compliance-document.compliance-document', {
        data: documentData
      });

      // Update status based on expiry
      const finalDocument = await this.updateDocumentStatus(createdDocument);

      return finalDocument;

    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload document to S3');
    }
  },

  // Delete file from S3
  async deleteFromS3(s3Key) {
    const s3Service = this.getS3Service();

    try {
      await s3Service.deleteFile(s3Key);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete document from S3');
    }
  },

  // Generate signed URL for download
  async getSignedDownloadUrl(s3Key, expiresIn = 3600) {
    const s3Service = this.getS3Service();

    try {
      const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, expiresIn);
      return signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      throw new Error('Failed to generate download URL');
    }
  },

  // Update document status based on expiry date
  async updateDocumentStatus(document) {
    let status = document.status;

    if (document.autoExpiry && document.expiryDate) {
      const expiryDate = new Date(document.expiryDate);
      const today = new Date();
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring';
      } else {
        status = 'uploaded';
      }

      // Update status in database if changed
      if (status !== document.status) {
        const updatedDoc = await strapi.entityService.update('api::compliance-document.compliance-document', document.id, {
          data: { status }
        });
        return updatedDoc;
      }
    }

    return document;
  },

  // Get compliance overview for a doctor
  async getComplianceOverview(doctorId) {
    const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
      filters: {
        doctor: doctorId
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
    const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
      filters: {
        autoExpiry: true,
        expiryDate: {
          $notNull: true
        }
      }
    });

    let updated = 0;
    
    for (const doc of documents) {
      const updatedDoc = await this.updateDocumentStatus(doc);
      if (updatedDoc.status !== doc.status) {
        updated++;
      }
    }

    return {
      totalDocuments: documents.length,
      updatedDocuments: updated
    };
  },

  // Get document configuration
  getDocumentConfig(documentType) {
    const configs = {
      // Core Professional Documents - Extended validity periods for professional certifications
      gmc_registration: { name: 'GMC Registration Certificate', required: true, autoExpiry: true, validityYears: 1 },
      current_performers_list: { name: 'Current Performers List', required: true, autoExpiry: true, validityYears: 1 },
      cct_certificate: { name: 'Certificate for completion of training (CCT)', required: true, autoExpiry: true, validityYears: 5 },
      medical_indemnity: { name: 'Medical Indemnity Insurance', required: true, autoExpiry: true, validityYears: 1 },
      dbs_check: { name: 'Enhanced DBS Check', required: true, autoExpiry: true, validityYears: 3 },
      right_to_work: { name: 'Right to Work in the UK', required: true, autoExpiry: true, validityYears: 2 },
      photo_id: { name: 'Photo ID', required: true, autoExpiry: true, validityYears: 5 },
      gp_cv: { name: 'GP CV', required: true, autoExpiry: true, validityYears: 1 },
      occupational_health: { name: 'Occupational Health Clearance', required: true, autoExpiry: true, validityYears: 2 },
      professional_references: { name: 'Professional References', required: true, autoExpiry: true, validityYears: 3 },
      appraisal_revalidation: { name: 'Appraisal & Revalidation Evidence', required: true, autoExpiry: true, validityYears: 1 },
      // Training Certificates - Standardized validity periods
      basic_life_support: { name: 'Basic Life Support (BLS) + Anaphylaxis', required: true, autoExpiry: true, validityYears: 1 },
      level3_adult_safeguarding: { name: 'Level 3 Adult Safeguarding', required: true, autoExpiry: true, validityYears: 3 },
      level3_child_safeguarding: { name: 'Level 3 Child Safeguarding', required: true, autoExpiry: true, validityYears: 3 },
      information_governance: { name: 'Information Governance (IG) & GDPR', required: true, autoExpiry: true, validityYears: 1 },
      autism_learning_disability: { name: 'Autism and Learning Disability', required: true, autoExpiry: true, validityYears: 3 },
      equality_diversity: { name: 'Equality, Diversity and Human Rights', required: true, autoExpiry: true, validityYears: 3 },
      health_safety_welfare: { name: 'Health, Safety and Welfare', required: true, autoExpiry: true, validityYears: 1 },
      conflict_resolution: { name: 'Conflict Resolution and Handling Complaints', required: true, autoExpiry: true, validityYears: 3 },
      fire_safety: { name: 'Fire Safety', required: true, autoExpiry: true, validityYears: 1 },
      infection_prevention: { name: 'Infection Prevention and Control', required: true, autoExpiry: true, validityYears: 1 },
      moving_handling: { name: 'Moving and Handling', required: true, autoExpiry: true, validityYears: 1 },
      preventing_radicalisation: { name: 'Preventing Radicalisation', required: true, autoExpiry: true, validityYears: 3 }
    };

    return configs[documentType] || { name: documentType, required: false, autoExpiry: true, validityYears: 3 };
  },

  // Get all required document types
  getRequiredDocumentTypes() {
    const documentTypes = [
      'gmc_registration', 'current_performers_list', 'cct_certificate', 'medical_indemnity',
      'dbs_check', 'right_to_work', 'photo_id', 'gp_cv', 'occupational_health',
      'professional_references', 'appraisal_revalidation', 'basic_life_support',
      'level3_adult_safeguarding', 'level3_child_safeguarding', 'information_governance',
      'autism_learning_disability', 'equality_diversity', 'health_safety_welfare',
      'conflict_resolution', 'fire_safety', 'infection_prevention', 'moving_handling',
      'preventing_radicalisation'
    ];

    return documentTypes.map(type => ({
      id: type,
      ...this.getDocumentConfig(type)
    })).filter(config => config.required);
  }

}));
