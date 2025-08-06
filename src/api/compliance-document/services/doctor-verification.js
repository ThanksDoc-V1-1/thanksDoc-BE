'use strict';

/**
 * Doctor Verification Service
 * Automatically manages doctor verification status based on compliance documents
 */

module.exports = () => ({

  /**
   * Check if all required documents are verified for a doctor
   */
  async checkDoctorVerificationStatus(doctorId) {
    try {
      console.log(`🔍 Checking verification status for doctor ${doctorId}...`);

      // Get all required document types
      const requiredDocumentTypes = await this.getRequiredDocumentTypes();
      console.log(`📋 Found ${requiredDocumentTypes.length} required document types`);

      // Get all documents for this doctor
      const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: {
          doctor: doctorId
        },
        populate: {
          doctor: true
        }
      });

      console.log(`📄 Found ${documents.length} documents for doctor ${doctorId}`);

      // Group documents by document type (string field)
      const documentsByType = {};
      documents.forEach(doc => {
        if (doc.documentType) {
          documentsByType[doc.documentType] = doc;
        }
      });

      let allRequiredDocumentsVerified = true;
      let hasExpiredOrRejectedDocuments = false;
      const missingDocuments = [];
      const rejectedDocuments = [];
      const expiredDocuments = [];

      // Check each required document type
      for (const docType of requiredDocumentTypes) {
        const doc = documentsByType[docType.name];
        
        if (!doc) {
          // Document is missing
          allRequiredDocumentsVerified = false;
          missingDocuments.push(docType.name);
          console.log(`❌ Missing document: ${docType.name}`);
          continue;
        }

        // Check verification status
        if (doc.verificationStatus === 'rejected') {
          allRequiredDocumentsVerified = false;
          hasExpiredOrRejectedDocuments = true;
          rejectedDocuments.push(docType.name);
          console.log(`❌ Rejected document: ${docType.name}`);
          continue;
        }

        if (doc.verificationStatus !== 'verified') {
          allRequiredDocumentsVerified = false;
          console.log(`⏳ Pending document: ${docType.name} (status: ${doc.verificationStatus})`);
          continue;
        }

        // Check if document is expired
        if (doc.autoExpiry && doc.expiryDate) {
          const expiryDate = new Date(doc.expiryDate);
          const today = new Date();
          
          if (expiryDate < today) {
            allRequiredDocumentsVerified = false;
            hasExpiredOrRejectedDocuments = true;
            expiredDocuments.push(docType.name);
            console.log(`❌ Expired document: ${docType.name}`);
            continue;
          }
        }

        console.log(`✅ Verified document: ${docType.name}`);
      }

      return {
        shouldBeVerified: allRequiredDocumentsVerified,
        hasExpiredOrRejectedDocuments,
        missingDocuments,
        rejectedDocuments,
        expiredDocuments,
        totalRequired: requiredDocumentTypes.length,
        verifiedCount: requiredDocumentTypes.length - missingDocuments.length - rejectedDocuments.length - expiredDocuments.length
      };

    } catch (error) {
      console.error('Error checking doctor verification status:', error);
      throw error;
    }
  },

  /**
   * Update doctor verification status based on compliance documents
   */
  async updateDoctorVerificationStatus(doctorId) {
    try {
      console.log(`🔄 Updating verification status for doctor ${doctorId}...`);

      // Get current doctor
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId);
      if (!doctor) {
        console.log(`❌ Doctor ${doctorId} not found`);
        return { success: false, error: 'Doctor not found' };
      }

      // Check verification status
      const verificationCheck = await this.checkDoctorVerificationStatus(doctorId);
      const shouldBeVerified = verificationCheck.shouldBeVerified;

      console.log(`📊 Verification check result for doctor ${doctorId}:`);
      console.log(`   Should be verified: ${shouldBeVerified}`);
      console.log(`   Currently verified: ${doctor.isVerified}`);
      console.log(`   Verified documents: ${verificationCheck.verifiedCount}/${verificationCheck.totalRequired}`);

      // Only update if status needs to change
      if (doctor.isVerified !== shouldBeVerified) {
        await strapi.entityService.update('api::doctor.doctor', doctorId, {
          data: {
            isVerified: shouldBeVerified,
            verificationStatusUpdatedAt: new Date(),
            verificationStatusReason: shouldBeVerified 
              ? 'All required compliance documents verified'
              : `Missing/expired/rejected documents: ${[
                  ...verificationCheck.missingDocuments,
                  ...verificationCheck.rejectedDocuments,
                  ...verificationCheck.expiredDocuments
                ].join(', ')}`
          }
        });

        console.log(`✅ Updated doctor ${doctorId} verification status to: ${shouldBeVerified}`);

        // Log the status change
        await this.logVerificationStatusChange(doctorId, doctor.isVerified, shouldBeVerified, verificationCheck);

        return {
          success: true,
          statusChanged: true,
          previousStatus: doctor.isVerified,
          newStatus: shouldBeVerified,
          verificationCheck
        };
      } else {
        console.log(`📋 Doctor ${doctorId} verification status unchanged: ${shouldBeVerified}`);
        return {
          success: true,
          statusChanged: false,
          currentStatus: shouldBeVerified,
          verificationCheck
        };
      }

    } catch (error) {
      console.error('Error updating doctor verification status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all required document types for verification
   */
  async getRequiredDocumentTypes() {
    try {
      // Get document types directly from the database
      const documentTypes = await strapi.entityService.findMany('api::compliance-document-type.compliance-document-type', {
        filters: {
          isRequired: true
        }
      });
      
      console.log(`📋 Found ${documentTypes.length} required document types from database`);
      return documentTypes;
    } catch (error) {
      console.error('Error getting required document types:', error);
      // Fallback to empty array - this will mean no verification requirements
      console.log('⚠️ Using fallback: no required documents');
      return [];
    }
  },

  /**
   * Log verification status changes for audit trail
   */
  async logVerificationStatusChange(doctorId, previousStatus, newStatus, verificationCheck) {
    try {
      const logEntry = {
        doctorId,
        previousStatus,
        newStatus,
        changedAt: new Date(),
        reason: newStatus 
          ? 'All required compliance documents verified'
          : `Issues with documents: ${[
              ...verificationCheck.missingDocuments,
              ...verificationCheck.rejectedDocuments,
              ...verificationCheck.expiredDocuments
            ].join(', ')}`,
        verificationDetails: verificationCheck
      };

      console.log('📝 Verification status change logged:', logEntry);
      
      // Could save to a dedicated audit table if needed
      // For now, just log to console
      
      return logEntry;
    } catch (error) {
      console.error('Error logging verification status change:', error);
    }
  },

  /**
   * Check and update verification status for all doctors
   * Useful for batch operations or cron jobs
   */
  async updateAllDoctorsVerificationStatus() {
    try {
      console.log('🔄 Starting batch verification status update for all doctors...');

      // Get all doctors
      const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
        limit: -1
      });

      console.log(`👥 Found ${doctors.length} doctors to check`);

      const results = {
        total: doctors.length,
        updated: 0,
        unchanged: 0,
        errors: 0,
        details: []
      };

      for (const doctor of doctors) {
        try {
          const result = await this.updateDoctorVerificationStatus(doctor.id);
          
          if (result.success) {
            if (result.statusChanged) {
              results.updated++;
            } else {
              results.unchanged++;
            }
          } else {
            results.errors++;
          }

          results.details.push({
            doctorId: doctor.id,
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            result
          });

        } catch (error) {
          console.error(`Error updating doctor ${doctor.id}:`, error);
          results.errors++;
          results.details.push({
            doctorId: doctor.id,
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            result: { success: false, error: error.message }
          });
        }
      }

      console.log('📊 Batch verification update completed:');
      console.log(`   Total doctors: ${results.total}`);
      console.log(`   Updated: ${results.updated}`);
      console.log(`   Unchanged: ${results.unchanged}`);
      console.log(`   Errors: ${results.errors}`);

      return results;

    } catch (error) {
      console.error('Error in batch verification update:', error);
      throw error;
    }
  }

});
