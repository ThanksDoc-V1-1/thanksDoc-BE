const axios = require('axios');

/**
 * Fix script using documentId for Strapi v5 compatibility
 */

async function fixServiceVisibilityIssues() {
  console.log('🔧 Fixing Service Visibility Issues (v3 - Using documentId)');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get all services
    console.log('\n📊 Step 1: Fetching all services...');
    const allResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
    const allServices = allResponse.data.data || [];
    console.log(`Found ${allServices.length} total services`);

    // Log the structure of a few services to understand the ID system
    console.log('\n🔍 Sample service structure:');
    if (allServices.length > 0) {
      const sample = allServices[0];
      console.log('Sample service keys:', Object.keys(sample));
      console.log('Sample service ID info:', {
        id: sample.id,
        documentId: sample.documentId,
        name: sample.name
      });
    }

    // Step 2: Identify services that need fixing
    console.log('\n🔍 Step 2: Identifying services that need fixing...');
    
    const servicesToFix = [];
    
    // Services missing serviceType field
    const missingServiceType = allServices.filter(service => !service.serviceType);
    console.log(`Found ${missingServiceType.length} services missing serviceType`);
    
    missingServiceType.forEach(service => {
      servicesToFix.push({
        id: service.id,
        documentId: service.documentId,
        name: service.name,
        issue: 'missing serviceType',
        fix: { serviceType: 'subcategory' },
        currentData: service
      });
    });

    // The "Online Consultation" service that should be subcategory
    const onlineConsultationService = allServices.find(service => 
      service.serviceType === 'main' && 
      service.name && 
      service.name.toLowerCase().includes('online consultation')
    );
    
    if (onlineConsultationService) {
      servicesToFix.push({
        id: onlineConsultationService.id,
        documentId: onlineConsultationService.documentId,
        name: onlineConsultationService.name,
        issue: 'should be subcategory',
        fix: { serviceType: 'subcategory' },
        currentData: onlineConsultationService
      });
    }

    console.log(`\nTotal services to fix: ${servicesToFix.length}`);

    // Step 3: Try multiple ID approaches
    console.log('\n🔧 Step 3: Applying fixes with different ID approaches...');
    let successCount = 0;
    let errorCount = 0;

    for (const item of servicesToFix) {
      try {
        console.log(`\nUpdating service: ${item.name}`);
        console.log(`  Regular ID: ${item.id}`);
        console.log(`  Document ID: ${item.documentId}`);
        
        // Create minimal update payload
        const updatePayload = {
          data: {
            serviceType: item.fix.serviceType
          }
        };

        let updateResponse = null;
        let updateSuccess = false;

        // Try documentId first (Strapi v5)
        if (item.documentId && !updateSuccess) {
          try {
            console.log(`  Trying with documentId: ${item.documentId}`);
            updateResponse = await axios.put(
              `http://localhost:1337/api/services/${item.documentId}`,
              updatePayload
            );
            updateSuccess = true;
            console.log(`  ✅ Success with documentId`);
          } catch (docIdError) {
            console.log(`  ❌ Failed with documentId: ${docIdError.response?.status}`);
          }
        }

        // Try regular id (Strapi v4)
        if (!updateSuccess) {
          try {
            console.log(`  Trying with regular id: ${item.id}`);
            updateResponse = await axios.put(
              `http://localhost:1337/api/services/${item.id}`,
              updatePayload
            );
            updateSuccess = true;
            console.log(`  ✅ Success with regular id`);
          } catch (idError) {
            console.log(`  ❌ Failed with regular id: ${idError.response?.status}`);
          }
        }

        if (updateSuccess) {
          console.log(`✅ Successfully updated: ${item.name}`);
          successCount++;
        } else {
          console.log(`❌ Failed to update: ${item.name}`);
          errorCount++;
        }
        
      } catch (updateError) {
        console.log(`❌ Unexpected error updating ${item.name}:`, updateError.message);
        errorCount++;
      }
    }

    // Step 4: Verify fixes
    console.log('\n✅ Step 4: Verifying fixes...');
    console.log(`Successfully updated: ${successCount} services`);
    console.log(`Failed to update: ${errorCount} services`);

    if (successCount > 0) {
      console.log('\n🔍 Checking subcategory services after fixes...');
      const verifyResponse = await axios.get('http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&pagination[limit]=100');
      const subcategoryServices = verifyResponse.data.data || [];
      console.log(`Now ${subcategoryServices.length} services are marked as subcategory`);
      
      // Check if "Online Consultation" is now visible
      const onlineConsultation = subcategoryServices.find(s => 
        s.name && s.name.toLowerCase().includes('online consultation')
      );
      
      if (onlineConsultation) {
        console.log('✅ "Online Consultation" is now visible as subcategory!');
      } else {
        console.log('⚠️  "Online Consultation" still not found in subcategory services');
      }

      // Show online services specifically since that was the user's example
      const onlineSubcategoryServices = subcategoryServices.filter(s => s.category === 'online');
      console.log(`\n💻 Online subcategory services (${onlineSubcategoryServices.length}):`);
      onlineSubcategoryServices.forEach(service => {
        console.log(`  - ${service.name}`);
      });
    }

    console.log('\n🎉 Fix process completed!');
    
    if (successCount > 0) {
      console.log('\n🎯 What to test now:');
      console.log('1. Go to Business dashboard → Create service request → Check service dropdown');
      console.log('2. Go to Doctor dashboard → Manage Services → Check available services');
      console.log('3. Go to Admin dashboard → Services section → Verify all services still visible');
      console.log('4. Specifically look for "Online Consultation" in business service dropdown');
    } else {
      console.log('\n⚠️  No services were successfully updated. The issue might be:');
      console.log('1. Authentication required for updates');
      console.log('2. Different API endpoint structure');
      console.log('3. Permission restrictions');
    }

  } catch (error) {
    console.error('💥 Fix script failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the fix
fixServiceVisibilityIssues().then(() => {
  console.log('\n✅ Fix script completed');
}).catch(error => {
  console.error('💥 Fix script error:', error);
});
