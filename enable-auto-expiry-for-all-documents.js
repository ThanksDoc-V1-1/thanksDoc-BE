#!/usr/bin/env node

/**
 * Script to enable auto-expiry tracking for all existing compliance document types
 * This ensures all documents have proper expiry tracking with appropriate validity periods
 */

async function enableAutoExpiryForAllDocuments() {
  console.log('🚀 Starting auto-expiry enablement for all compliance document types...');
  
  try {
    // Bootstrap Strapi application
    const Strapi = require('@strapi/strapi');
    const app = Strapi({ 
      dir: process.cwd(),
      autoReload: false,
      serveAdminPanel: false,
    });

    await app.load();
    console.log('✅ Strapi application loaded successfully');

    // Define appropriate validity periods for different document types
    const validityPeriods = {
      // Professional Documents - Different validity periods based on document type
      'gmc_registration': 1,           // GMC Registration - Annual renewal
      'current_performers_list': 1,    // Performers List - Annual renewal
      'cct_certificate': 5,            // CCT - 5 years (permanent qualification)
      'medical_indemnity': 1,          // Insurance - Annual renewal
      'dbs_check': 3,                  // DBS - 3 years standard
      'right_to_work': 2,              // Right to Work - 2 years for most visas
      'photo_id': 5,                   // Photo ID - 5 years (passport/driving license)
      'gp_cv': 1,                      // CV - Annual update
      'occupational_health': 2,        // Occupational Health - 2 years
      'professional_references': 3,    // References - 3 years
      'appraisal_revalidation': 1,     // Appraisal - Annual
      
      // Training Certificates - Standard validity periods
      'basic_life_support': 1,         // BLS - Annual renewal
      'level3_adult_safeguarding': 3,  // Adult Safeguarding - 3 years
      'level3_child_safeguarding': 3,  // Child Safeguarding - 3 years
      'information_governance': 1,     // IG Training - Annual
      'autism_learning_disability': 3, // Oliver McGowan - 3 years
      'equality_diversity': 3,         // E&D - 3 years
      'health_safety_welfare': 1,      // Health & Safety - Annual
      'conflict_resolution': 3,        // Conflict Resolution - 3 years
      'fire_safety': 1,                // Fire Safety - Annual
      'infection_prevention': 1,       // Infection Control - Annual
      'moving_handling': 1,            // Moving & Handling - Annual
      'preventing_radicalisation': 3   // Prevent Training - 3 years
    };

    // Get all existing compliance document types
    const documentTypes = await app.entityService.findMany('api::compliance-document-type.compliance-document-type', {
      limit: -1 // Get all records
    });

    console.log(`📋 Found ${documentTypes.length} existing document types`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Update each document type to enable auto-expiry
    for (const docType of documentTypes) {
      try {
        const key = docType.key;
        const validityYears = validityPeriods[key] || 3; // Default to 3 years if not specified
        
        // Check if auto-expiry is already enabled
        if (docType.autoExpiry) {
          console.log(`⏭️  Skipping ${docType.name} - auto-expiry already enabled`);
          skippedCount++;
          continue;
        }

        // Update the document type to enable auto-expiry
        const updatedDocType = await app.entityService.update('api::compliance-document-type.compliance-document-type', docType.id, {
          data: {
            autoExpiry: true,
            validityYears: validityYears,
            expiryWarningDays: docType.expiryWarningDays || 30
          }
        });

        console.log(`✅ Updated ${updatedDocType.name} - enabled auto-expiry with ${validityYears} year(s) validity`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error updating ${docType.name}:`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Updated: ${updatedCount} document types`);
    console.log(`⏭️  Skipped: ${skippedCount} document types (already enabled)`);
    console.log(`❌ Errors: ${errorCount} document types`);
    console.log(`📋 Total: ${documentTypes.length} document types processed`);

    if (updatedCount > 0) {
      console.log('\n🎉 Auto-expiry tracking has been enabled for all compliance documents!');
      console.log('📅 All documents will now automatically track expiry dates based on issue dates');
      console.log('⚠️  Doctors will receive warnings 30 days before document expiry');
      console.log('🔄 Document statuses will automatically update to "expired" after expiry date');
    }

    // Create or update existing documents to have auto-expiry enabled
    console.log('\n🔄 Updating existing compliance documents...');
    
    const existingDocuments = await app.entityService.findMany('api::compliance-document.compliance-document', {
      limit: -1,
      populate: ['documentType']
    });

    console.log(`📄 Found ${existingDocuments.length} existing compliance documents`);

    let documentsUpdated = 0;
    let documentsSkipped = 0;

    for (const doc of existingDocuments) {
      try {
        // Skip if document already has auto-expiry enabled or doesn't have an issue date
        if (doc.autoExpiry || !doc.issueDate) {
          documentsSkipped++;
          continue;
        }

        // Get the document type configuration
        const docTypeKey = doc.documentType?.key || doc.documentType;
        const validityYears = validityPeriods[docTypeKey] || 3;

        // Calculate expiry date from issue date
        const issueDate = new Date(doc.issueDate);
        const expiryDate = new Date(issueDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

        // Update the document to enable auto-expiry
        await app.entityService.update('api::compliance-document.compliance-document', doc.id, {
          data: {
            autoExpiry: true,
            expiryDate: expiryDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            validityYears: validityYears
          }
        });

        documentsUpdated++;

      } catch (error) {
        console.error(`❌ Error updating document ${doc.id}:`, error.message);
      }
    }

    console.log(`✅ Updated ${documentsUpdated} existing documents with auto-expiry`);
    console.log(`⏭️  Skipped ${documentsSkipped} documents (already enabled or missing issue date)`);

    console.log('\n🎯 Auto-expiry tracking is now fully enabled for all compliance documents!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close Strapi application
    process.exit(0);
  }
}

// Run the migration
enableAutoExpiryForAllDocuments();
