const Strapi = require('@strapi/strapi');

async function fixVerificationStatus() {
  const strapi = Strapi();
  
  try {
    await strapi.load();
    
    // Get all compliance documents
    const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document');
    
    console.log(`Found ${documents.length} documents to check...`);
    
    for (const doc of documents) {
      // If verificationStatus is null or undefined, set it to 'pending'
      if (!doc.verificationStatus) {
        await strapi.entityService.update('api::compliance-document.compliance-document', doc.id, {
          data: {
            verificationStatus: 'pending'
          }
        });
        console.log(`Updated document ${doc.id} - set verificationStatus to 'pending'`);
      } else {
        console.log(`Document ${doc.id} already has verificationStatus: ${doc.verificationStatus}`);
      }
    }
    
    console.log('✅ Verification status fix completed');
    await strapi.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing verification status:', error);
    await strapi.destroy();
    process.exit(1);
  }
}

// Run the fix
fixVerificationStatus();
