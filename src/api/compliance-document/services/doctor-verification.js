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

      if (documents.length === 0) {
        console.log(`❌ No documents found for doctor ${doctorId} - cannot be verified`);
        return {
          shouldBeVerified: false,
          hasExpiredOrRejectedDocuments: false,
          missingDocuments: [],
          rejectedDocuments: [],
          expiredDocuments: [],
          pendingDocuments: [],
          totalDocuments: 0,
          verifiedCount: 0,
          reason: 'No documents uploaded'
        };
      }

      let allDocumentsVerified = true;
      let hasExpiredOrRejectedDocuments = false;
      const rejectedDocuments = [];
      const expiredDocuments = [];
      const pendingDocuments = [];
      const verifiedDocuments = [];

      // Check each document's verification status
      for (const doc of documents) {
        const docName = doc.documentType || `Document ${doc.id}`;
        
        // Check verification status
        if (doc.verificationStatus === 'rejected') {
          allDocumentsVerified = false;
          hasExpiredOrRejectedDocuments = true;
          rejectedDocuments.push(docName);
          console.log(`❌ Rejected document: ${docName}`);
          continue;
        }

        if (doc.verificationStatus === 'pending' || !doc.verificationStatus) {
          allDocumentsVerified = false;
          pendingDocuments.push(docName);
          console.log(`⏳ Pending document: ${docName} (status: ${doc.verificationStatus || 'not set'})`);
          continue;
        }

        if (doc.verificationStatus !== 'verified') {
          allDocumentsVerified = false;
          pendingDocuments.push(docName);
          console.log(`⏳ Non-verified document: ${docName} (status: ${doc.verificationStatus})`);
          continue;
        }

        // Check if document is expired
        if (doc.autoExpiry && doc.expiryDate) {
          const expiryDate = new Date(doc.expiryDate);
          const today = new Date();
          
          if (expiryDate < today) {
            allDocumentsVerified = false;
            hasExpiredOrRejectedDocuments = true;
            expiredDocuments.push(docName);
            console.log(`❌ Expired document: ${docName} (expired: ${expiryDate.toDateString()})`);
            continue;
          }
        }

        // Document is verified and not expired
        verifiedDocuments.push(docName);
        console.log(`✅ Verified document: ${docName}`);
      }

      const result = {
        shouldBeVerified: allDocumentsVerified,
        hasExpiredOrRejectedDocuments,
        missingDocuments: [], // Not applicable since we check actual documents
        rejectedDocuments,
        expiredDocuments,
        pendingDocuments,
        verifiedDocuments,
        totalDocuments: documents.length,
        verifiedCount: verifiedDocuments.length,
        reason: allDocumentsVerified 
          ? 'All documents verified' 
          : `Issues found: ${[
              ...(rejectedDocuments.length > 0 ? [`${rejectedDocuments.length} rejected`] : []),
              ...(expiredDocuments.length > 0 ? [`${expiredDocuments.length} expired`] : []),
              ...(pendingDocuments.length > 0 ? [`${pendingDocuments.length} pending`] : [])
            ].join(', ')}`
      };

      console.log(`📊 Verification summary for doctor ${doctorId}:`);
      console.log(`   Total documents: ${result.totalDocuments}`);
      console.log(`   Verified: ${result.verifiedCount}`);
      console.log(`   Pending: ${pendingDocuments.length}`);
      console.log(`   Rejected: ${rejectedDocuments.length}`);
      console.log(`   Expired: ${expiredDocuments.length}`);
      console.log(`   Should be verified: ${result.shouldBeVerified}`);

      return result;

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
      console.log(`   Verified documents: ${verificationCheck.verifiedCount}/${verificationCheck.totalDocuments}`);

      // Only update if status needs to change
      if (doctor.isVerified !== shouldBeVerified) {
        await strapi.entityService.update('api::doctor.doctor', doctorId, {
          data: {
            isVerified: shouldBeVerified,
            verificationStatusUpdatedAt: new Date(),
            verificationStatusReason: verificationCheck.reason
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
   * Log verification status changes for audit trail
   */
  async logVerificationStatusChange(doctorId, previousStatus, newStatus, verificationCheck) {
    try {
      const logEntry = {
        doctorId,
        previousStatus,
        newStatus,
        changedAt: new Date(),
        reason: verificationCheck.reason,
        verificationDetails: {
          totalDocuments: verificationCheck.totalDocuments,
          verifiedCount: verificationCheck.verifiedCount,
          pendingCount: verificationCheck.pendingDocuments?.length || 0,
          rejectedCount: verificationCheck.rejectedDocuments?.length || 0,
          expiredCount: verificationCheck.expiredDocuments?.length || 0,
          pendingDocuments: verificationCheck.pendingDocuments,
          rejectedDocuments: verificationCheck.rejectedDocuments,
          expiredDocuments: verificationCheck.expiredDocuments
        }
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
