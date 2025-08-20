'use strict';

/**
 * Business Verification Service
 * Automatically manages business verification status based on compliance documents
 */

module.exports = () => ({

  /**
   * Check if all required documents are verified for a business
   */
  async checkBusinessVerificationStatus(businessId) {
    try {
      console.log(`🔍 Checking verification status for business ${businessId}...`);

      // Get all documents for this business
      const documents = await strapi.entityService.findMany('api::business-compliance-document.business-compliance-document', {
        filters: {
          business: businessId
        },
        populate: {
          business: true
        }
      });

      console.log(`📄 Found ${documents.length} documents for business ${businessId}`);

      if (documents.length === 0) {
        console.log(`❌ No documents found for business ${businessId} - cannot be verified`);
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

      // Get required document types for business
      const complianceService = strapi.service('api::business-compliance-document.business-compliance-document');
      const requiredDocumentTypes = complianceService.getRequiredDocumentTypes();
      
      // Check if all required documents are present and verified
      let allDocumentsVerified = true;
      let hasExpiredOrRejectedDocuments = false;
      const rejectedDocuments = [];
      const expiredDocuments = [];
      const pendingDocuments = [];
      const verifiedDocuments = [];
      const missingDocuments = [];

      // Create a map of uploaded documents by type
      const documentsByType = {};
      documents.forEach(doc => {
        documentsByType[doc.documentType] = doc;
      });

      // Check each required document type
      for (const requiredDoc of requiredDocumentTypes) {
        const doc = documentsByType[requiredDoc.id];
        const docName = requiredDoc.name;
        
        if (!doc) {
          // Document is missing
          allDocumentsVerified = false;
          missingDocuments.push(docName);
          console.log(`❌ Missing required document: ${docName}`);
          continue;
        }

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
        missingDocuments,
        rejectedDocuments,
        expiredDocuments,
        pendingDocuments,
        verifiedDocuments,
        totalDocuments: requiredDocumentTypes.length,
        uploadedDocuments: documents.length,
        verifiedCount: verifiedDocuments.length,
        reason: allDocumentsVerified 
          ? 'All required documents verified' 
          : `Issues found: ${[
              ...(missingDocuments.length > 0 ? [`${missingDocuments.length} missing`] : []),
              ...(rejectedDocuments.length > 0 ? [`${rejectedDocuments.length} rejected`] : []),
              ...(expiredDocuments.length > 0 ? [`${expiredDocuments.length} expired`] : []),
              ...(pendingDocuments.length > 0 ? [`${pendingDocuments.length} pending`] : [])
            ].join(', ')}`
      };

      console.log(`📊 Verification summary for business ${businessId}:`);
      console.log(`   Total required documents: ${result.totalDocuments}`);
      console.log(`   Uploaded documents: ${result.uploadedDocuments}`);
      console.log(`   Verified: ${result.verifiedCount}`);
      console.log(`   Missing: ${missingDocuments.length}`);
      console.log(`   Pending: ${pendingDocuments.length}`);
      console.log(`   Rejected: ${rejectedDocuments.length}`);
      console.log(`   Expired: ${expiredDocuments.length}`);
      console.log(`   Should be verified: ${result.shouldBeVerified}`);

      return result;

    } catch (error) {
      console.error('Error checking business verification status:', error);
      throw error;
    }
  },

  /**
   * Update business verification status based on compliance documents
   */
  async updateBusinessVerificationStatus(businessId) {
    try {
      console.log(`🔄 Updating verification status for business ${businessId}...`);

      // Get current business
      const business = await strapi.entityService.findOne('api::business.business', businessId);
      if (!business) {
        console.log(`❌ Business ${businessId} not found`);
        return { success: false, error: 'Business not found' };
      }

      // Check verification status
      const verificationCheck = await this.checkBusinessVerificationStatus(businessId);
      const shouldBeVerified = verificationCheck.shouldBeVerified;

      console.log(`📊 Verification check result for business ${businessId}:`);
      console.log(`   Should be verified: ${shouldBeVerified}`);
      console.log(`   Currently verified: ${business.isVerified}`);
      console.log(`   Verified documents: ${verificationCheck.verifiedCount}/${verificationCheck.totalDocuments}`);

      // Only update if status needs to change
      if (business.isVerified !== shouldBeVerified) {
        await strapi.entityService.update('api::business.business', businessId, {
          data: {
            isVerified: shouldBeVerified,
            verificationStatusUpdatedAt: new Date(),
            verificationStatusReason: verificationCheck.reason
          }
        });

        console.log(`✅ Updated business ${businessId} verification status to: ${shouldBeVerified}`);

        // Log the status change
        await this.logVerificationStatusChange(businessId, business.isVerified, shouldBeVerified, verificationCheck);

        return {
          success: true,
          statusChanged: true,
          previousStatus: business.isVerified,
          newStatus: shouldBeVerified,
          verificationCheck
        };
      } else {
        console.log(`📋 Business ${businessId} verification status unchanged: ${shouldBeVerified}`);
        return {
          success: true,
          statusChanged: false,
          currentStatus: shouldBeVerified,
          verificationCheck
        };
      }

    } catch (error) {
      console.error('Error updating business verification status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Log verification status changes for audit trail
   */
  async logVerificationStatusChange(businessId, previousStatus, newStatus, verificationCheck) {
    try {
      const logEntry = {
        businessId,
        previousStatus,
        newStatus,
        changedAt: new Date(),
        reason: verificationCheck.reason,
        verificationDetails: {
          totalDocuments: verificationCheck.totalDocuments,
          uploadedDocuments: verificationCheck.uploadedDocuments,
          verifiedCount: verificationCheck.verifiedCount,
          missingCount: verificationCheck.missingDocuments?.length || 0,
          pendingCount: verificationCheck.pendingDocuments?.length || 0,
          rejectedCount: verificationCheck.rejectedDocuments?.length || 0,
          expiredCount: verificationCheck.expiredDocuments?.length || 0,
          missingDocuments: verificationCheck.missingDocuments,
          pendingDocuments: verificationCheck.pendingDocuments,
          rejectedDocuments: verificationCheck.rejectedDocuments,
          expiredDocuments: verificationCheck.expiredDocuments
        }
      };

      console.log('📝 Business verification status change logged:', logEntry);
      
      // Could save to a dedicated audit table if needed
      // For now, just log to console
      
      return logEntry;
    } catch (error) {
      console.error('Error logging business verification status change:', error);
    }
  },

  /**
   * Check and update verification status for all businesses
   * Useful for batch operations or cron jobs
   */
  async updateAllBusinessesVerificationStatus() {
    try {
      console.log('🔄 Starting batch business verification status update...');

      const businesses = await strapi.entityService.findMany('api::business.business', {
        limit: -1
      });

      console.log(`👥 Found ${businesses.length} businesses to update`);

      const results = {
        total: businesses.length,
        updated: 0,
        unchanged: 0,
        errors: 0,
        details: []
      };

      for (const business of businesses) {
        try {
          const result = await this.updateBusinessVerificationStatus(business.id);
          
          if (result.success && result.statusChanged) {
            results.updated++;
          } else if (result.success) {
            results.unchanged++;
          } else {
            results.errors++;
          }

          results.details.push({
            businessId: business.id,
            businessName: business.businessName,
            result
          });

        } catch (error) {
          console.error(`Error updating business ${business.id}:`, error);
          results.errors++;
          results.details.push({
            businessId: business.id,
            businessName: business.businessName,
            result: { success: false, error: error.message }
          });
        }
      }

      console.log('📊 Batch business verification update completed:');
      console.log(`   Total businesses: ${results.total}`);
      console.log(`   Updated: ${results.updated}`);
      console.log(`   Unchanged: ${results.unchanged}`);
      console.log(`   Errors: ${results.errors}`);

      return results;

    } catch (error) {
      console.error('Error in batch business verification update:', error);
      throw error;
    }
  },

  /**
   * Set all businesses with no compliance documents to unverified
   */
  async updateBusinessesWithoutDocuments() {
    try {
      console.log('🔄 Updating verification status for businesses without compliance documents...');

      const businesses = await strapi.entityService.findMany('api::business.business', {
        limit: -1
      });

      console.log(`👥 Found ${businesses.length} businesses to check`);

      const results = {
        total: businesses.length,
        businessesWithoutDocs: 0,
        updated: 0,
        alreadyUnverified: 0,
        errors: 0,
        details: []
      };

      for (const business of businesses) {
        try {
          // Check if business has any compliance documents
          const documents = await strapi.entityService.findMany('api::business-compliance-document.business-compliance-document', {
            filters: {
              business: business.id
            }
          });

          if (documents.length === 0) {
            results.businessesWithoutDocs++;
            
            // If business has no documents and isVerified is true, set to false
            if (business.isVerified === true) {
              await strapi.entityService.update('api::business.business', business.id, {
                data: {
                  isVerified: false,
                  verificationStatusUpdatedAt: new Date(),
                  verificationStatusReason: 'No compliance documents uploaded'
                }
              });

              console.log(`✅ Updated business ${business.id} (${business.businessName}) - set to unverified (no documents)`);
              results.updated++;

              results.details.push({
                businessId: business.id,
                businessName: business.businessName,
                action: 'Updated to unverified',
                reason: 'No documents uploaded'
              });
            } else {
              console.log(`📋 Business ${business.id} (${business.businessName}) already unverified (no documents)`);
              results.alreadyUnverified++;

              results.details.push({
                businessId: business.id,
                businessName: business.businessName,
                action: 'Already unverified',
                reason: 'No documents uploaded'
              });
            }
          }

        } catch (error) {
          console.error(`Error checking business ${business.id}:`, error);
          results.errors++;
          results.details.push({
            businessId: business.id,
            businessName: business.businessName,
            action: 'Error',
            error: error.message
          });
        }
      }

      console.log('📊 Businesses without documents update completed:');
      console.log(`   Total businesses: ${results.total}`);
      console.log(`   Businesses without documents: ${results.businessesWithoutDocs}`);
      console.log(`   Updated to unverified: ${results.updated}`);
      console.log(`   Already unverified: ${results.alreadyUnverified}`);
      console.log(`   Errors: ${results.errors}`);

      return results;

    } catch (error) {
      console.error('Error in businesses without documents update:', error);
      throw error;
    }
  }

});
